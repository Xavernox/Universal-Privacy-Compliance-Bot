# Terraform variables for Site Scanner Infrastructure

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "site-scanner"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = false
}

variable "scanner_task_cpu" {
  description = "CPU units for ECS task definition"
  type        = number
  default     = 1024
}

variable "scanner_task_memory" {
  description = "Memory (MB) for ECS task definition"
  type        = number
  default     = 2048
}

variable "scanner_service_desired_count" {
  description = "Desired number of ECS tasks for the scanner service"
  type        = number
  default     = 2
}

variable "tags" {
  description = "Tags to apply to all resources"
  type = map(string)
  default = {
    Project     = "site-scanner"
    Environment = "development"
    ManagedBy   = "terraform"
    Team        = "devops"
    CostCenter  = "engineering"
  }
}
