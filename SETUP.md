# U-PCB MVP - Project Setup Guide

## ✅ Project Bootstrap Complete

This document describes the complete monorepo setup for the U-PCB MVP (Unified Cloud Security Platform).

## 📁 Project Structure

```
upcb-mvp/
├── apps/
│   └── web/                          # Next.js 14 App Router application
│       ├── app/
│       │   ├── layout.tsx            # Root layout
│       │   ├── page.tsx              # Home page
│       │   └── api/                  # API routes
│       │       ├── auth/             # Authentication endpoints
│       │       │   ├── login/        # Login endpoint
│       │       │   ├── register/     # Registration endpoint
│       │       │   └── me/           # Current user endpoint
│       │       ├── scan/             # Scan management
│       │       ├── policy/           # Policy management
│       │       ├── monitor/          # Monitoring & statistics
│       │       ├── alert/            # Alert management
│       │       └── admin/            # Admin endpoints (Basic auth)
│       ├── lib/
│       │   ├── auth/                 # Authentication utilities
│       │   │   ├── jwt.ts            # JWT sign/verify functions
│       │   │   ├── middleware.ts     # Auth middleware (withAuth, withAdmin)
│       │   │   └── basicAuth.ts      # Basic token auth for admin
│       │   └── db/
│       │       ├── mongodb.ts        # MongoDB connection helper
│       │       └── models/           # Mongoose data models
│       │           ├── User.ts       # User model with bcrypt
│       │           ├── Scan.ts       # Scan tracking model
│       │           ├── Policy.ts     # Security policy model
│       │           ├── Alert.ts      # Alert model
│       │           └── Whitelist.ts  # Whitelist model
│       ├── package.json
│       ├── tsconfig.json
│       └── next.config.js
├── services/
│   ├── scanner/                      # Container-based scanner service
│   │   ├── src/
│   │   │   └── index.ts              # Express server (placeholder)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── policy/                       # Container-based policy service
│       ├── src/
│       │   └── index.ts              # Express server (placeholder)
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── infra/
│   ├── template.yaml                 # AWS SAM/CloudFormation template
│   └── README.md                     # Infrastructure deployment guide
├── .env.example                      # Environment variable documentation
├── .eslintrc.json                    # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── .gitignore                        # Git ignore rules
├── package.json                      # Root package.json (monorepo config)
├── tsconfig.json                     # Shared TypeScript config
└── README.md                         # Project documentation
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (web app and services).

### 2. Configure Environment

```bash
cp .env.example .env
```

Update the following required variables:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing (generate a strong random string)
- `ADMIN_BASIC_TOKEN`: Token for admin endpoint authentication

### 3. Start Development Server

```bash
npm run dev
```

The Next.js application will start at `http://localhost:3000`.

## 🧪 Available Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start Next.js development server |
| `npm run build`        | Build all workspaces             |
| `npm run lint`         | Lint all workspaces              |
| `npm run format`       | Format code with Prettier        |
| `npm run format:check` | Check code formatting            |
| `npm run typecheck`    | TypeScript type checking         |
| `npm run test`         | Run tests (when implemented)     |

## 📦 Tech Stack

### Frontend & API

- **Next.js 14**: App Router, React Server Components
- **React 18**: UI library
- **TypeScript**: Type safety

### Backend Services

- **Node.js 18**: Runtime
- **Express**: Web framework for services
- **TypeScript**: Type safety

### Database

- **MongoDB**: Primary database
- **Mongoose**: ODM for MongoDB
- **DynamoDB**: Optional session storage (AWS)

### Authentication

- **JWT**: Token-based authentication
- **bcryptjs**: Password hashing
- **Basic Auth**: Admin endpoint protection

### Infrastructure

- **AWS Lambda**: Serverless Next.js deployment
- **AWS ECS Fargate**: Container orchestration
- **AWS ALB**: Load balancing
- **AWS VPC**: Network isolation
- **AWS Secrets Manager**: Secret management
- **CloudFormation/SAM**: Infrastructure as Code

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **npm workspaces**: Monorepo management

## 🔐 Authentication

### JWT Authentication (API Routes)

Most API endpoints use JWT authentication:

```typescript
// Protected endpoint
export const GET = withAuth(async (request, user) => {
  // user.userId, user.email, user.role available
  // ...
});
```

