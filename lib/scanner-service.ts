import axios, { AxiosInstance } from 'axios';

const SCANNER_SERVICE_URL = process.env.SCANNER_SERVICE_URL || 'http://localhost:8000';
const SCANNER_SERVICE_TIMEOUT = 60000; // 60 seconds

class ScannerServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SCANNER_SERVICE_URL,
      timeout: SCANNER_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Site-Scanner-NextJS/1.0.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Scanner Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Scanner Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Scanner Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`Scanner Service Error: ${error.response.status} ${error.response.data}`);
        } else if (error.request) {
          console.error('Scanner Service Network Error: No response received');
        } else {
          console.error('Scanner Service Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async scanWebsite(request: {
    url: string;
    depth?: number;
    timeout?: number;
  }): Promise<any> {
    try {
      const response = await this.client.post('/scan', {
        url: request.url,
        depth: request.depth || 1,
        timeout: request.timeout || 30
      });

      return response.data;
    } catch (error: any) {
      // Enhance error handling with specific messages
      if (error.response?.status === 408) {
        throw new Error('Scanner service timeout - the target website took too long to load');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid URL: ${error.response.data?.detail || 'URL format is invalid'}`);
      } else if (error.response?.status >= 500) {
        throw new Error(`Scanner service error: ${error.response.data?.detail || 'Internal server error'}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Scanner service is not available - please check if the service is running');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Scanner service URL is not reachable');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Scanner service request timed out');
      } else {
        throw new Error(`Scanner service communication failed: ${error.message}`);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Scanner service health check failed:', error);
      return false;
    }
  }

  async getScanResult(scanId: string): Promise<any> {
    try {
      const response = await this.client.get(`/scan/${scanId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Scan result not found');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const scannerServiceClient = new ScannerServiceClient();

// Export the class for testing
export { ScannerServiceClient };
