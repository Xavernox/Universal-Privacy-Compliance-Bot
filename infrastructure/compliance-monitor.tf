terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "admin_email" {
  description = "Administrator email for alerts"
  type        = string
  default     = "admin@company.com"
}

variable "sendgrid_api_key_secret" {
  description = "AWS Secrets Manager secret name for SendGrid API key"
  type        = string
  default     = "SendGridApiKey"
}

variable "slack_webhook_secret" {
  description = "AWS Secrets Manager secret name for Slack webhook URL"
  type        = string
  default     = "SlackWebhookUrl"
}

variable "dynamodb_tables" {
  description = "Configuration for DynamoDB tables"
  type = map(object({
    users_table        = string
    trackers_table     = string
    policies_table     = string
    compliance_scans   = string
  }))
  default = {
    dev = {
      users_table        = "dev-Users"
      trackers_table     = "dev-Trackers"
      policies_table     = "dev-Policies"
      compliance_scans   = "dev-ComplianceScans"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}

# SQS Queue for scan jobs
resource "aws_sqs_queue" "monitor_queue" {
  name                              = "${var.environment}-compliance-monitor-queue"
  visibility_timeout_seconds       = 300
  message_retention_seconds        = 1209600 # 14 days
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dl_queue.arn
    maxReceiveCount     = 3
  })
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# Dead Letter Queue for failed messages
resource "aws_sqs_queue" "dl_queue" {
  name = "${var.environment}-compliance-monitor-dlq"
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# IAM Role for Monitor Lambda
resource "aws_iam_role" "monitor_lambda_role" {
  name = "${var.environment}-compliance-monitor-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# IAM Policy for Monitor Lambda
resource "aws_iam_role_policy" "monitor_lambda_policy" {
  name = "${var.environment}-compliance-monitor-policy"
  role = aws_iam_role.monitor_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.monitor_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_caller_identity.current.region}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_tables[var.environment].users_table}",
          "arn:aws:dynamodb:${data.aws_caller_identity.current.region}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_tables[var.environment].trackers_table}",
          "arn:aws:dynamodb:${data.aws_caller_identity.current.region}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_tables[var.environment].policies_table}",
          "arn:aws:dynamodb:${data.aws_caller_identity.current.region}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_tables[var.environment].compliance_scans}",
          "arn:aws:dynamodb:${data.aws_caller_identity.current.region}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_tables[var.environment].users_table}/index/ActiveUsersIndex"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.sendgrid_secret.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.slack_secret.arn
      }
    ]
  })
}

# IAM Role for Alert Lambda
resource "aws_iam_role" "alert_lambda_role" {
  name = "${var.environment}-compliance-alert-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# IAM Policy for Alert Lambda
resource "aws_iam_role_policy" "alert_lambda_policy" {
  name = "${var.environment}-compliance-alert-policy"
  role = aws_iam_role.alert_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.sendgrid_secret.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.slack_secret.arn
      }
    ]
  })
}

