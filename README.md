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
# Site Scanner Service

A comprehensive end-to-end Site Scanner stack that crawls websites, identifies third-party scripts, cookies, and trackers, and provides detailed security and privacy analysis.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js API   │────│  FastAPI Scanner │    │  MongoDB        │
│   (Port 3000)   │    │  Service         │    │  Database       │
│                 │    │  (Port 8000)     │    │                 │
│ • JWT Auth      │    │                  │    │ • Scan Results  │
│ • Input Valid.  │    │ • Playwright     │    │ • User Data     │
│ • MongoDB       │    │ • Risk Analysis  │    │ • Analytics     │
│ • API Gateway   │    │ • Tracker Detect │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────────┐
         │              │  AWS ECS/Fargate │
         │              │  • Container     │
         └──────────────┤  • Load Balancer │
                        │  • Auto Scaling  │
                        └──────────────────┘
```

## Features

### Scanner Service (FastAPI)
- **Headless Browser Scanning**: Uses Playwright with Chromium for comprehensive page analysis
- **Third-party Resource Detection**: Identifies scripts, cookies, pixels, iframes, and network requests
- **Risk Assessment**: Categorizes resources by risk level (low, medium, high, critical)
- **Tracker Recognition**: Detects known analytics, advertising, and tracking services
- **Structured Output**: Returns detailed JSON with host, type, risk, and categorization

### Next.js API Route
- **JWT Authentication**: Secure API access with token validation
- **Input Validation**: Comprehensive request validation using Joi
- **MongoDB Integration**: Persistent storage of scan results
- **Response Enrichment**: Adds risk analysis, recommendations, and metadata
- **Error Handling**: Graceful error handling with detailed logging
- **Caching**: Intelligent caching to avoid duplicate scans

### Infrastructure as Code
- **Terraform Templates**: Complete AWS infrastructure deployment
- **ECS/Fargate**: Container orchestration with auto-scaling
- **ECR Integration**: Container image registry with security scanning
- **Load Balancing**: Application Load Balancer with health checks
- **Security Groups**: Proper network security configuration
- **VPC Networking**: Isolated network environment

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.11+
- Terraform (for AWS deployment)
- AWS CLI configured

### Local Development

1. **Clone and setup**:
```bash
git clone <repository>
cd site-scanner
```

2. **Start services with Docker Compose**:
```bash
docker-compose up -d
```

3. **Access services**:
- Next.js API: http://localhost:3000
- Scanner Service: http://localhost:8000
- MongoDB: mongodb://localhost:27017

### Running Tests

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### API Usage

#### Start a Site Scan

```bash
curl -X POST http://localhost:3000/api/scan-site \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "depth": 1,
    "timeout": 30
  }'
```

#### Response Example

```json
{
  "scan_id": "scan_1640995200000",
  "target_url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "resources": [
    {
      "host": "google-analytics.com",
      "type": "script",
      "url": "https://google-analytics.com/gtag/js?id=GA_MEASUREMENT_ID",
      "risk_level": "low",
      "description": "Google Analytics script",
      "category": "analytics"
    },
    {
      "host": "facebook.com",
      "type": "cookie",
      "url": "cookie://facebook.com",
      "risk_level": "medium",
      "description": "Facebook tracking cookie",
      "category": "social"
    }
  ],
  "summary": {
    "total_resources": 2,
    "by_type": {"script": 1, "cookie": 1},
    "by_risk": {"low": 1, "medium": 1},
    "by_category": {"analytics": 1, "social": 1},
    "unique_hosts": 2
  },
  "scan_duration": 2.5,
  "pages_scanned": 1,
  "metadata": {
    "scanner_version": "1.0.0",
    "enrichment_applied": true,
    "risk_analysis": {
      "overall_risk_score": 1.5,
      "risk_level": "medium"
    },
    "recommendations": [
      {
        "type": "privacy",
        "priority": "medium",
        "message": "Found tracking cookies. Ensure GDPR/CCPA compliance.",
        "affected_resources": ["facebook.com"]
      }
    ]
  }
}
```

#### Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "service": "site-scanner-api",
  "version": "1.0.0",
  "database": "connected",
  "scanner_service": "available",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Configuration

### Environment Variables

#### Next.js API
```env
# Database
MONGODB_URI=mongodb://localhost:27017/site-scanner
MONGODB_DB_NAME=site-scanner

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Scanner Service
SCANNER_SERVICE_URL=http://localhost:8000
SCANNER_SERVICE_TIMEOUT=60000

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

