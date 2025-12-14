const axios = require('axios');
const AWS = require('aws-sdk');

// Initialize AWS services
const secretsManager = new AWS.SecretsManager();

class AlertService {
  constructor() {
    this.secrets = {};
    this.cache = new Map();
    this.CACHE_TTL = 300000; // 5 minutes
  }
  
  /**
   * Send alert via configured channels (SendGrid, Slack)
   * @param {Object} alertData - Alert information
   * @param {string} alertData.type - Alert type (MONITORING_ERROR, POLICY_REGRESSION, etc.)
   * @param {string} alertData.userId - User ID (optional)
   * @param {string} alertData.userEmail - User email (optional)
   * @param {string} alertData.message - Alert message
   * @param {string} alertData.severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {Array} alertData.trackers - List of trackers (for new trackers alerts)
   * @param {Array} alertData.regressions - List of regressions (for regression alerts)
   */
  async sendAlert(alertData) {
    console.log('Sending alert:', JSON.stringify(alertData, null, 2));
    
    try {
      const channels = await this.getConfiguredChannels();
      const results = [];
      
      for (const channel of channels) {
        try {
          const result = await this.sendToChannel(channel, alertData);
          results.push({ channel: channel.type, success: true, result });
        } catch (error) {
          console.error(`Failed to send alert to ${channel.type}:`, error);
          results.push({ channel: channel.type, success: false, error: error.message });
        }
      }
      
      // Log alert for audit purposes
      await this.logAlert(alertData, results);
      
      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Failed to process alert:', error);
      throw error;
    }
  }
  
  /**
   * Send test alert for admin testing
   * @param {Object} testConfig - Test configuration
   * @param {string} testConfig.email - Test email address
   * @param {Array} testConfig.channels - Channels to test
   */
  async sendTestAlert(testConfig) {
    const testAlert = {
      type: 'TEST_ALERT',
      message: 'This is a test alert from the compliance monitoring system',
      severity: 'LOW',
      testMode: true,
      timestamp: new Date().toISOString(),
      config: testConfig
    };
    
    return await this.sendAlert(testAlert);
  }
  
  /**
   * Get configured alert channels from environment
   */
  async getConfiguredChannels() {
    const channels = [];
    
    // Check if SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
      channels.push({
        type: 'email',
        enabled: true
      });
    }
    
