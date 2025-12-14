// TypeScript interfaces for scan results and requests

export interface ScanRequest {
  url: string;
  depth?: number;
  timeout?: number;
}

export interface ThirdPartyResource {
  host: string;
  type: string; // script, cookie, tracker, pixel, etc.
  url: string;
  risk_level: string; // low, medium, high, critical
  description: string;
  category: string;
}

export interface ScanSummary {
  total_resources: number;
  by_type: Record<string, number>;
  by_risk: Record<string, number>;
  by_category: Record<string, number>;
  unique_hosts: number;
}

export interface ScanResult {
  scan_id: string;
  target_url: string;
  timestamp: string;
  resources: ThirdPartyResource[];
  summary: ScanSummary;
  scan_duration: number;
  pages_scanned: number;
  // Additional fields added by enrichment
  enriched_at?: string;
  metadata?: {
    scanner_version: string;
    enrichment_applied: boolean;
    risk_analysis?: any;
    category_analysis?: any;
    recommendations?: any[];
  };
}

export interface ScanResponse extends ScanResult {
  // API response wrapper with additional metadata
  status: 'success' | 'error';
  message?: string;
  error?: string;
}

// MongoDB document structure for scan records
export interface ScanDocument {
  _id?: any;
  scan_id: string;
  target_url: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  failed_at?: Date;
  scan_duration?: number;
  request_data?: ScanRequest;
  results?: ScanResult;
  error?: string;
  user_id?: string; // Optional, for future user association
}

// API Error response
export interface ApiError {
  error: string;
  scanId?: string;
  duration?: number;
  timestamp?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  database?: 'connected' | 'disconnected';
  scanner_service?: 'available' | 'unavailable';
  timestamp: string;
}
