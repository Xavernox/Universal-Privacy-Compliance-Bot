# Logging and Monitoring Hooks

## Overview

The Site Scanner service provides comprehensive logging and monitoring capabilities through Winston, AWS CloudWatch, and custom metrics collection. This document outlines the logging structure, monitoring hooks, and observability features.

## Logging Configuration

### Winston Logger Setup

The application uses Winston for structured logging with multiple transports:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### Log Categories

#### API Request Logs
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "category": "api_request",
  "method": "POST",
  "path": "/api/scan-site",
  "user_agent": "Mozilla/5.0...",
  "user_id": "user-123",
  "scan_id": "scan-456",
  "request_id": "req-789",
  "duration_ms": 2500,
  "status_code": 200
}
```

#### Scan Operation Logs
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "category": "scan_operation",
  "scan_id": "scan-456",
  "target_url": "https://example.com",
  "operation": "start",
  "depth": 1,
  "timeout": 30,
  "estimated_duration": 5000
}
```

```json
{
  "timestamp": "2024-01-01T00:00:05Z",
  "level": "info",
  "category": "scan_operation",
  "scan_id": "scan-456",
  "operation": "complete",
  "resources_found": 15,
  "scan_duration_ms": 4200,
  "success": true
}
```

#### Error Logs
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "error",
  "category": "error",
  "error_type": "scanner_service_timeout",
  "scan_id": "scan-456",
  "error_message": "Scanner service timeout - the target website took too long to load",
  "stack_trace": "Error: Scanner service timeout...",
  "request_id": "req-789"
}
```

#### Security Logs
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "warn",
  "category": "security",
  "event": "authentication_failed",
  "user_agent": "Malicious-Bot/1.0",
  "ip_address": "192.168.1.100",
  "reason": "expired_token"
}
```

### Environment-Specific Logging

#### Development
- Console logging with colors enabled
- Detailed error stack traces
- Request/response logging
- Debug level for troubleshooting

#### Production
- JSON-only logging format
- File-based logs with rotation
- Error and warning levels only
- Security event logging

#### Test
- Minimal console output
- Error logging only
- Test-specific log capture

## Monitoring Hooks

### Health Check Endpoints

#### API Health Check
```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "service": "site-scanner-api",
  "version": "1.0.0",
  "database": "connected",
  "scanner_service": "available",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime_seconds": 86400,
  "memory_usage_mb": 128,
  "active_connections": 5
}
```

#### Scanner Service Health
```bash
GET http://scanner-service:8000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "scanner",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "playwright_browsers": "available",
  "active_scans": 3
}
```

### Metrics Collection

#### Custom Metrics

1. **Request Metrics**
   - Request count by endpoint
   - Request duration percentiles
   - Error rate by status code
   - Active request count

2. **Scan Metrics**
   - Scans started/completed/failed
   - Average scan duration
   - Resources found per scan
   - Scanner service response time

3. **System Metrics**
   - Memory usage
   - Database connection count
   - Cache hit/miss ratio
   - External service availability

#### Metrics Implementation

```typescript
class MetricsCollector {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  incrementCounter(name: string, value = 1) {
    this.counters.set(name, (this.counters.get(name) || 0) + value);
  }

  recordHistogram(name: string, value: number) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(value);
  }

  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(values, 50),
            p95: this.percentile(values, 95),
            p99: this.percentile(values, 99)
          }
        ])
      )
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

### AWS CloudWatch Integration

#### CloudWatch Logs

Logs are automatically forwarded to CloudWatch using the AWS SDK:

```typescript
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

class CloudWatchLogger {
  private client = new CloudWatchLogsClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  async sendLogs(logEvents: LogEvent[]) {
    const command = new PutLogEventsCommand({
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/aws/ecs/site-scanner',
      logStreamName: `${Date.now()}`,
      logEvents
    });

    await this.client.send(command);
  }
}
```

#### CloudWatch Metrics

Custom application metrics are published to CloudWatch:

```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch-logs';

class CloudWatchMetrics {
  private client = new CloudWatchClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  async publishMetric(namespace: string, metricName: string, value: number, unit: string) {
    const command = new PutMetricDataCommand({
      Namespace: namespace,
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date()
      }]
    });

    await this.client.send(command);
  }
}
```

### Prometheus Metrics (Optional)

For Prometheus monitoring, expose metrics endpoint:

```typescript
import client from 'prom-client';

