/**
 * Diff Engine for comparing policy trackers and detecting regressions
 */

class DiffEngine {
  /**
   * Create diff between previous and current trackers
   * @param {Array} previousTrackers - Previous scan results
   * @param {Array} currentTrackers - Current scan results
   * @returns {Object} Diff results with new, removed, and regression trackers
   */
  static createDiff(previousTrackers, currentTrackers) {
    const previousMap = new Map();
    const currentMap = new Map();
    
    // Build maps for efficient lookup
    previousTrackers.forEach(tracker => {
      previousMap.set(`${tracker.policyId}:${tracker.resourceId}`, tracker);
    });
    
    currentTrackers.forEach(tracker => {
      currentMap.set(`${tracker.policyId}:${tracker.resourceId}`, tracker);
    });
    
    const newTrackers = [];
    const removedTrackers = [];
    const regressions = [];
    
    // Find new trackers
    currentMap.forEach((tracker, key) => {
      if (!previousMap.has(key)) {
        newTrackers.push(tracker);
      }
    });
    
    // Find removed trackers
    previousMap.forEach((tracker, key) => {
      if (!currentMap.has(key)) {
        removedTrackers.push(tracker);
      }
    });
    
    // Detect regressions
    previousMap.forEach((previousTracker, key) => {
      const currentTracker = currentMap.get(key);
      
      if (currentTracker) {
        const regression = DiffEngine.detectRegression(previousTracker, currentTracker);
        if (regression) {
          regressions.push(regression);
        }
      }
    });
    
    return {
      newTrackers,
      removedTrackers,
      regressions,
      summary: {
        totalNew: newTrackers.length,
        totalRemoved: removedTrackers.length,
        totalRegressions: regressions.length
      }
    };
  }
  
  /**
   * Detect if a tracker shows signs of regression
   * @param {Object} previousTracker - Previous state of tracker
   * @param {Object} currentTracker - Current state of tracker
   * @returns {Object|null} Regression details or null if no regression
   */
  static detectRegression(previousTracker, currentTracker) {
    const regressionIndicators = [];
    
    // Check compliance score regression
    if (currentTracker.complianceScore < previousTracker.complianceScore) {
      regressionIndicators.push({
        type: 'COMPLIANCE_SCORE_DECREASED',
        previous: previousTracker.complianceScore,
        current: currentTracker.complianceScore,
        change: currentTracker.complianceScore - previousTracker.complianceScore
      });
    }
    
    // Check if policy became non-compliant
    if (!currentTracker.compliant && previousTracker.compliant) {
      regressionIndicators.push({
        type: 'POLICY_BECAME_NON_COMPLIANT',
        policyId: currentTracker.policyId,
        policyName: currentTracker.policyName
      });
    }
    
    // Check control failures
    if (currentTracker.controlFailures > previousTracker.controlFailures) {
      regressionIndicators.push({
        type: 'CONTROL_FAILURES_INCREASED',
        previous: previousTracker.controlFailures,
        current: currentTracker.controlFailures,
        change: currentTracker.controlFailures - previousTracker.controlFailures
      });
    }
    
    // Check for critical violations
    if (currentTracker.criticalViolations > previousTracker.criticalViolations) {
      regressionIndicators.push({
        type: 'CRITICAL_VIOLATIONS_INCREASED',
        previous: previousTracker.criticalViolations,
        current: currentTracker.criticalViolations,
        change: currentTracker.criticalViolations - previousTracker.criticalViolations
      });
    }
    
    // Check remediation status
    if (previousTracker.remediationStatus === 'COMPLETED' && 
        currentTracker.remediationStatus !== 'COMPLETED') {
      regressionIndicators.push({
        type: 'REMEDIATION_STATUS_REGRESSED',
        previous: previousTracker.remediationStatus,
        current: currentTracker.remediationStatus
      });
    }
    
    if (regressionIndicators.length > 0) {
      return {
        policyId: currentTracker.policyId,
        resourceId: currentTracker.resourceId,
        policyName: currentTracker.policyName,
        userId: currentTracker.userId,
        regressionIndicators,
        detectedAt: new Date().toISOString(),
        severity: this.calculateRegressionSeverity(regressionIndicators)
      };
    }
    
    return null;
  }
  
  /**
   * Calculate severity level for a regression
   * @param {Array} indicators - List of regression indicators
   * @returns {string} Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   */
  static calculateRegressionSeverity(indicators) {
    const severityScores = {
      'POLICY_BECAME_NON_COMPLIANT': 100,
      'CRITICAL_VIOLATIONS_INCREASED': 90,
      'COMPLIANCE_SCORE_DECREASED': 70,
      'CONTROL_FAILURES_INCREASED': 60,
      'REMEDIATION_STATUS_REGRESSED': 50
    };
    
    const maxScore = Math.max(...indicators.map(indicator => 
      severityScores[indicator.type] || 30
    ));
    
    if (maxScore >= 90) return 'CRITICAL';
    if (maxScore >= 70) return 'HIGH';
    if (maxScore >= 50) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Mark policies as stale in the database
   * @param {string} userId - User ID
   * @param {Array} regressions - List of detected regressions
   */
  static async markStalePolicies(userId, regressions) {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const POLICIES_TABLE = process.env.POLICIES_TABLE;
    
    for (const regression of regressions) {
      const updateParams = {
        TableName: POLICIES_TABLE,
        Key: {
          policyId: regression.policyId,
          userId: userId
        },
        UpdateExpression: 'SET stale = :stale, lastAlertedAt = :alertedAt, regressionSeverity = :severity',
        ExpressionAttributeValues: {
          ':stale': true,
          ':alerted': new Date().toISOString(),
          ':severity': regression.severity
        }
      };
      
      try {
        await dynamodb.update(updateParams).promise();
        console.log(`Marked policy ${regression.policyId} as stale for user ${userId}`);
      } catch (error) {
        console.error(`Failed to mark policy ${regression.policyId} as stale:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Validate tracker data structure
   * @param {Object} tracker - Tracker object to validate
   * @returns {Object} Validation result
   */
  static validateTracker(tracker) {
    const required = ['policyId', 'resourceId', 'userId'];
    const missing = required.filter(field => !tracker[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(', ')}`
      };
    }
    
    // Validate numeric fields
    const numericFields = ['complianceScore', 'controlFailures', 'criticalViolations'];
    for (const field of numericFields) {
      if (tracker[field] !== undefined && typeof tracker[field] !== 'number') {
        return {
          valid: false,
          error: `Field ${field} must be a number`
        };
      }
    }
    
    return { valid: true };
  }
}

module.exports = {
  createDiff: DiffEngine.createDiff,
  markStalePolicies: DiffEngine.markStalePolicies,
  validateTracker: DiffEngine.validateTracker
};