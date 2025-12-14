# Infrastructure

AWS CloudFormation/SAM templates for deploying the U-PCB MVP infrastructure.

## Architecture

The infrastructure consists of:

1. **VPC**: Multi-AZ VPC with public and private subnets
2. **Next.js Application**: Deployed as AWS Lambda function with Function URL
3. **ECS Cluster**: Fargate-based cluster for containerized services
4. **Scanner Service**: Container running on Fargate in private subnets
5. **Policy Service**: Container running on Fargate in private subnets
6. **Application Load Balancer**: Routes traffic to container services
7. **Secrets Manager**: Stores sensitive configuration
8. **DynamoDB**: Session storage (optional)
9. **CloudWatch Logs**: Centralized logging

## Prerequisites

- AWS CLI installed and configured
- AWS SAM CLI installed
- Docker installed (for local testing)
- Valid AWS credentials with appropriate permissions

## Parameters

The template requires the following parameters:

- `Environment`: Environment name (dev, staging, production)
- `MongoDBUri`: MongoDB connection string (Atlas or self-hosted)
- `JWTSecret`: Secret key for JWT token signing
- `AdminBasicToken`: Basic auth token for admin endpoints
- VPC and subnet CIDR blocks (optional, defaults provided)

## Deployment

### 1. Build the Application

Build the Next.js application and container images:

```bash
cd ../apps/web
npm run build

cd ../../services/scanner
docker build -t upcb-scanner:latest .

cd ../policy
docker build -t upcb-policy:latest .
```

### 2. Push Container Images to ECR

Create ECR repositories and push images:

```bash
aws ecr create-repository --repository-name upcb-scanner
aws ecr create-repository --repository-name upcb-policy

# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag upcb-scanner:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/upcb-scanner:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/upcb-scanner:latest

docker tag upcb-policy:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/upcb-policy:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/upcb-policy:latest
```

### 3. Deploy with SAM

First-time deployment (guided):

```bash
cd infra
sam build
sam deploy --guided
```

Subsequent deployments:

```bash
sam build
sam deploy
```

### 4. Deploy ECS Services

After the base infrastructure is deployed, create task definitions and services for the scanner and policy containers.

Create a task definition file (`scanner-task-definition.json`):

```json
{
  "family": "upcb-scanner",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "<ECS_TASK_EXECUTION_ROLE_ARN>",
  "taskRoleArn": "<ECS_TASK_ROLE_ARN>",
  "containerDefinitions": [
    {
      "name": "scanner",
      "image": "<ECR_SCANNER_IMAGE>",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "<SECRETS_MANAGER_ARN>:MONGODB_URI::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/upcb-mvp/scanner",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register the task definition and create the service:

```bash
aws ecs register-task-definition --cli-input-json file://scanner-task-definition.json

aws ecs create-service \
  --cluster <CLUSTER_NAME> \
  --service-name upcb-scanner \
  --task-definition upcb-scanner \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PRIVATE_SUBNET_1>,<PRIVATE_SUBNET_2>],securityGroups=[<SCANNER_SG>]}" \
  --load-balancers "targetGroupArn=<SCANNER_TG_ARN>,containerName=scanner,containerPort=3001"
```

Repeat for the policy service.

## Configuration

### Environment Variables

All environment variables are managed through:

1. Secrets Manager (sensitive values)
2. CloudFormation parameters
3. Task definition environment variables

### Secrets Manager

Secrets are stored in AWS Secrets Manager and accessed by:

- Lambda functions via environment variables
- ECS tasks via secrets in task definitions

### MongoDB Connection

The infrastructure supports:

- MongoDB Atlas (recommended)
- Self-hosted MongoDB

Ensure the MongoDB connection string includes:

- Authentication credentials
- Database name
- Connection options (SSL, retryWrites, etc.)

## Monitoring

### CloudWatch Logs

All services log to CloudWatch Logs:

- `/ecs/<stack-name>/scanner`: Scanner service logs
- `/ecs/<stack-name>/policy`: Policy service logs
- `/aws/lambda/<function-name>`: Next.js Lambda logs

### CloudWatch Metrics

Key metrics to monitor:

- Lambda invocations, errors, duration
- ECS CPU and memory utilization
- ALB target health
- DynamoDB read/write capacity

## Cost Optimization

- ECS services use Fargate Spot for non-production environments
- Lambda uses pay-per-request pricing
- DynamoDB uses on-demand billing
- CloudWatch Logs retention set to 7 days

## Security

- VPC with public and private subnets
- NAT Gateway for private subnet internet access
- Security groups restrict access between services
- Secrets stored in Secrets Manager
- IAM roles follow least privilege principle
- HTTPS enforced (configure ACM certificate for production)

## Cleanup

To delete the entire stack:

```bash
sam delete
```

Note: Some resources (like S3 buckets, CloudWatch Logs) may need manual deletion.

## Troubleshooting

### Lambda Function Issues

Check CloudWatch Logs:

```bash
aws logs tail /aws/lambda/<function-name> --follow
```

### ECS Service Issues

Check ECS service events:

```bash
aws ecs describe-services --cluster <cluster-name> --services <service-name>
```

Check task logs:

```bash
aws logs tail /ecs/<stack-name>/scanner --follow
```

### Network Connectivity

Verify security group rules and VPC configuration.

## Future Enhancements

- [ ] Add CloudFront distribution for Next.js app
- [ ] Implement auto-scaling for ECS services
- [ ] Add AWS WAF for additional security
- [] Implement CI/CD pipeline
- [ ] Add monitoring dashboards
- [ ] Implement backup and disaster recovery
