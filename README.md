# Compliance Monitor & Alerts System

A comprehensive compliance monitoring pipeline with AWS Lambda, EventBridge, SQS, SendGrid, and Slack integration for automated policy tracking and alert management.

## 🚀 Features

- **Daily Monitoring**: Automated compliance monitoring via EventBridge schedule
- **Policy Regression Detection**: Sophisticated diffing engine to identify policy regressions
- **Multi-Channel Alerts**: SendGrid email notifications and Slack webhook integration
- **SQS Job Queue**: Asynchronous scan job processing
- **Database Integration**: DynamoDB for tracking users, policies, and scan results
- **API Endpoints**: Admin testing interface for alert verification
- **Infrastructure as Code**: CloudFormation and Terraform templates
- **Comprehensive Testing**: Jest test suites with mocked dependencies

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EventBridge   │───▶│  Monitor Lambda │───▶│    SQS Queue    │
│   (Daily 2AM)   │    │   (Node.js)     │    │  (Scan Jobs)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Diff Engine    │
                       │  (Regression    │
                       │   Detection)    │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Alert Service  │───▶│  SendGrid Email │
                       │  (Multi-channel)│    │  + Slack Webhook│
                       └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   DynamoDB      │
                       │   (Users,       │
                       │   Policies,     │
                       │   Scans)        │
                       └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- SendGrid API key (for email alerts)
- Slack webhook URL (for Slack alerts)
- Terraform (optional, for infrastructure deployment)

## 🛠️ Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd compliance-monitoring-system
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Deploy Infrastructure** (choose one):

   **CloudFormation**:
   ```bash
   npm run deploy:cloudformation
   ```

   **Terraform**:
   ```bash
   npm run deploy:terraform
   ```

## 🔧 Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
USERS_TABLE=dev-Users
TRACKERS_TABLE=dev-Trackers
POLICIES_TABLE=dev-Policies
MONITOR_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue-name

# SendGrid (Email Alerts)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
ALERT_FROM_EMAIL=alerts-dev@yourcompany.com

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Admin
ADMIN_EMAIL=admin@yourcompany.com
```

### AWS Secrets Manager Setup

Store sensitive credentials in AWS Secrets Manager:

1. **SendGrid API Key**:
   ```bash
   aws secretsmanager create-secret \
     --name dev/SendGridApiKey \
     --secret-string '{"apiKey":"SG.your_actual_api_key"}'
   ```

2. **Slack Webhook URL**:
   ```bash
   aws secretsmanager create-secret \
     --name dev/SlackWebhookUrl \
     --secret-string '{"webhookUrl":"https://hooks.slack.com/services/YOUR/WEBHOOK/URL"}'
   ```

## 🚦 Usage

### Monitor Lambda Function

The monitor Lambda runs daily (2 AM UTC) and performs:

1. **User Discovery**: Queries active users from DynamoDB
2. **Tracker Comparison**: Compares current vs previous policy trackers
3. **Regression Detection**: Identifies policy compliance regressions
4. **Job Queueing**: Enqueues scan jobs for the scanner service
5. **Alerting**: Sends alerts for critical issues

### Alert Service

Supports multiple alert types:

- `MONITORING_ERROR`: System errors during monitoring
- `POLICY_REGRESSION`: Detected policy compliance regressions
- `NEW_TRACKERS`: New policy trackers discovered
- `SYSTEM_ERROR`: Critical system failures
- `TEST_ALERT`: Test alerts for verification

### API Endpoints

#### Test Alert Endpoint
```bash
POST /api/alerts/test
{
  "email": "admin@company.com",
  "channels": ["email", "slack"],
  "message": "Custom test message"
}
```

#### Health Check
```bash
GET /api/alerts/health
```

#### Configuration Info
```bash
GET /api/alerts/test
```

## 🧪 Testing

Run the complete test suite:
```bash
npm test
```

Run specific test suites:
```bash
npm run test:monitor    # Monitor Lambda tests
npm run test:alerts     # Alert service tests
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Test Coverage

