/**
 * Unit tests for the Scanner Service Client
 */

import axios from 'axios';
import { ScannerServiceClient } from '../../lib/scanner-service';

jest.mock('axios');

describe('ScannerServiceClient', () => {
  let client: ScannerServiceClient;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new ScannerServiceClient();
  });

  describe('scanWebsite', () => {
    it('should successfully scan a website', async () => {
      const mockResponse = {
        data: {
          scan_id: 'test-scan-123',
          target_url: 'https://example.com',
          resources: [],
          summary: {
            total_resources: 0,
            by_type: {},
            by_risk: {},
            by_category: {},
            unique_hosts: 0
          }
        }
      };

      mockAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await client.scanWebsite({
        url: 'https://example.com',
        depth: 1,
        timeout: 30
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8000',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Site-Scanner-NextJS/1.0.0'
        }
      });
    });

    it('should handle scanner service timeout errors', async () => {
      const timeoutError = {
        response: { status: 408, data: { detail: 'Request timeout' } }
      };

      mockAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(timeoutError),
        get: jest.fn().mockResolvedValue({ data: { status: 'healthy' } }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      await expect(client.scanWebsite({ url: 'https://example.com' }))
        .rejects.toThrow('Scanner service timeout - the target website took too long to load');
    });

    it('should handle invalid URL errors', async () => {
      const badRequestError = {
        response: { status: 400, data: { detail: 'Invalid URL format' } }
      };

      mockAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(badRequestError),
        get: jest.fn().mockResolvedValue({ data: { status: 'healthy' } }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      await expect(client.scanWebsite({ url: 'invalid-url' }))
        .rejects.toThrow('Invalid URL: URL format is invalid');
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: { status: 500, data: { detail: 'Internal server error' } }
      };

      mockAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(serverError),
        get: jest.fn().mockResolvedValue({ data: { status: 'healthy' } }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      await expect(client.scanWebsite({ url: 'https://example.com' }))
        .rejects.toThrow('Scanner service error: Internal server error');
    });

    it('should handle connection refused errors', async () => {
      const connectionError = {
        code: 'ECONNREFUSED'
      };

      mockAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(connectionError),
        get: jest.fn().mockResolvedValue({ data: { status: 'healthy' } }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      await expect(client.scanWebsite({ url: 'https://example.com' }))
        .rejects.toThrow('Scanner service is not available - please check if the service is running');
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      const mockResponse = {
        status: 200,
        data: { status: 'healthy', service: 'scanner', version: '1.0.0' }
      };

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        post: jest.fn().mockResolvedValue({ data: {} }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when service is unhealthy', async () => {
      mockAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        post: jest.fn().mockResolvedValue({ data: {} }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('getScanResult', () => {
    it('should retrieve scan result successfully', async () => {
      const mockResponse = {
        data: {
          scan_id: 'test-scan-123',
          target_url: 'https://example.com'
        }
      };

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        post: jest.fn().mockResolvedValue({ data: {} }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await client.getScanResult('test-scan-123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when scan result not found', async () => {
      const notFoundError = {
        response: { status: 404 }
      };

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(notFoundError),
        post: jest.fn().mockResolvedValue({ data: {} }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      await expect(client.getScanResult('non-existent-scan'))
        .rejects.toThrow('Scan result not found');
    });
  });
});