# Monitor Lambda Function
resource "aws_lambda_function" "monitor_lambda" {
  filename      = "lambda/monitor.zip" # This would be generated in real deployment
  function_name = "${var.environment}-compliance-monitor"
  handler       = "index.handler"
  role          = aws_iam_role.monitor_lambda_role.arn
  runtime       = "nodejs18.x"
  timeout       = 300
  
  environment {
    variables = {
      ENVIRONMENT       = var.environment
      MONITOR_QUEUE_URL = aws_sqs_queue.monitor_queue.url
      USERS_TABLE       = var.dynamodb_tables[var.environment].users_table
      TRACKERS_TABLE    = var.dynamodb_tables[var.environment].trackers_table
      POLICIES_TABLE    = var.dynamodb_tables[var.environment].policies_table
    }
  }
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# Alert Lambda Function
resource "aws_lambda_function" "alert_lambda" {
  filename      = "lambda/alerts.zip" # This would be generated in real deployment
  function_name = "${var.environment}-compliance-alert"
  handler       = "alertService.handler"
  role          = aws_iam_role.alert_lambda_role.arn
  runtime       = "nodejs18.x"
  timeout       = 60
  
  environment {
    variables = {
      ENVIRONMENT            = var.environment
      SENDGRID_API_KEY       = aws_secretsmanager_secret_version.sendgrid_secret_version.secret_string
      SLACK_WEBHOOK_URL      = aws_secretsmanager_secret_version.slack_secret_version.secret_string
      ADMIN_EMAIL            = var.admin_email
      ALERT_FROM_EMAIL       = "alerts-${var.environment}@compliance-system.com"
    }
  }
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# EventBridge Rule for daily monitoring
resource "aws_cloudwatch_event_rule" "daily_monitor_rule" {
  name                = "${var.environment}-daily-compliance-monitor"
  description         = "Triggers compliance monitoring daily"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily
  is_enabled          = true
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# EventBridge Target for Monitor Lambda
resource "aws_cloudwatch_event_target" "monitor_lambda_target" {
  rule      = aws_cloudwatch_event_rule.daily_monitor_rule.name
  arn       = aws_lambda_function.monitor_lambda.arn
  target_id = "MonitorLambdaTarget"
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "eventbridge_invoke" {
  statement_id  = "AllowEventBridgeToInvokeMonitorLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitor_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_monitor_rule.arn
}

# Secrets for SendGrid API Key
resource "aws_secretsmanager_secret" "sendgrid_secret" {
  name                    = "${var.environment}/${var.sendgrid_api_key_secret}"
  description             = "SendGrid API Key for email alerts"
  recovery_window_in_days = 30
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

resource "aws_secretsmanager_secret_version" "sendgrid_secret_version" {
  secret_id = aws_secretsmanager_secret.sendgrid_secret.id
  secret_string = jsonencode({
    apiKey = "SG.your_sendgrid_api_key_here" # Replace with actual API key
  })
}

# Secrets for Slack Webhook URL
resource "aws_secretsmanager_secret" "slack_secret" {
  name                    = "${var.environment}/${var.slack_webhook_secret}"
  description             = "Slack webhook URL for alerts"
  recovery_window_in_days = 30
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

resource "aws_secretsmanager_secret_version" "slack_secret_version" {
  secret_id = aws_secretsmanager_secret.slack_secret.id
  secret_string = jsonencode({
    webhookUrl = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" # Replace with actual webhook URL
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "monitor_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.monitor_lambda.function_name}"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

resource "aws_cloudwatch_log_group" "alert_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.alert_lambda.function_name}"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "monitor_lambda_errors" {
  alarm_name          = "${var.environment}-compliance-monitor-errors"
  alarm_description   = "Alert when monitor lambda has errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.monitor_lambda.function_name
  }
  
  alarm_actions = []
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

resource "aws_cloudwatch_metric_alarm" "monitor_queue_age" {
  alarm_name          = "${var.environment}-compliance-monitor-queue-age"
  alarm_description   = "Alert when messages in monitor queue are too old"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "1800"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.monitor_queue.name
  }
  
  alarm_actions = []
  
  tags = {
    Environment = var.environment
    Service     = "Compliance-Monitor"
  }
}

# Outputs
output "monitor_queue_url" {
  description = "URL of the SQS queue for scan jobs"
  value       = aws_sqs_queue.monitor_queue.url
}

output "monitor_lambda_function_name" {
  description = "Name of the Monitor Lambda function"
  value       = aws_lambda_function.monitor_lambda.function_name
}

output "alert_lambda_function_name" {
  description = "Name of the Alert Lambda function"
  value       = aws_lambda_function.alert_lambda.function_name
}

output "sendgrid_secret_arn" {
  description = "ARN of the SendGrid API key secret"
  value       = aws_secretsmanager_secret.sendgrid_secret.arn
}

output "slack_secret_arn" {
  description = "ARN of the Slack webhook secret"
  value       = aws_secretsmanager_secret.slack_secret.arn
}

output "daily_schedule_arn" {
  description = "ARN of the EventBridge schedule"
  value       = aws_cloudwatch_event_rule.daily_monitor_rule.arn
}

output "environment_info" {
  description = "Environment information"
  value = {
    environment           = var.environment
    aws_region            = data.aws_caller_identity.current.region
    account_id            = data.aws_caller_identity.current.account_id
    monitor_lambda_arn    = aws_lambda_function.monitor_lambda.arn
    alert_lambda_arn      = aws_lambda_function.alert_lambda.arn
    monitor_queue_arn     = aws_sqs_queue.monitor_queue.arn
    daily_schedule_arn    = aws_cloudwatch_event_rule.daily_monitor_rule.arn
  }
}