**Request Headers:**

```
Authorization: Bearer <jwt_token>
```

### Admin Basic Token Authentication

Admin endpoints (`/api/admin/*`) use Basic token authentication:

```typescript
// Admin endpoint
export const GET = withBasicAuth(async (request) => {
  // Admin access granted
  // ...
});
```

**Request Headers:**

```
Authorization: Bearer <admin_basic_token>
```

## 📊 Data Models

### User

- Email, password (hashed), name, role
- Authentication and user management
- Bcrypt password hashing (10 rounds)

### Scan

- User association, scan type, status
- Cloud provider, region
- Resource counts and issue severity breakdown
- Timestamps and duration tracking

### Policy

- Name, description, cloud provider
- Category, severity, rules
- Compliance frameworks
- Automated remediation support

### Alert

- User and scan association
- Title, description, severity, status
- Resource information
- Acknowledgment and resolution tracking

### Whitelist

- User association, resource information
- Policy exclusions
- Reason and expiration
- Active status tracking

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user (authenticated)

### Scans

- `GET /api/scan` - List scans (authenticated)
- `POST /api/scan` - Create scan (authenticated)
- `GET /api/scan/[id]` - Get scan details (authenticated)

### Policies

- `GET /api/policy` - List policies (authenticated)
- `POST /api/policy` - Create policy (authenticated)

### Monitoring

- `GET /api/monitor` - Get monitoring data (authenticated)

### Alerts

- `GET /api/alert` - List alerts (authenticated)
- `POST /api/alert` - Create alert (authenticated)
- `POST /api/alert/[id]/acknowledge` - Acknowledge alert (authenticated)

### Admin (Basic Auth Required)

- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - System statistics

## 🐳 Container Services

### Scanner Service

- **Port**: 3001
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /scan` - Initiate scan (TODO)
  - `POST /scan/validate` - Validate scan config (TODO)

### Policy Service

- **Port**: 3002
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /policy/generate` - Generate policy (TODO)
  - `POST /policy/validate` - Validate policy (TODO)
  - `POST /policy/evaluate` - Evaluate policy (TODO)

Both services are containerized and ready for deployment on AWS Fargate.

## ☁️ Infrastructure Deployment

See [infra/README.md](./infra/README.md) for detailed deployment instructions.

**Quick Deploy:**

```bash
cd infra
sam build
sam deploy --guided
```

## 🔧 Configuration

### Environment Variables

All environment variables are documented in `.env.example`. Key variables:

- **MongoDB**: Connection string and database name
- **JWT**: Secret key and expiration time
- **Admin**: Basic authentication token
- **AWS**: Region, account ID, service URLs
- **Services**: Scanner and policy service URLs

### AWS Configuration

The infrastructure template (`infra/template.yaml`) defines:

- VPC with public/private subnets
- ECS cluster for container services
- Application Load Balancer
- Lambda function for Next.js
- Secrets Manager for sensitive data
- DynamoDB for session storage
- CloudWatch for logging
- IAM roles and security groups

## 📝 Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting
- No comments unless complex logic needed

### API Response Format

**Success:**

```json
{
  "data": {},
  "message": "Success message"
}
```

**Error:**

```json
{
  "error": "Error message"
}
```

### Error Handling

All API routes include try-catch blocks with proper error logging:

```typescript
try {
  // Route logic
} catch (error: any) {
  console.error('Error description:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

## 🧪 Testing (To Be Implemented)

Testing framework setup is pending. Recommended stack:

- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing

## 🚢 Production Deployment Checklist

- [ ] Update all environment variables
- [ ] Generate strong JWT secret
- [ ] Configure MongoDB Atlas cluster
- [ ] Set up AWS account and credentials
- [ ] Deploy infrastructure with SAM
- [ ] Build and push container images to ECR
- [ ] Create ECS services
- [ ] Configure CloudWatch alarms
- [ ] Set up domain and SSL certificate
- [ ] Enable WAF for security
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline
- [ ] Implement monitoring dashboards
- [ ] Configure backup strategy

## 📚 Additional Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

## 📄 License

Proprietary - All rights reserved

---

**Status**: ✅ Bootstrap Complete - Ready for feature development

**Last Updated**: December 2024