- **Diff Engine**: 95%+ coverage for regression detection logic
- **Alert Service**: 90%+ coverage for multi-channel alerting
- **API Endpoints**: 85%+ coverage for request handling
- **Error Handling**: Comprehensive edge case testing

## 📊 Monitoring & Observability

### CloudWatch Metrics

- **Lambda Performance**: Duration, errors, throttling
- **SQS Metrics**: Queue depth, message age, DLQ activity
- **EventBridge**: Rule triggers and execution success
- **Custom Metrics**: Alert delivery success rates

### Alerts & Notifications

- **Lambda Errors**: Immediate notification on function failures
- **Queue Backlog**: Alerts when scan jobs accumulate
- **Alert Delivery**: Success/failure tracking for all channels
- **System Health**: Regular health check reports

## 🔒 Security

### IAM Permissions

The system uses least-privilege IAM roles:

- **Monitor Lambda**: Read access to user/tracker tables, SQS send/receive
- **Alert Lambda**: Secrets Manager read access only
- **EventBridge**: Lambda invoke permissions
- **SQS**: Standard queue permissions with DLQ

### Secrets Management

- SendGrid API keys stored in AWS Secrets Manager
- Slack webhook URLs encrypted in Secrets Manager
- No hardcoded credentials in Lambda functions
- Environment variables for non-sensitive configuration

## 📈 Performance & Scaling

### Auto-scaling

- **Lambda**: Automatic scaling based on EventBridge triggers
- **SQS**: Unlimited throughput for scan job processing
- **DynamoDB**: Auto-scaling read/write capacity
- **EventBridge**: Serverless event routing

### Cost Optimization

- **Scheduled Execution**: Only runs when needed (daily)
- **Efficient Queries**: Uses DynamoDB indexes for fast user lookups
- **Message Batching**: SQS batch processing for scan jobs
- **Resource Tagging**: All resources tagged for cost allocation

## 🚀 Deployment

### Development Environment
```bash
# Install dependencies
npm install

# Run tests
npm test

# Deploy infrastructure
npm run deploy:cloudformation
```

### Production Environment
```bash
# Set production environment variables
export ENVIRONMENT=prod
export AWS_REGION=us-east-1

# Deploy with production parameters
aws cloudformation deploy \
  --template-file infrastructure/compliance-monitor-stack.yaml \
  --stack-name prod-compliance-monitor \
  --parameter-overrides \
    Environment=prod \
    AdminEmail=admin@company.com
```

## 📝 Monitoring Schema

### Database Tables

**Users Table**:
```json
{
  "userId": "string",
  "email": "string",
  "active": boolean,
  "nextRunAt": "ISO timestamp",
  "lastMonitoredAt": "ISO timestamp",
  "lastAlertAt": "ISO timestamp"
}
```

**Policies Table**:
```json
{
  "policyId": "string",
  "userId": "string",
  "policyName": "string",
  "stale": boolean,
  "lastAlertedAt": "ISO timestamp",
  "regressionSeverity": "LOW|MEDIUM|HIGH|CRITICAL"
}
```

**Trackers Table**:
```json
{
  "userId": "string",
  "policyId": "string",
  "resourceId": "string",
  "complianceScore": number,
  "compliant": boolean,
  "controlFailures": number,
  "criticalViolations": number,
  "remediationStatus": "string"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Follow ESLint and Prettier configurations
- Write tests for new features (80%+ coverage)
- Update documentation for API changes
- Use semantic commit messages
- Test in development before production deployment

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in `/docs`
- Review CloudWatch logs for error details
- Contact the compliance team: compliance@company.com

## 🔄 Changelog

### v1.0.0
- Initial implementation
- Monitor Lambda with daily scheduling
- Alert service with SendGrid and Slack integration
- Infrastructure as Code (CloudFormation + Terraform)
- Comprehensive test suite
- API endpoints for testing and health checks