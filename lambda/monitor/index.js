const AWS = require('aws-sdk');
const { createDiff, markStalePolicies } = require('./diffEngine');
const { sendAlert } = require('../alerts/alertService');

const sqs = new AWS.SQS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const MONITOR_QUEUE_URL = process.env.MONITOR_QUEUE_URL;
const USERS_TABLE = process.env.USERS_TABLE;
const TRACKERS_TABLE = process.env.TRACKERS_TABLE;
const POLICIES_TABLE = process.env.POLICIES_TABLE;
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL;

exports.handler = async (event) => {
  console.log('Starting compliance monitoring cycle', { event });
  
  try {
    const users = await getActiveUsers();
    console.log(`Found ${users.length} active users to monitor`);
    
    const results = [];
    for (const user of users) {
      try {
        const result = await monitorUser(user);
        results.push(result);
      } catch (error) {
        console.error(`Error monitoring user ${user.userId}:`, error);
        await sendAlert({
          type: 'MONITORING_ERROR',
          userId: user.userId,
          message: `Failed to monitor user ${user.email}: ${error.message}`,
          severity: 'HIGH'
        });
      }
    }
    
    console.log('Monitoring cycle completed', { 
      totalUsers: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Monitoring cycle completed',
        results: results
      })
    };
  } catch (error) {
    console.error('Monitoring cycle failed:', error);
    await sendAlert({
      type: 'SYSTEM_ERROR',
      message: `Compliance monitoring failed: ${error.message}`,
      severity: 'CRITICAL'
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Monitoring cycle failed',
        message: error.message
      })
    };
  }
};

async function getActiveUsers() {
  const params = {
    TableName: USERS_TABLE,
    IndexName: 'ActiveUsersIndex',
    KeyConditionExpression: 'active = :active',
    ExpressionAttributeValues: {
      ':active': true
    }
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items || [];
}

async function monitorUser(user) {
  console.log(`Monitoring user: ${user.userId}`);
  
  try {
    // Get current trackers
    const currentTrackers = await getUserTrackers(user.userId);
    
    // Get previous scan results
    const lastScan = await getLastScan(user.userId);
    const previousTrackers = lastScan ? lastScan.trackers : [];
    
    // Enqueue scan job
    await enqueueScanJob({
      userId: user.userId,
      userEmail: user.email,
      currentTrackers: currentTrackers,
      scanType: 'DAILY_MONITORING'
    });
    
    // Compare trackers and detect changes
    const diff = createDiff(previousTrackers, currentTrackers);
    
    // Update last scan timestamp
    await updateLastScan(user.userId, currentTrackers);
    
    // Check for policy regressions
    if (diff.regressions.length > 0) {
      await handleRegressions(user, diff.regressions);
    }
    
    // Alert on new trackers if configured
    if (diff.newTrackers.length > 0 && user.alertOnNewTrackers) {
      await sendAlert({
        type: 'NEW_TRACKERS',
        userId: user.userId,
        userEmail: user.email,
        trackers: diff.newTrackers,
        message: `Found ${diff.newTrackers.length} new trackers for ${user.email}`,
        severity: 'MEDIUM'
      });
    }
    
    return {
      userId: user.userId,
      success: true,
      diff: {
        newTrackers: diff.newTrackers.length,
        removedTrackers: diff.removedTrackers.length,
        regressions: diff.regressions.length
      }
    };
  } catch (error) {
    console.error(`Failed to monitor user ${user.userId}:`, error);
    return {
      userId: user.userId,
      success: false,
      error: error.message
    };
  }
}

async function getUserTrackers(userId) {
  const params = {
    TableName: TRACKERS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items || [];
}

async function getLastScan(userId) {
  const params = {
    TableName: 'ComplianceScans',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false,
    Limit: 1
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items[0] || null;
}

async function updateLastScan(userId, trackers) {
  const timestamp = new Date().toISOString();
  
  const params = {
    TableName: 'ComplianceScans',
    Item: {
      userId: userId,
      scanTimestamp: timestamp,
      trackers: trackers,
      scanType: 'DAILY_MONITORING'
    }
  };
  
  await dynamodb.put(params).promise();
  
  // Update user monitoring metadata
  const updateParams = {
    TableName: USERS_TABLE,
    Key: { userId: userId },
    UpdateExpression: 'SET nextRunAt = :nextRun, lastMonitoredAt = :lastRun',
    ExpressionAttributeValues: {
      ':nextRun': getNextRunTime(),
      ':lastRun': timestamp
    }
  };
  
  await dynamodb.update(updateParams).promise();
}

async function enqueueScanJob(scanData) {
  const params = {
    QueueUrl: MONITOR_QUEUE_URL,
    MessageBody: JSON.stringify(scanData),
    MessageAttributes: {
      'scanType': {
        DataType: 'String',
        StringValue: scanData.scanType
      }
    }
  };
  
  await sqs.sendMessage(params).promise();
}

async function handleRegressions(user, regressions) {
  console.log(`Found ${regressions.length} regressions for user ${user.userId}`);
  
  // Mark policies as stale
  await markStalePolicies(user.userId, regressions);
  
  // Send alert
  await sendAlert({
    type: 'POLICY_REGRESSION',
    userId: user.userId,
    userEmail: user.email,
    regressions: regressions,
    message: `Policy regression detected for ${user.email}: ${regressions.length} policies show signs of regression`,
    severity: 'HIGH'
  });
  
  // Update user's last alert time
  const updateParams = {
    TableName: USERS_TABLE,
    Key: { userId: user.userId },
    UpdateExpression: 'SET lastAlertAt = :lastAlert',
    ExpressionAttributeValues: {
      ':lastAlert': new Date().toISOString()
    }
  };
  
  await dynamodb.update(updateParams).promise();
}

function getNextRunTime() {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setDate(nextRun.getDate() + 1); // Run daily
  return nextRun.toISOString();
}