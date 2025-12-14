# Scanner Service

Container-based cloud resource scanning service for the U-PCB MVP.

## Overview

This service is responsible for scanning cloud resources across AWS, Azure, and GCP to identify security vulnerabilities, compliance issues, and policy violations.

## Features (TODO)

- [ ] AWS resource scanning (EC2, S3, IAM, etc.)
- [ ] Azure resource scanning
- [ ] GCP resource scanning
- [ ] Real-time scanning
- [ ] Scheduled scanning
- [ ] Parallel resource scanning
- [ ] Result caching
- [ ] Integration with MongoDB for storing scan results

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the service.

### Initiate Scan

```
POST /scan
```

Initiates a new cloud resource scan.

**Request Body:**

```json
{
  "scanId": "string",
  "cloudProvider": "aws|azure|gcp",
  "region": "string",
  "scanType": "full|incremental|targeted",
  "resources": ["resource-ids"]
}
```

### Validate Scan Configuration

```
POST /scan/validate
```

Validates a scan configuration before execution.

## Environment Variables

- `PORT`: Service port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `AWS_REGION`: AWS region for scanning
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
docker build -t upcb-scanner:latest .
```

Run the container:

```bash
docker run -p 3001:3001 upcb-scanner:latest
```

## Deployment

This service is designed to run on AWS Fargate as part of the U-PCB infrastructure.
