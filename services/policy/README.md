# Policy Service

Container-based policy generation and validation service for the U-PCB MVP.

## Overview

This service is responsible for generating, validating, and evaluating security policies across multiple cloud providers.

## Features (TODO)

- [ ] Policy generation based on compliance frameworks (CIS, NIST, PCI-DSS, etc.)
- [ ] Custom policy creation and validation
- [ ] Policy evaluation against scan results
- [ ] Policy recommendation engine
- [ ] Automated remediation script generation
- [ ] Multi-cloud policy translation

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the service.

### Generate Policy

```
POST /policy/generate
```

Generates a new security policy based on provided parameters.

**Request Body:**

```json
{
  "cloudProvider": "aws|azure|gcp",
  "complianceFramework": "cis|nist|pci-dss",
  "category": "security|compliance|cost",
  "customRules": []
}
```

### Validate Policy

```
POST /policy/validate
```

Validates a policy configuration.

**Request Body:**

```json
{
  "policy": {
    "name": "string",
    "rules": []
  }
}
```

### Evaluate Policy

```
POST /policy/evaluate
```

Evaluates a policy against scan results.

**Request Body:**

```json
{
  "policyId": "string",
  "scanResults": []
}
```

## Environment Variables

- `PORT`: Service port (default: 3002)
- `MONGODB_URI`: MongoDB connection string
- `LOG_LEVEL`: Logging level

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Docker

Build the Docker image:

```bash
docker build -t upcb-policy:latest .
```

Run the container:

```bash
docker run -p 3002:3002 upcb-policy:latest
```

## Deployment

This service is designed to run on AWS Fargate as part of the U-PCB infrastructure.
