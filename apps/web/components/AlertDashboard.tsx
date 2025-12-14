'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: string;
  resourceType: string;
  resourceId: string;
  cloudProvider: string;
  userId: string;
  createdAt: string;
}

interface Filters {
  severity?: string;
  status?: string;
  timeRange: string;
}

const AlertDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filters, setFilters] = useState<Filters>({
    timeRange: '24h',
  });
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#10b981',
      info: '#3b82f6',
    };
    return colors[severity] || '#6b7280';
  };

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      params.append('timeRange', filters.timeRange);
      params.append('limit', '50');

      const storedToken = localStorage.getItem('token') || '';
      const response = await fetch(`/api/admin/dashboard/alerts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setStatistics(data.statistics || null);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics/alerts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const setupRealtimeConnection = () => {
    const eventSource = new EventSource('/api/admin/dashboard/alerts/stream');

    eventSource.addEventListener('alert', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.alert) {
          setAlerts((prev) => [data.alert, ...prev]);
        }
      } catch (error) {
        console.error('Failed to parse alert event:', error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      setIsConnected(true);
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  useEffect(() => {
    fetchAlerts();
    fetchMetrics();
    setupRealtimeConnection();

    const alertInterval = setInterval(fetchAlerts, 30000);
    const metricsInterval = setInterval(fetchMetrics, 60000);

    return () => {
      clearInterval(alertInterval);
      clearInterval(metricsInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div
        style={{
          background: isConnected ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${isConnected ? '#10b981' : '#ef4444'}`,
          borderRadius: '0.375rem',
          padding: '1rem',
          marginBottom: '2rem',
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Real-time Status:</strong>{' '}
          <span style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </p>
      </div>

      {metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.375rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Average Delivery Time</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>
              {metrics.alertDelivery.averageDeliveryTime}ms
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>SLA: 2000ms</div>
          </div>

          <div
            style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.375rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>SLA Compliance</div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: metrics.alertDelivery.slaCompliance >= 95 ? '#10b981' : '#ea580c',
              }}
            >
              {metrics.alertDelivery.slaCompliance.toFixed(2)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Status: {metrics.alertDelivery.status}
            </div>
          </div>

          <div
            style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.375rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Alerts</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>
              {metrics.alertDelivery.totalAlerts}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Delivery Failure Rate: {metrics.alertDelivery.failureRate.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={filters.severity || ''}
          onChange={(e) => handleFilterChange('severity', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontFamily: 'inherit',
          }}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontFamily: 'inherit',
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.timeRange}
          onChange={(e) => handleFilterChange('timeRange', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontFamily: 'inherit',
          }}
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280',
            background: '#f9fafb',
            borderRadius: '0.375rem',
          }}
        >
          No alerts found
        </div>
      ) : (
        <div>
          <h3 style={{ marginTop: 0 }}>Alerts ({alerts.length})</h3>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
            }}
          >
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  border: `3px solid ${getSeverityColor(alert.severity)}`,
                  borderRadius: '0.375rem',
                  padding: '1rem',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, color: getSeverityColor(alert.severity) }}>
                      {alert.title}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      {alert.description}
                    </p>
                  </div>
                  <span
                    style={{
                      background: getSeverityColor(alert.severity),
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                  }}
                >
                  <div>
                    <strong>Resource:</strong> {alert.resourceType}
                  </div>
                  <div>
                    <strong>Provider:</strong> {alert.cloudProvider.toUpperCase()}
                  </div>
                  <div>
                    <strong>Status:</strong> {alert.status}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {statistics && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Statistics</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
            }}
          >
            {Object.entries(statistics.bySeverity || {}).map(([severity, count]) => (
              <div
                key={severity}
                style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}
              >
                <div
                  style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}
                >
                  {severity}
                </div>
                <div
                  style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: getSeverityColor(severity),
                  }}
                >
                  {count as number}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertDashboard;
