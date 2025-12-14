# Site Scanner Infrastructure as Code
# Terraform configuration for deploying the scanner service on AWS

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "site-scanner-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

# Configure AWS provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "site-scanner"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  project     = var.project_name
  
  # VPC Configuration
  vpc_cidr = var.vpc_cidr
  
  # Subnets - using public subnets for simplicity
  public_subnet_cidrs = var.public_subnet_cidrs
  
  # NAT Gateway (set to false for development)
  enable_nat_gateway = var.enable_nat_gateway
  
  tags = var.tags
}

# ECR Repository for Scanner Service
resource "aws_ecr_repository" "scanner_service" {
  name                 = "${var.project_name}-scanner-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "AES256"
  }
  
  tags = var.tags
}

# Security Groups
resource "aws_security_group" "scanner_service" {
  name_prefix = "${var.project_name}-scanner-service-"
  description = "Security group for Site Scanner Service"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr]
    description = "Scanner service internal traffic"
  }
  
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Scanner service health check"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-scanner-service"
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = var.tags
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "scanner_service" {
  name              = "/ecs/${var.project_name}-scanner-service"
  retention_in_days = 30
  
  tags = var.tags
}

# ECS Task Definition for Scanner Service
resource "aws_ecs_task_definition" "scanner_service" {
  family                   = "${var.project_name}-scanner-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.scanner_task_cpu
  memory                   = var.scanner_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name  = "scanner-service"
      image = "${aws_ecr_repository.scanner_service.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "8000"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-region         = var.aws_region
          awslogs-group         = aws_cloudwatch_log_group.scanner_service.name
          awslogs-stream-prefix = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      memoryReservation = 512
    }
  ])
  
  tags = var.tags
}

# ECS Service for Scanner Service
resource "aws_ecs_service" "scanner_service" {
  name            = "${var.project_name}-scanner-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scanner_service.arn
  desired_count   = var.scanner_service_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    security_groups = [aws_security_group.scanner_service.id]
    subnets         = module.vpc.public_subnet_ids
    assign_public_ip = true
  }
  
  depends_on = [aws_lb_listener.scanner_service]
  
  tags = var.tags
}

# Application Load Balancer for Scanner Service
resource "aws_lb" "scanner_service" {
  name               = "${var.project_name}-scanner-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnet_ids
  
  enable_deletion_protection = var.environment == "production" ? true : false
  
  tags = var.tags
}

resource "aws_lb_target_group" "scanner_service" {
  name        = "${var.project_name}-scanner-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = var.tags
}

resource "aws_lb_listener" "scanner_service" {
  load_balancer_arn = aws_lb.scanner_service.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.scanner_service.arn
  }
  
  tags = var.tags
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP traffic"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS traffic"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = var.tags
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

# ECR Repository Policy (for CI/CD)
resource "aws_ecr_repository_policy" "scanner_service" {
  repository = aws_ecr_repository.scanner_service.name
  policy     = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushPull"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}

# Outputs
output "ecr_repository_url" {
  description = "ECR repository URL for the scanner service"
  value       = aws_ecr_repository.scanner_service.repository_url
}

output "scanner_service_url" {
  description = "URL of the scanner service"
  value       = "http://${aws_lb.scanner_service.dns_name}"
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.scanner_service.dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}
