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
