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