#### Scanner Service
```env
# Service Configuration
PORT=8000
NODE_ENV=development

# Playwright
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Logging
LOG_LEVEL=info
```

### AWS Deployment

1. **Configure Terraform variables**:
```bash
cd iac/terraform
cp terraform.tfvars.example terraform.tfvars
```

2. **Edit terraform.tfvars**:
```hcl
environment = "production"
project_name = "site-scanner"
aws_region = "us-east-1"
scanner_task_cpu = 1024
scanner_task_memory = 2048
scanner_service_desired_count = 2
```

3. **Deploy infrastructure**:
```bash
terraform init
terraform plan
terraform apply
```

4. **Build and push Docker image**:
```bash
# Build scanner service image
cd services/scanner
docker build -t site-scanner-scanner-service:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag site-scanner-scanner-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/site-scanner-scanner-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/site-scanner-scanner-service:latest
```

## Project Structure

```
├── services/
│   └── scanner/
│       ├── main.py              # FastAPI application
│       ├── requirements.txt     # Python dependencies
│       └── Dockerfile           # Container definition
├── pages/
│   └── api/
│       └── scan-site/
│           └── index.ts         # Next.js API route
├── lib/
│   ├── mongodb.ts               # Database connection
│   └── scanner-service.ts       # Scanner client
├── middleware/
│   └── auth.ts                  # JWT authentication
├── models/
│   └── ScanResult.ts            # TypeScript interfaces
├── tests/
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── iac/
│   └── terraform/               # Infrastructure as Code
│       ├── main.tf              # Main Terraform config
│       ├── variables.tf         # Variable definitions
│       └── modules/
├── docs/
│   └── logging-and-monitoring.md # Observability guide
├── docker-compose.yml           # Local development setup
├── Dockerfile.nextjs            # Next.js container
├── jest.config.js               # Test configuration
└── README.md                    # This file
```

## Testing Strategy

### Unit Tests
- **API Route Testing**: Mock external dependencies, test request/response handling
- **Authentication**: JWT validation, role checking, error scenarios
- **Database Operations**: MongoDB connection, CRUD operations
- **Scanner Service Client**: HTTP client, error handling, response parsing

### Integration Tests
- **End-to-End Scanning**: Complete scan workflow testing
- **Database Integration**: Real MongoDB connection testing
- **Service Communication**: API ↔ Scanner service integration

### Test Coverage
- Minimum 80% code coverage requirement
- All critical paths must be tested
- Error conditions thoroughly covered

## Security Considerations

### Authentication & Authorization
- JWT tokens with configurable expiration
- Role-based access control (admin/user)
- Secure token storage and validation

### Data Protection
- No sensitive data logging
- Encrypted database connections
- Secure environment variable management

### Network Security
- VPC isolation in AWS deployment
- Security group restrictions
- HTTPS enforcement in production

### Container Security
- Non-root user execution
- Minimal base images
- Regular security updates

## Monitoring & Logging

### Application Logs
- Structured JSON logging with Winston
- Multiple log levels and categories
- Request/response logging
- Error tracking and alerting

### Health Checks
- `/health` endpoints for all services
- Database connectivity checks
- External service availability monitoring

### Metrics & Alerting
- Custom application metrics
- CloudWatch integration
- Performance monitoring
- Automated alerting (Slack/PagerDuty)