// Create metrics registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const scanDuration = new client.Histogram({
  name: 'scan_duration_seconds',
  help: 'Duration of website scans in seconds',
  buckets: [1, 5, 10, 30, 60, 120, 300]
});

register.registerMetric(httpRequestDuration);
register.registerMetric(scanDuration);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Alerting and Notifications

### Alert Rules

#### High Error Rate
- Trigger: Error rate > 5% over 5 minutes
- Action: Send alert to PagerDuty/Slack

#### Scanner Service Down
- Trigger: Health check fails for 2 minutes
- Action: Escalate to on-call engineer

#### High Latency
- Trigger: P95 latency > 10 seconds for 10 minutes
- Action: Investigate performance issues

#### Database Connection Issues
- Trigger: Connection failures > 3 in 5 minutes
- Action: Check database health

### Notification Channels

#### Slack Integration
```typescript
import { WebClient } from '@slack/web-api';

class SlackNotifier {
  private client = new WebClient(process.env.SLACK_BOT_TOKEN);

  async sendAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    const color = {
      low: '#36a64f',
      medium: '#ff9f00',
      high: '#ff0000',
      critical: '#8B0000'
    }[severity];

    await this.client.chat.postMessage({
      channel: process.env.SLACK_ALERT_CHANNEL,
      attachments: [{
        color,
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }
}
```

#### PagerDuty Integration
```typescript
import PD from 'node-pagerduty';

class PagerDutyNotifier {
  private client = new PD(process.env.PAGERDUTY_API_KEY);

  async triggerIncident(summary: string, severity: string, source: string) {
    await this.client.incidents.trigger({
      incident: {
        type: 'incident',
        title: summary,
        service: {
          id: process.env.PAGERDUTY_SERVICE_ID,
          type: 'service_reference'
        },
        urgency: severity === 'critical' ? 'high' : 'low',
        body: {
          type: 'incident_body',
          details: `Source: ${source}\nTimestamp: ${new Date().toISOString()}`
        }
      }
    });
  }
}
```

## Monitoring Dashboards

### CloudWatch Dashboards

Create CloudWatch dashboards for key metrics:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["SiteScanner", "RequestCount", "Endpoint", "/api/scan-site"],
          [".", "ErrorCount", ".", "."],
          [".", "AverageLatency", ".", "."]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "API Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["SiteScanner", "ScanCount", "Status", "completed"],
          [".", "ScanCount", "Status", "failed"],
          [".", "ScanDuration", ".", "."]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Scan Metrics"
      }
    }
  ]
}
```

### Grafana Dashboards

For Grafana integration, export metrics to Prometheus format and create custom dashboards with panels for:

- Request rate and error rate
- Scan success/failure rates
- Response time percentiles
- Resource usage (CPU, memory)
- Database connection pool status
- External service availability

## Log Analysis and Search

### Log Aggregation

Logs are aggregated using:

1. **CloudWatch Logs**: Primary log storage and search
2. **ELK Stack**: Optional for advanced log analysis
3. **Splunk**: Enterprise log analysis platform

### Search Queries

#### Error Analysis
```bash
# Find all errors in the last hour
fields @timestamp, level, category, error_message
| filter level = "error"
| sort @timestamp desc
| limit 100
```

#### Performance Analysis
```bash
# Find slow requests
fields @timestamp, duration_ms, target_url
| filter duration_ms > 5000
| sort duration_ms desc
| limit 50
```

#### Security Events
```bash
# Find authentication failures
fields @timestamp, category, event, ip_address
| filter category = "security"
| sort @timestamp desc
```

## Implementation Checklist

- [x] Winston logger configuration
- [x] Structured JSON logging
- [x] Health check endpoints
- [x] Custom metrics collection
- [x] CloudWatch integration
- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboard configuration
- [ ] Slack/PagerDuty alerting setup
- [ ] Log retention policies
- [ ] Performance monitoring alerts
- [ ] Security event monitoring
- [ ] Database performance tracking
- [ ] External service monitoring

## Best Practices

1. **Log Levels**: Use appropriate log levels (error, warn, info, debug)
2. **Structured Data**: Include relevant metadata in log entries
3. **Performance**: Avoid logging in hot paths, use sampling for high-volume logs
4. **Security**: Never log sensitive information (passwords, tokens, PII)
5. **Retention**: Implement appropriate log retention policies
6. **Monitoring**: Set up proactive monitoring and alerting
7. **Documentation**: Keep monitoring documentation up to date
8. **Testing**: Test alerting rules and notification channels regularly
