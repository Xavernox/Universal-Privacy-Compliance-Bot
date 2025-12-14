const express = require('express');
const { sendTestAlert } = require('../../lambda/alerts/alertService');
const router = express.Router();

/**
 * POST /api/alerts/test
 * Trigger a test alert for admin verification
 * 
 * Body parameters:
 * - email: Optional - specific email to send test to (defaults to admin email)
 * - channels: Optional - array of channels to test ['email', 'slack']
 * - message: Optional - custom message for the test alert
 */
router.post('/test', async (req, res) => {
  try {
    const { email, channels, message } = req.body;
    
    // Validate request
    if (channels && !Array.isArray(channels)) {
      return res.status(400).json({
        error: 'Channels must be an array'
      });
    }
    
    if (channels && channels.length > 0) {
      const validChannels = ['email', 'slack'];
      const invalidChannels = channels.filter(ch => !validChannels.includes(ch));
      
      if (invalidChannels.length > 0) {
        return res.status(400).json({
          error: `Invalid channels: ${invalidChannels.join(', ')}`,
          validChannels: validChannels
        });
      }
    }
    
    // Build test configuration
    const testConfig = {
      email: email || process.env.ADMIN_EMAIL,
      channels: channels || ['email', 'slack'].filter(ch => {
        if (ch === 'email') return !!process.env.SENDGRID_API_KEY;
        if (ch === 'slack') return !!process.env.SLACK_WEBHOOK_URL;
        return false;
      }),
      message: message || 'This is a test alert from the compliance monitoring system'
    };
    
    console.log('Processing test alert request:', testConfig);
    
    // Send test alert
    const result = await sendTestAlert(testConfig);
    
    res.status(200).json({
      success: true,
      message: 'Test alert sent successfully',
      result: result,
      config: testConfig
    });
    
  } catch (error) {
    console.error('Failed to send test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert',
      message: error.message
    });
  }
});

/**
 * GET /api/alerts/test
 * Get test alert endpoint information and configuration status
 */
router.get('/test', (req, res) => {
  const config = {
    sendgrid: {
      configured: !!process.env.SENDGRID_API_KEY,
      requiredEnvVar: 'SENDGRID_API_KEY'
    },
    slack: {
      configured: !!process.env.SLACK_WEBHOOK_URL,
      requiredEnvVar: 'SLACK_WEBHOOK_URL'
    },
    adminEmail: process.env.ADMIN_EMAIL || 'admin@company.com',
    fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@compliance-system.com'
  };
  
  res.status(200).json({
    message: 'Test Alert Endpoint',
    description: 'POST to this endpoint to send test alerts',
    config: config,
    example: {
      url: '/api/alerts/test',
      method: 'POST',
      body: {
        email: 'admin@company.com',
        channels: ['email', 'slack'],
        message: 'Custom test message'
      }
    }
  });
});

/**
 * GET /api/alerts/health
 * Health check for alert services
 */
router.get('/health', async (req, res) => {
  try {
    const { healthCheck } = require('../../lambda/alerts/alertService');
    const health = await healthCheck();
    
    res.status(200).json({
      status: 'healthy',
      services: health.services,
      timestamp: health.timestamp
    });
  } catch (error) {
    console.error('Alert health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;