## Performance Optimization

### Scanner Service
- Browser resource management
- Concurrent scan limiting
- Memory usage optimization
- Timeout handling

### API Layer
- Request caching
- Database indexing
- Connection pooling
- Rate limiting

### Infrastructure
- Auto-scaling policies
- Load balancer health checks
- Container resource limits
- CDN integration for static assets

## Troubleshooting

### Common Issues

#### Scanner Service Won't Start
```bash
# Check Playwright installation
playwright install chromium

# Verify system dependencies
docker run --rm -it python:3.11-slim apt-get update && apt-get install -y libglib2.0-0 libnss3 libnspr4
```

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Verify connection string
echo $MONGODB_URI
```

#### API Authentication Failures
```bash
# Test JWT token generation
node -e "console.log(require('./lib/auth').generateJWT({id: 'test', email: 'test@example.com', role: 'user'}))"
```

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

### Health Checks

Check service health:
```bash
# API health
curl http://localhost:3000/api/health

# Scanner service health
curl http://localhost:8000/health

# Database health
curl http://localhost:3000/api/health | jq '.database'
```

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request

### Code Standards
- TypeScript/JavaScript: ESLint + Prettier
- Python: Black + isort + flake8
- Testing: Jest for JS, pytest for Python
- Documentation: JSDoc comments

### Pull Request Requirements
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Create an issue in the repository
- Check the troubleshooting guide
- Review the monitoring documentation
- Contact the development team

---

**Built with ❤️ using FastAPI, Next.js, Playwright, MongoDB, and AWS**
# U-PCB MVP - Unified Cloud Security Platform

A monorepo containing the U-PCB MVP web dashboard and backend services for cloud security policy compliance and monitoring.

## Project Structure

```
upcb-mvp/
├── apps/
│   └── web/              # Next.js 14 (App Router) web dashboard
├── services/
│   ├── scanner/          # Container-based scanning service
│   └── policy/           # Container-based policy generation service
├── infra/                # Infrastructure as Code (CloudFormation/SAM)
└── shared configuration files
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account or local MongoDB instance
- AWS Account (for deployment)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration values:

- MongoDB connection string
- JWT secret key
- Admin authentication tokens
- AWS credentials and region

### 3. Development

Start the Next.js development server:

```bash
npm run dev
```

The web dashboard will be available at `http://localhost:3000`.

### 4. Building

Build all workspaces:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests in all workspaces
- `npm run typecheck` - Type-check all workspaces

## Architecture

### Web Dashboard (Next.js 14)

The web application uses Next.js 14 with the App Router and provides:

- Authentication and authorization (JWT-based)
- API routes with auth guards
- Protected admin namespace with Basic token auth
- REST API endpoints for scan, policy, monitor, alert, and admin operations

### Services

- **Scanner Service**: Container-based service for scanning cloud resources
- **Policy Service**: Container-based service for policy generation and validation

### Data Models

- **User**: User accounts and authentication
- **Scan**: Scan results and metadata
- **Policy**: Security policies and configurations
- **Alert**: Security alerts and notifications
- **Whitelist**: Whitelisted resources and exceptions

### Infrastructure

The `infra/` directory contains AWS CloudFormation/SAM templates for:

- Next.js server deployment (Lambda@Edge/CloudFront)
- Container services on Fargate (Scanner + Policy)
- MongoDB Atlas connections
- DynamoDB tables (if needed)
- Secrets Manager for secure credential storage
- IAM roles and permissions

## Deployment

Deployment is managed via AWS SAM:

```bash
cd infra
sam build
sam deploy --guided
```

## Security

- All API routes are protected with JWT authentication
- Admin endpoints require separate Basic token authentication
- Secrets are managed via AWS Secrets Manager
- Environment variables should never be committed to the repository

## License

Proprietary - All rights reserved
