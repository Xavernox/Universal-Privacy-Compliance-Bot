import sgMail from '@sendgrid/mail';
import { WebClient } from '@slack/web-api';
import { IAlert } from '@/lib/db/models/Alert';

interface SendResult {
  channel: 'email' | 'slack';
  success: boolean;
  deliveryTime: number;
  error?: string;
}

interface AlertDeliveryMetrics {
  startTime: number;
  endTime: number;
  totalTime: number;
  results: SendResult[];
  withinSLA: boolean;
}

interface AlertingConfig {
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  slackBotToken?: string;
  slackChannelId?: string;
  slaTreshold?: number;
}

export class AlertingService {
  private sgMailClient: any | null = null;
  private slackClient: WebClient | null = null;
  private config: Required<AlertingConfig>;
  private metrics: AlertDeliveryMetrics[] = [];

  constructor(config: AlertingConfig = {}) {
    this.config = {
      sendgridApiKey: config.sendgridApiKey || process.env.SENDGRID_API_KEY || '',
      sendgridFromEmail: config.sendgridFromEmail || process.env.SENDGRID_FROM_EMAIL || '',
      slackBotToken: config.slackBotToken || process.env.SLACK_BOT_TOKEN || '',
      slackChannelId: config.slackChannelId || process.env.SLACK_CHANNEL_ALERTS || '',
      slaTreshold: config.slaTreshold || parseInt(process.env.ALERT_SLA_THRESHOLD || '2000'),
    };

    if (this.config.sendgridApiKey) {
      this.sgMailClient = sgMail;
      this.sgMailClient.setApiKey(this.config.sendgridApiKey);
    }

    if (this.config.slackBotToken) {
      this.slackClient = new WebClient(this.config.slackBotToken);
    }
  }

  async sendAlert(alert: IAlert, email?: string): Promise<AlertDeliveryMetrics> {
    const startTime = Date.now();
    const results: SendResult[] = [];

    const emailResult = await this.sendEmailAlert(alert, email);
    results.push(emailResult);

    const slackResult = await this.sendSlackAlert(alert);
    results.push(slackResult);

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const withinSLA = totalTime <= this.config.slaTreshold;

    const metrics: AlertDeliveryMetrics = {
      startTime,
      endTime,
      totalTime,
      results,
      withinSLA,
    };

    this.metrics.push(metrics);
    this.logMetrics(metrics);

    return metrics;
  }

  private async sendEmailAlert(alert: IAlert, email?: string): Promise<SendResult> {
    const startTime = Date.now();

    if (!this.sgMailClient || !email) {
      return {
        channel: 'email',
        success: false,
        deliveryTime: Date.now() - startTime,
        error: 'SendGrid not configured or email not provided',
      };
    }

    try {
      const severityColor = this.getSeverityColor(alert.severity);
      const msg = {
        to: email,
        from: this.config.sendgridFromEmail,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: this.formatEmailContent(alert, severityColor),
      };

      await this.sgMailClient.send(msg);

      const deliveryTime = Date.now() - startTime;
      return {
        channel: 'email',
        success: true,
        deliveryTime,
      };
    } catch (error: any) {
      const deliveryTime = Date.now() - startTime;
      return {
        channel: 'email',
        success: false,
        deliveryTime,
        error: error.message,
      };
    }
  }

