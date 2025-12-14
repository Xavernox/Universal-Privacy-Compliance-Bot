export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const SCAN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const ALERT_STATUS = {
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
} as const;

export const POLICY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
} as const;

export const API_TIMEOUT = 30000; // 30 seconds

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SCAN: '/scan',
  POLICIES: '/policies',
  ALERTS: '/alerts',
  SETTINGS: '/settings',
  COMPONENTS: '/components',
} as const;
