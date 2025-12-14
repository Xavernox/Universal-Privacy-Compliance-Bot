# Instant Alert Pipeline - Implementation Guide

## Overview

The Instant Alert Pipeline delivers a premium compliance monitoring and alert experience with:

- **Real-time alerts** via SendGrid email and Slack notifications
- **Sub-2 second delivery SLA** with instrumentation
- **Admin dashboard** with WebSocket/SSE real-time updates
- **Automatic scanner failure monitoring** with critical alerts

## Architecture

### Components

1. **AlertingService** (`/lib/alerting/alertingService.ts`)
   - Handles SendGrid email and Slack notifications
   - Tracks delivery metrics and SLA compliance
   - Supports all severity levels with color coding

2. **RealtimeService** (`/lib/alerting/realtimeService.ts`)
   - In-memory subscriber management
   - Publishes alerts to real-time subscribers
   - Broadcasts to admin dashboards

3. **QueueService** (`/lib/alerting/queueService.ts`)
   - Bull/Redis-based message queue
   - Asynchronous alert delivery
   - Automatic retry with exponential backoff
   - Removes completed jobs after 1 hour

4. **Alert Endpoints**
   - `POST /api/alert` - Create new alerts (triggers delivery)
   - `GET /api/alert` - Retrieve user alerts
   - `POST /api/admin/scanner-failures` - Report scanner failures (creates critical alerts)
   - `GET /api/admin/dashboard/alerts` - Admin alert listing with filtering
   - `GET /api/admin/dashboard/alerts/stream` - Server-Sent Events for real-time updates
   - `GET /api/admin/metrics/alerts` - Delivery metrics and SLA tracking

5. **Admin Dashboard** (`/components/AlertDashboard.tsx`)
   - Real-time alert streaming with SSE
   - Severity color-coded alerts (critical/high/medium/low/info)
   - Filtering by severity, status, and time range
   - SLA compliance metrics display
   - Alert statistics and delivery performance

## Configuration

### Environment Variables

```env
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@upcb-mvp.local

# Slack Configuration
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_CHANNEL_ALERTS=C000000000

# Redis Configuration (for Bull queues)
REDIS_URL=redis://localhost:6379

# Alert SLA Configuration (milliseconds)
ALERT_SLA_THRESHOLD=2000

# Service URLs
ALERT_SERVICE_URL=http://localhost:3000
```

## Usage

### Creating an Alert

```typescript
const alert = await Alert.create({
  userId: user._id,
  title: 'Security Violation Detected',
  description: 'Unauthorized access attempt',
  severity: 'critical',
  resourceType: 'EC2',
  resourceId: 'i-1234567890abcdef0',
  cloudProvider: 'aws',
  affectedResources: ['instance-1'],
  recommendedActions: ['Terminate instance', 'Review logs'],
});
```

When an alert is created:

1. It's immediately published to real-time subscribers
2. Added to the delivery queue for SendGrid/Slack
3. Delivery is tracked with timing metrics
4. SLA compliance is monitored

### Accessing the Admin Dashboard

Navigate to `/admin/dashboard` (requires admin authentication)

Features:

- **Real-time updates**: Alerts appear instantly as they're created
- **Color-coded severity**: Visual indication of alert priority
- **Filtering**: By severity, status, and time range
- **Metrics**: Delivery time, SLA compliance percentage, failure rates
- **Live status**: Connection indicator showing real-time stream status

### Scanner Failure Reporting

The scanner service can report failures:

```typescript
await axios.post(
  'http://localhost:3000/api/admin/scanner-failures',
  {
    scanId: 'scan-123',
    userId: 'user-456',
    errorMessage: 'AWS credentials invalid',
    cloudProvider: 'aws',
    scanType: 'full',
  },
  {
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
  }
);
```

This automatically:

1. Creates a **critical** alert
2. Updates the scan status to 'failed'
3. Publishes to real-time dashboard
4. Queues for email/Slack delivery
5. Includes recommended remediation actions

## SLA Monitoring

### Metrics Tracked

- **Total Delivery Time**: From alert creation to email/Slack delivery
- **Per-channel Metrics**: Individual timing for email and Slack
- **SLA Compliance**: Percentage of alerts delivered within 2 seconds
- **Failure Rate**: Percentage of failed delivery attempts
- **Queue Status**: Bull queue depth and retry counts

### Accessing Metrics

```bash
GET /api/admin/metrics/alerts
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "alertDelivery": {
    "totalAlerts": 150,
    "averageDeliveryTime": 1245,
    "slaCompliance": 98.5,
    "failureRate": 1.2,
    "slaThreshold": 2000,
    "status": "healthy"
  },
  "queue": {
    "counts": {
      "active": 2,
      "completed": 148,
      "failed": 0,
      "delayed": 0,
      "waiting": 0
    },
    "failedCount": 0,
    "delayedCount": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

### Unit Tests

```bash
npm run test
```

Test coverage includes:

- **AlertingService**: Email/Slack delivery, SLA tracking
- **RealtimeService**: Subscriptions, publishing, statistics
- **Performance**: Sub-2 second delivery verification
- **Edge cases**: Long descriptions, empty fields, configuration errors

### Performance Testing

Integration tests verify:

- Single alert delivery < 2 seconds
- Batch alert delivery efficiency
- SLA compliance rate (target: >95%)
- Real-time dashboard updates
- Queue processing reliability

Run performance tests:

```bash
npm run test -- __tests__/alerting/performance.test.ts
```

## Telemetry & Logging

### Log Output

AlertingService logs each delivery:

```
[Alert Delivery] Total time: 1342ms, Within SLA: true
  ✅ email: 1205ms
  ✅ slack: 1342ms
```

Admin console outputs queue events:

```
[Scanner] Reporting failure for scan scan-123: AWS credentials invalid
[Scanner] Alert created successfully for scan failure: scan-123
```

### Metrics Export

Metrics are available via `/api/admin/metrics/alerts` for integration with monitoring systems.

## Troubleshooting

### Alerts Not Being Delivered

1. **Check Redis connection**: Ensure `REDIS_URL` is configured and Redis is running
2. **Verify SendGrid key**: Check `SENDGRID_API_KEY` is valid
3. **Check Slack token**: Verify `SLACK_BOT_TOKEN` is valid
4. **Queue status**: Call `/api/admin/metrics/alerts` to check queue health

### High Delivery Times

1. **Check Redis latency**: Use `redis-cli PING` to verify connection speed
2. **Monitor external APIs**: SendGrid/Slack rate limits or slow responses
3. **Review queue backlog**: Check `counts.active` in metrics response

### Real-time Dashboard Not Updating

1. **Check event stream**: Open browser DevTools and verify SSE connection
2. **Verify admin auth**: Ensure valid token is provided
3. **Check browser console**: Look for connection errors
4. **Monitor server logs**: Check for subscription errors

## Performance Targets

- **Alert Delivery**: < 2 seconds (measured end-to-end)
- **Dashboard Update**: < 100ms (from event emission to client display)
- **Queue Processing**: > 95% success rate
- **SLA Compliance**: > 95% of alerts within threshold

## Future Enhancements

- WebSocket support for even faster real-time updates
- Multi-tenancy support for alert routing
- Alert templating and customization
- Webhook integration for custom notification channels
- Alert aggregation and deduplication
- Machine learning-based alert prioritization