  private async sendSlackAlert(alert: IAlert): Promise<SendResult> {
    const startTime = Date.now();

    if (!this.slackClient) {
      return {
        channel: 'slack',
        success: false,
        deliveryTime: Date.now() - startTime,
        error: 'Slack not configured',
      };
    }

    try {
      const color = this.getSeverityHexColor(alert.severity);
      const message = {
        channel: this.config.slackChannelId,
        attachments: [
          {
            color,
            title: alert.title,
            text: alert.description,
            fields: [
              {
                title: 'Severity',
                value: alert.severity,
                short: true,
              },
              {
                title: 'Status',
                value: alert.status,
                short: true,
              },
              {
                title: 'Resource Type',
                value: alert.resourceType,
                short: true,
              },
              {
                title: 'Resource ID',
                value: alert.resourceId,
                short: true,
              },
              {
                title: 'Cloud Provider',
                value: alert.cloudProvider,
                short: true,
              },
            ],
            footer: 'U-PCB Alert System',
            ts: Math.floor(alert.createdAt.getTime() / 1000),
          },
        ],
      };

      await this.slackClient.chat.postMessage(message as any);

      const deliveryTime = Date.now() - startTime;
      return {
        channel: 'slack',
        success: true,
        deliveryTime,
      };
    } catch (error: any) {
      const deliveryTime = Date.now() - startTime;
      return {
        channel: 'slack',
        success: false,
        deliveryTime,
        error: error.message,
      };
    }
  }

  private formatEmailContent(alert: IAlert, color: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #333; }
            .actions { margin-top: 20px; }
            .button { background-color: ${color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">${alert.title}</h2>
              <p style="margin: 5px 0 0 0;">Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div class="content">
              <p>${alert.description}</p>
              <div class="field">
                <span class="label">Resource Type:</span> ${alert.resourceType}
              </div>
              <div class="field">
                <span class="label">Resource ID:</span> ${alert.resourceId}
              </div>
              <div class="field">
                <span class="label">Cloud Provider:</span> ${alert.cloudProvider}
              </div>
              <div class="field">
                <span class="label">Status:</span> ${alert.status}
              </div>
              ${alert.region ? `<div class="field"><span class="label">Region:</span> ${alert.region}</div>` : ''}
              ${
                alert.affectedResources.length > 0
                  ? `
                <div class="field">
                  <span class="label">Affected Resources:</span>
                  <ul>${alert.affectedResources.map((r) => `<li>${r}</li>`).join('')}</ul>
                </div>
              `
                  : ''
              }
              ${
                alert.recommendedActions.length > 0
                  ? `
                <div class="field">
                  <span class="label">Recommended Actions:</span>
                  <ul>${alert.recommendedActions.map((a) => `<li>${a}</li>`).join('')}</ul>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#10b981',
      info: '#3b82f6',
    };
    return colors[severity] || '#6b7280';
  }

  private getSeverityHexColor(severity: string): string {
    return this.getSeverityColor(severity);
  }

  getMetrics(): AlertDeliveryMetrics[] {
    return this.metrics;
  }

  getMetricsSummary() {
    if (this.metrics.length === 0) {
      return {
        totalAlerts: 0,
        averageDeliveryTime: 0,
        slaCompliance: 100,
        failureRate: 0,
      };
    }

    const totalAlerts = this.metrics.length;
    const totalTime = this.metrics.reduce((sum, m) => sum + m.totalTime, 0);
    const averageDeliveryTime = totalTime / totalAlerts;
    const withinSLA = this.metrics.filter((m) => m.withinSLA).length;
    const slaCompliance = (withinSLA / totalAlerts) * 100;
    const failures = this.metrics.reduce(
      (sum, m) => sum + m.results.filter((r) => !r.success).length,
      0
    );
    const failureRate = (failures / (totalAlerts * 2)) * 100;

    return {
      totalAlerts,
      averageDeliveryTime: Math.round(averageDeliveryTime),
      slaCompliance: Math.round(slaCompliance * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
    };
  }

  private logMetrics(metrics: AlertDeliveryMetrics): void {
    console.log(
      `[Alert Delivery] Total time: ${metrics.totalTime}ms, Within SLA: ${metrics.withinSLA}`
    );
    metrics.results.forEach((result) => {
      const status = result.success ? '✅' : '❌';
      console.log(
        `  ${status} ${result.channel}: ${result.deliveryTime}ms${result.error ? ` (${result.error})` : ''}`
      );
    });
  }
}

export const alertingService = new AlertingService();
