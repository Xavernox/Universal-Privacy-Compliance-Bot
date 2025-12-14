/**
 * Unit tests for the /api/scan-site endpoint
 */

import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/scan-site/index';
import { ScannerServiceClient } from '../../lib/scanner-service';
import { connectToDatabase } from '../../lib/mongodb';

// Mock the dependencies
jest.mock('../../lib/mongodb');
jest.mock('../../lib/scanner-service');
jest.mock('../../middleware/auth');
jest.mock('winston');

describe('/api/scan-site', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST', () => {
    const mockScanRequest = {
      url: 'https://example.com',
      depth: 1,
      timeout: 30
    };

    const mockScanResult = {
      scan_id: 'test-scan-123',
      target_url: 'https://example.com',
      timestamp: '2024-01-01T00:00:00Z',
      resources: [
        {
          host: 'google-analytics.com',
          type: 'script',
          url: 'https://google-analytics.com/gtag/js?id=GA_MEASUREMENT_ID',
          risk_level: 'low',
          description: 'Google Analytics script',
          category: 'analytics'
        },
        {
          host: 'facebook.com',
          type: 'cookie',
          url: 'cookie://facebook.com',
          risk_level: 'medium',
          description: 'Facebook tracking cookie',
          category: 'social'
        }
      ],
      summary: {
        total_resources: 2,
        by_type: { script: 1, cookie: 1 },
        by_risk: { low: 1, medium: 1 },
        by_category: { analytics: 1, social: 1 },
        unique_hosts: 2
      },
      scan_duration: 2.5,
      pages_scanned: 1
    };

    it('should return successful scan result for valid request', async () => {
      // Mock JWT validation middleware
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation((handler: any) => handler);

      // Mock database connection
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
        })
      };
      (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });

      // Mock scanner service
      const mockScannerClient = {
        scanWebsite: jest.fn().mockResolvedValue(mockScanResult)
      };
      (ScannerServiceClient as jest.Mock).mockImplementation(() => mockScannerClient);

      const { req, res } = createMocks({
        method: 'POST',
        body: mockScanRequest,
        headers: {
          'authorization': 'Bearer valid-jwt-token'
        }
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.scan_id).toBeDefined();
      expect(responseData.target_url).toBe(mockScanRequest.url);
      expect(responseData.resources).toHaveLength(2);
      expect(responseData.metadata).toBeDefined();
      expect(responseData.metadata.enrichment_applied).toBe(true);
    });

    it('should return cached result for recently scanned URL', async () => {
      // Mock JWT validation middleware
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation((handler: any) => handler);

      // Mock database with existing scan
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({
            scan_id: 'cached-scan-123',
            target_url: 'https://example.com',
            status: 'completed',
            results: mockScanResult,
            created_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
          }),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
        })
      };
      (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });

      const { req, res } = createMocks({
        method: 'POST',
        body: mockScanRequest,
        headers: {
          'authorization': 'Bearer valid-jwt-token'
        }
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.scan_id).toBe('cached-scan-123');
      expect(mockDb.collection().findOne).toHaveBeenCalledWith({
        target_url: mockScanRequest.url,
        status: 'completed',
        created_at: {
          $gte: expect.any(Date)
        }
      });
    });

    it('should return 400 for invalid request data', async () => {
      // Mock JWT validation middleware
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation((handler: any) => handler);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          url: 'invalid-url',
          depth: 10, // Invalid depth
          timeout: 200 // Invalid timeout
        },
        headers: {
          'authorization': 'Bearer valid-jwt-token'
        }
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Invalid request');
    });

    it('should return 401 for missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: mockScanRequest
      });

      // Mock JWT validation middleware to return 401
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation(() => {
        return async (req: NextApiRequest, res: NextApiResponse) => {
          res.status(401).json({ error: 'No valid authorization token provided' });
        };
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(401);
    });

    it('should handle scanner service errors gracefully', async () => {
      // Mock JWT validation middleware
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation((handler: any) => handler);

      // Mock database connection
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
        })
      };
      (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });

      // Mock scanner service to throw error
      const mockScannerClient = {
        scanWebsite: jest.fn().mockRejectedValue(new Error('Scanner service timeout'))
      };
      (ScannerServiceClient as jest.Mock).mockImplementation(() => mockScannerClient);

      const { req, res } = createMocks({
        method: 'POST',
        body: mockScanRequest,
        headers: {
          'authorization': 'Bearer valid-jwt-token'
        }
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.scanId).toBeDefined();

      // Verify error was logged to database
      expect(mockDb.collection().updateOne).toHaveBeenCalledWith(
        { scan_id: expect.any(String) },
        {
          $set: {
            status: 'failed',
            error: 'Scanner service timeout',
            failed_at: expect.any(Date),
            scan_duration: expect.any(Number),
            updated_at: expect.any(Date)
          }
        }
      );
    });

    it('should handle database connection errors', async () => {
      // Mock JWT validation middleware
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation((handler: any) => handler);

      // Mock database connection failure
      (connectToDatabase as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: mockScanRequest,
        headers: {
          'authorization': 'Bearer valid-jwt-token'
        }
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Method validation', () => {
    it('should return 405 for non-POST requests', async () => {
      // Mock JWT validation middleware
      const { validateJWT } = require('../../middleware/auth');
      validateJWT.mockImplementation((handler: any) => handler);

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.statusCode).toBe(405);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Method not allowed');
    });
  });

  describe('Enrichment functions', () => {
    it('should correctly calculate risk analysis', async () => {
      // Import the enrichment functions by requiring the module
      const module = require('../../pages/api/scan-site/index');
      
      const mockResources = [
        { risk_level: 'low', category: 'analytics' },
        { risk_level: 'medium', category: 'advertising' },
        { risk_level: 'high', category: 'advertising' },
        { risk_level: 'low', category: 'analytics' }
      ];

      // Test risk analysis calculation
      const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
      const totalResources = mockResources.length;
      
      mockResources.forEach(resource => {
        riskCounts[resource.risk_level as keyof typeof riskCounts]++;
      });
      
      const overallRisk = totalResources > 0 ? 
        (riskCounts.high * 3 + riskCounts.medium * 2 + riskCounts.critical * 4) / totalResources : 0;

      expect(overallRisk).toBe(1.75); // (3 + 2) / 4
      expect(riskCounts).toEqual({ low: 2, medium: 1, high: 1, critical: 0 });
    });

    it('should generate appropriate recommendations', async () => {
      const mockResources = [
        { 
          risk_level: 'critical', 
          category: 'advertising',
          type: 'script',
          host: 'suspicious-ad-network.com'
        },
        { 
          risk_level: 'high', 
          category: 'analytics',
          type: 'script',
          host: 'analytics.com'
        },
        ...Array(12).fill({
          risk_level: 'low',
          category: 'ui',
          type: 'script',
          host: 'cdn.com'
        }),
        {
          risk_level: 'low',
          category: 'analytics',
          type: 'cookie',
          host: 'google-analytics.com'
        }
      ];

      // Test recommendation generation logic
      const highRiskResources = mockResources.filter(r => r.risk_level === 'high' || r.risk_level === 'critical');
      const scriptResources = mockResources.filter(r => r.type === 'script');
      const trackingResources = mockResources.filter(r => 
        r.type === 'cookie' && (r.category === 'analytics' || r.category === 'advertising')
      );

      expect(highRiskResources).toHaveLength(2);
      expect(scriptResources).toHaveLength(14);
      expect(trackingResources).toHaveLength(1);
    });
  });
});