    // Check if Slack is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      channels.push({
        type: 'slack',
        enabled: true
      });
    }
    
    return channels;
  }
  
  /**
   * Send alert to specific channel
   * @param {Object} channel - Channel configuration
   * @param {Object} alertData - Alert data
   */
  async sendToChannel(channel, alertData) {
    switch (channel.type) {
      case 'email':
        return await this.sendEmail(alertData);
      case 'slack':
        return await this.sendSlackMessage(alertData);
      default:
        throw new Error(`Unknown channel type: ${channel.type}`);
    }
  }
  
  /**
   * Send email via SendGrid
   * @param {Object} alertData - Alert data
   */
  async sendEmail(alertData) {
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured');
    }
    
    const fromEmail = process.env.ALERT_FROM_EMAIL || 'alerts@compliance-system.com';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
    
    // Determine recipients
    const recipients = alertData.userEmail ? [alertData.userEmail] : [adminEmail];
    
    // Create email content
    const emailContent = this.createEmailContent(alertData);
    
    const emailData = {
      personalizations: recipients.map(email => ({
        to: [{ email }],
        subject: emailContent.subject
      })),
      from: {
        email: fromEmail,
        name: 'Compliance Monitor'
      },
      content: [
        {
          type: 'text/html',
          value: emailContent.html
        }
      ]
    };
    
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      emailData,
      {
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status !== 202) {
      throw new Error(`SendGrid API returned status ${response.status}`);
    }
    
    return {
      channel: 'email',
      recipients: recipients,
      messageId: response.headers['x-message-id'] || 'unknown'
    };
  }
  
  /**
   * Send Slack message via webhook
   * @param {Object} alertData - Alert data
   */
  async sendSlackMessage(alertData) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }
    
    const slackMessage = this.createSlackMessage(alertData);
    
    const response = await axios.post(webhookUrl, slackMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Slack API returned status ${response.status}`);
    }
    
    return {
      channel: 'slack',
      timestamp: response.data.ts || 'unknown'
    };
  }
  
  /**
   * Escape HTML characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Create email content based on alert type
   * @param {Object} alertData - Alert data
   * @returns {Object} Email content with subject and HTML
   */
  createEmailContent(alertData) {
    const severityEmojis = {
      'LOW': '⚪',
      'MEDIUM': '🟡',
      'HIGH': '🟠',
      'CRITICAL': '🔴'
    };
    
    const emoji = severityEmojis[alertData.severity] || '⚪';
    const message = this.escapeHtml(alertData.message || '');
    const userEmail = this.escapeHtml(alertData.userEmail || '');
    
    let subject = `${emoji} Compliance Alert: ${alertData.type}`;
    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 8px; }
            .alert-type { background-color: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
            .severity { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
            .severity-LOW { background-color: #4caf50; }
            .severity-MEDIUM { background-color: #ff9800; }
            .severity-HIGH { background-color: #f44336; }
            .severity-CRITICAL { background-color: #9c27b0; }
            .content { margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${emoji} Compliance Monitor Alert</h1>
          </div>
          <div class="alert-type">
            <strong>Alert Type:</strong> ${alertData.type}
          </div>
          <div class="content">
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Severity:</strong> 
              <span class="severity severity-${alertData.severity}">${alertData.severity}</span>
            </p>
            ${userEmail ? `<p><strong>User:</strong> ${userEmail}</p>` : ''}
            <p><strong>Timestamp:</strong> ${alertData.timestamp || new Date().toISOString()}</p>
    `;
    
    // Add specific content based on alert type
    if (alertData.type === 'POLICY_REGRESSION' && alertData.regressions) {
      html += `
        <h3>Detected Regressions:</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr style="background-color: #f5f5f5;">
            <th>Policy</th>
            <th>Severity</th>
            <th>Indicators</th>
          </tr>
      `;
      
      alertData.regressions.forEach(regression => {
        html += `
          <tr>
            <td>${this.escapeHtml(regression.policyName)}</td>
            <td>${this.escapeHtml(regression.severity)}</td>
            <td>${this.escapeHtml(regression.regressionIndicators.map(i => i.type).join(', '))}</td>
          </tr>
        `;
      });
      
      html += '</table>';
    }
    
    if (alertData.type === 'NEW_TRACKERS' && alertData.trackers) {
      html += `
        <h3>New Trackers Detected:</h3>
        <ul>
      `;
      
      alertData.trackers.forEach(tracker => {
        html += `
          <li>
            <strong>${this.escapeHtml(tracker.policyName)}</strong> - 
            Resource: ${this.escapeHtml(tracker.resourceId)} - 
            Score: ${tracker.complianceScore}%
          </li>
        `;
      });
      
      html += '</ul>';
    }
    
    html += `
          </div>
          <div class="footer">
            <p>This is an automated alert from the Compliance Monitoring System.</p>
            <p>Please investigate the issues promptly to maintain compliance.</p>
          </div>
        </body>
      </html>
    `;
    
    return { subject, html };
  }
  
  /**
   * Create Slack message payload
   * @param {Object} alertData - Alert data
   * @returns {Object} Slack message object
   */
  createSlackMessage(alertData) {
    const severityColors = {
      'LOW': '#36a64f',
      'MEDIUM': '#ffb347',
      'HIGH': '#ff6b6b',
      'CRITICAL': '#9c27b0'
    };
    
    const attachments = [{
      color: severityColors[alertData.severity] || '#36a64f',
      title: `Compliance Alert: ${alertData.type}`,
      text: alertData.message,
      fields: [
        {
          title: 'Severity',
          value: alertData.severity,
          short: true
        },
        {
          title: 'Timestamp',
          value: alertData.timestamp || new Date().toISOString(),
          short: true
        }
      ],
      footer: 'Compliance Monitor',
      ts: Math.floor(Date.now() / 1000)
    }];
    
    // Add user information if available
    if (alertData.userEmail) {
      attachments[0].fields.push({
        title: 'User',
        value: alertData.userEmail,
        short: true
      });
    }
    
    // Add regression details if available
    if (alertData.type === 'POLICY_REGRESSION' && alertData.regressions) {
      const regressionText = alertData.regressions
        .map(r => `• ${r.policyName} (${r.severity})`)
        .join('\n');
      
      attachments[0].fields.push({
        title: 'Regressions Detected',
        value: regressionText,
        short: false
      });
    }
    
    return {
      text: `Compliance Alert: ${alertData.type}`,
      attachments: attachments
    };
  }
  
  /**
   * Log alert for audit purposes
   * @param {Object} alertData - Alert data
   * @param {Array} results - Send results
   */
  async logAlert(alertData, results) {
    const logEntry = {
      alertId: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      alertData: alertData,
      sendResults: results
    };
    
    // In a real implementation, you would write this to CloudWatch Logs
    // or a dedicated audit table
    console.log('Alert logged:', JSON.stringify(logEntry, null, 2));
  }
  
  /**
   * Generate unique alert ID
   * @returns {string} Unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Health check for alert services
   * @returns {Object} Health status
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    try {
      // Test SendGrid if configured
      if (process.env.SENDGRID_API_KEY) {
        health.services.sendgrid = { status: 'configured' };
      } else {
        health.services.sendgrid = { status: 'not_configured' };
      }
      
      // Test Slack if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        health.services.slack = { status: 'configured' };
      } else {
        health.services.slack = { status: 'not_configured' };
      }
      
      return health;
    } catch (error) {
      health.error = error.message;
      return health;
    }
  }
}

// Export singleton instance
const alertService = new AlertService();

module.exports = {
  sendAlert: (alertData) => alertService.sendAlert(alertData),
  sendTestAlert: (testConfig) => alertService.sendTestAlert(testConfig),
  healthCheck: () => alertService.healthCheck()
};