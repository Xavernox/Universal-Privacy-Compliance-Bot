const axios = require('axios');
const { sendAlert, sendTestAlert, healthCheck } = require('../../lambda/alerts/alertService');

// Mock axios with proper status codes
jest.mock('axios', () => {
  const mockPost = jest.fn();
  return {
    post: mockPost
  };
});

// Get the mock function after jest.mock is called
const mockAxiosPost = require('axios').post;

// Mock console.log for alert logging tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = jest.fn();
  mockAxiosPost.mockReset();
  
  // Default mock responses - these can be overridden in individual tests
  mockAxiosPost.mockResolvedValue({
    status: 202, // SendGrid success code
    headers: { 'x-message-id': 'test-message-id' }
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Mock AWS Secrets Manager
jest.mock('aws-sdk', () => {
  const mockSecretsManager = {
    getSecretValue: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        SecretString: JSON.stringify({ apiKey: 'test-api-key', webhookUrl: 'test-webhook-url' })
      })
    })
  };
  
  return {
    SecretsManager: jest.fn(() => mockSecretsManager)
  };
});

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for testing
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ALERT_FROM_EMAIL = 'alerts@test.com';
    
    // Mock successful axios responses
    axios.post.mockResolvedValue({
      status: 202,
      headers: { 'x-message-id': 'test-message-id' }
    });
  });

  describe('sendAlert', () => {
    it('should send email alert successfully', async () => {
      const alertData = {
        type: 'POLICY_REGRESSION',
        userId: 'user-1',
        userEmail: 'user@test.com',
        message: 'Policy regression detected',
        severity: 'HIGH'
      };

      const result = await sendAlert(alertData);

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      
      // Find the email result
      const emailResult = result.results.find(r => r.channel === 'email');
      expect(emailResult).toBeDefined();
      expect(emailResult.success).toBe(true);
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.objectContaining({
          personalizations: expect.arrayContaining([
            expect.objectContaining({
              to: [{ email: 'user@test.com' }],
              subject: expect.stringContaining('Compliance Alert: POLICY_REGRESSION')
            })
          ]),
          from: {
            email: 'alerts@test.com',
            name: 'Compliance Monitor'
          }
        }),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-sendgrid-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should send Slack alert successfully', async () => {
      // Set up environment for Slack only
      delete process.env.SENDGRID_API_KEY;
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      mockAxiosPost.mockResolvedValue({
        status: 200, // Slack expects 200
        data: { ts: '1234567890' }
      });

      const alertData = {
        type: 'NEW_TRACKERS',
        message: 'New trackers detected',
        severity: 'MEDIUM'
      };

      const result = await sendAlert(alertData);

      expect(result.success).toBe(true);
      expect(result.results[0].channel).toBe('slack');
      expect(result.results[0].success).toBe(true);
      
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          text: 'Compliance Alert: NEW_TRACKERS',
          attachments: expect.arrayContaining([
            expect.objectContaining({
              color: '#ffb347', // Color for MEDIUM severity
              title: 'Compliance Alert: NEW_TRACKERS',
              text: 'New trackers detected'
            })
          ])
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should send alerts to both channels when both are configured', async () => {
      // Both SendGrid and Slack configured
      // Set Slack mock to return 200 for success
      const slackCalls = [];
      mockAxiosPost.mockImplementation((url, data, config) => {
        if (url.includes('slack.com')) {
          return Promise.resolve({
            status: 200,
            data: { ts: '1234567890' }
          });
        }
        // SendGrid calls
        return Promise.resolve({
          status: 202,
          headers: { 'x-message-id': 'test-message-id' }
        });
      });

      const result = await sendAlert({
        type: 'SYSTEM_ERROR',
        message: 'System error occurred',
        severity: 'CRITICAL'
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      
      const emailResult = result.results.find(r => r.channel === 'email');
      const slackResult = result.results.find(r => r.channel === 'slack');
      
      expect(emailResult.success).toBe(true);
      expect(slackResult.success).toBe(true);
      
      expect(mockAxiosPost).toHaveBeenCalledTimes(2);
    });

    it('should handle SendGrid API errors gracefully', async () => {
      mockAxiosPost.mockRejectedValueOnce(new Error('SendGrid API error'));

      const result = await sendAlert({
        type: 'TEST_ALERT',
        message: 'Test message',
        severity: 'LOW'
      });

      expect(result.success).toBe(true); // Overall success because of fallback handling
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('SendGrid API error');
    });

    it('should handle missing SendGrid API key', async () => {
      delete process.env.SENDGRID_API_KEY;

      const result = await sendAlert({
        type: 'TEST_ALERT',
        message: 'Test message',
        severity: 'LOW'
      });

      expect(result.results).toHaveLength(1); // Only Slack is configured
      expect(result.results[0].success).toBe(false); // Slack should fail due to mock
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('should create proper email content for different alert types', async () => {
      const alertWithRegressions = {
        type: 'POLICY_REGRESSION',
        userEmail: 'user@test.com',
        message: 'Policy regression detected',
        severity: 'HIGH',
        regressions: [
          {
            policyId: 'policy-1',
            policyName: 'Security Policy',
            severity: 'HIGH',
            regressionIndicators: [
              { type: 'COMPLIANCE_SCORE_DECREASED', previous: 90, current: 70, change: -20 }
            ]
          }
        ]
      };

      await sendAlert(alertWithRegressions);

      const emailCall = mockAxiosPost.mock.calls.find(call => 
        call[0] === 'https://api.sendgrid.com/v3/mail/send'
      );

      expect(emailCall).toBeDefined();
      const emailContent = emailCall[1];
      
      expect(emailContent.content[0].value).toContain('Policy regression detected');
      expect(emailContent.content[0].value).toContain('Security Policy');
      expect(emailContent.content[0].value).toContain('COMPLIANCE_SCORE_DECREASED');
    });

    it('should create proper email content for new trackers', async () => {
      const alertWithNewTrackers = {
        type: 'NEW_TRACKERS',
        userEmail: 'user@test.com',
        message: 'New trackers detected',
        severity: 'MEDIUM',
        trackers: [
          {
            policyId: 'policy-1',
            policyName: 'Data Protection Policy',
            resourceId: 'resource-123',
            complianceScore: 85
          }
        ]
      };

      await sendAlert(alertWithNewTrackers);

      const emailCall = mockAxiosPost.mock.calls.find(call => 
        call[0] === 'https://api.sendgrid.com/v3/mail/send'
      );

      const emailContent = emailCall[1];
      
      expect(emailContent.content[0].value).toContain('New trackers detected');
      expect(emailContent.content[0].value).toContain('Data Protection Policy');
      expect(emailContent.content[0].value).toContain('resource-123');
      expect(emailContent.content[0].value).toContain('85%');
    });

    it('should create proper Slack messages with severity colors', async () => {
      delete process.env.SENDGRID_API_KEY;
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      mockAxiosPost.mockResolvedValue({ status: 200, data: { ts: '1234567890' } });

      const criticalAlert = {
        type: 'SYSTEM_ERROR',
        message: 'Critical system error',
        severity: 'CRITICAL',
        userEmail: 'user@test.com'
      };

      await sendAlert(criticalAlert);

      const slackCall = mockAxiosPost.mock.calls.find(call => 
        call[0] === 'https://hooks.slack.com/test'
      );

      const slackMessage = slackCall[1];
      
      expect(slackMessage.attachments[0].color).toBe('#9c27b0'); // Color for CRITICAL
      expect(slackMessage.attachments[0].fields).toContainEqual(
        expect.objectContaining({
          title: 'Severity',
          value: 'CRITICAL'
        })
      );
    });
  });

  describe('sendTestAlert', () => {
    it('should send test alert successfully', async () => {
      const testConfig = {
        email: 'test@example.com',
        channels: ['email'],
        message: 'Custom test message'
      };

      const result = await sendTestAlert(testConfig);

      expect(result.success).toBe(true);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.objectContaining({
          personalizations: expect.arrayContaining([
            expect.objectContaining({
              to: [{ email: 'test@example.com' }],
              subject: expect.stringContaining('TEST_ALERT')
            })
          ])
        })
      );
    });

    it('should use default configuration when not provided', async () => {
      const result = await sendTestAlert({});

      expect(result.success).toBe(true);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.objectContaining({
          personalizations: expect.arrayContaining([
            expect.objectContaining({
              to: [{ email: 'admin@test.com' }]
            })
          ])
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status for configured services', async () => {
      const health = await healthCheck();

      expect(health.timestamp).toBeDefined();
      expect(health.services.sendgrid.status).toBe('configured');
      expect(health.services.slack.status).toBe('configured');
    });

    it('should return not_configured for missing services', async () => {
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SLACK_WEBHOOK_URL;

      const health = await healthCheck();

      expect(health.services.sendgrid.status).toBe('not_configured');
      expect(health.services.slack.status).toBe('not_configured');
    });

    it('should handle health check errors gracefully', async () => {
      const originalEnv = { ...process.env };
      process.env = {}; // Clear environment to simulate no services configured

      const health = await healthCheck();

      expect(health.services).toBeDefined();
      expect(health.services.sendgrid.status).toBe('not_configured');
      expect(health.services.slack.status).toBe('not_configured');
      
      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Alert Generation', () => {
    it('should generate unique alert IDs', async () => {
      const alertData = {
        type: 'TEST_ALERT',
        message: 'Test alert',
        severity: 'LOW'
      };

      await sendAlert(alertData);

      // The alert should be logged (we can verify by checking console.log was called)
      expect(console.log).toHaveBeenCalled();
      
      // Find the log call that contains "Alert logged:" 
      const logCalls = console.log.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('Alert logged:')
      );
      expect(logCalls.length).toBeGreaterThan(0);
      
      // Since console.log was called with JSON.stringify, we can check the message format
      const logMessage = logCalls[0][0];
      expect(logMessage).toContain('Alert logged:');
      expect(logMessage).toContain('"alertId"');
      
      // We can verify the format without parsing since JSON.parse might fail with console.log formatting
      const alertIdMatch = logMessage.match(/"alertId":"(alert_\d+_[a-z0-9]+)"/);
      expect(alertIdMatch).toBeDefined();
      expect(alertIdMatch[1]).toMatch(/^alert_\d+_[a-z0-9]+$/);
    });

    it('should handle email content with special characters', async () => {
      const alertData = {
        type: 'POLICY_REGRESSION',
        userEmail: 'user@test.com',
        message: 'Policy "Security" & <Compliance> regression detected',
        severity: 'HIGH',
        regressions: [
          {
            policyId: 'policy-1',
            policyName: 'Security & Privacy Policy',
            severity: 'HIGH',
            regressionIndicators: []
          }
        ]
      };

      await sendAlert(alertData);

      const emailCall = axios.post.mock.calls.find(call => 
        call[0] === 'https://api.sendgrid.com/v3/mail/send'
      );

      const emailContent = emailCall[1].content[0].value;
      
      // Content should be properly escaped in HTML
      expect(emailContent).toContain('Security &amp; Privacy Policy');
      expect(emailContent).toContain('Policy &quot;Security&quot; &amp; &lt;Compliance&gt; regression detected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty alert data gracefully', async () => {
      const result = await sendAlert({});

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      // Both email and Slack are configured, so we expect 2 results
      expect(result.results).toHaveLength(2);
      
      const emailResult = result.results.find(r => r.channel === 'email');
      const slackResult = result.results.find(r => r.channel === 'slack');
      
      expect(emailResult.success).toBe(true);
      expect(slackResult.success).toBe(true);
    });

    it('should handle missing user email by using admin email', async () => {
      const alertData = {
        type: 'SYSTEM_ERROR',
        message: 'System error',
        severity: 'HIGH'
        // No userEmail provided
      };

      await sendAlert(alertData);

      const emailCall = axios.post.mock.calls.find(call => 
        call[0] === 'https://api.sendgrid.com/v3/mail/send'
      );

      expect(emailCall[1].personalizations[0].to[0].email).toBe('admin@test.com');
    });

    it('should handle invalid channel configuration', async () => {
      // Test with completely invalid configuration
      const originalSendGrid = process.env.SENDGRID_API_KEY;
      const originalSlack = process.env.SLACK_WEBHOOK_URL;
      
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SLACK_WEBHOOK_URL;

      const result = await sendAlert({
        type: 'TEST_ALERT',
        message: 'Test message',
        severity: 'LOW'
      });

      expect(result.results).toHaveLength(0);
      
      // Restore
      process.env.SENDGRID_API_KEY = originalSendGrid;
      process.env.SLACK_WEBHOOK_URL = originalSlack;
    });
  });
});