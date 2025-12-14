/**
 * Unit tests for JWT Authentication Middleware
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { validateJWT, optionalJWT, requireAdmin, generateJWT } from '../../middleware/auth';

jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  const mockJWT = jwt as jest.Mocked<typeof jwt>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('validateJWT', () => {
    const mockHandler = jest.fn();

    it('should call handler when valid token provided', async () => {
      const mockToken = 'valid-jwt-token';
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        iat: 1234567890,
        exp: 1234567890
      };

      mockJWT.verify.mockReturnValue(mockDecoded as any);

      const wrappedHandler = validateJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {};

      await wrappedHandler(req, res);

      expect(mockJWT.verify).toHaveBeenCalledWith(mockToken, 'test-secret-key');
      expect(req.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      });
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should return 401 when no authorization header', async () => {
      const wrappedHandler = validateJWT(mockHandler);
      
      const req: any = {
        headers: {}
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No valid authorization token provided' });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header missing Bearer token', async () => {
      const wrappedHandler = validateJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: 'Invalid-token-format'
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No valid authorization token provided' });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT_SECRET not configured', async () => {
      delete process.env.JWT_SECRET;
      
      const wrappedHandler = validateJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication configuration error' });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when token expired', async () => {
      const mockToken = 'expired-jwt-token';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      
      mockJWT.verify.mockImplementation(() => {
        throw expiredError;
      });

      const wrappedHandler = validateJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token has expired' });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when token format invalid', async () => {
      const mockToken = 'invalid-jwt-token';
      const invalidError = new Error('Invalid token format');
      invalidError.name = 'JsonWebTokenError';
      
      mockJWT.verify.mockImplementation(() => {
        throw invalidError;
      });

      const wrappedHandler = validateJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('optionalJWT', () => {
    const mockHandler = jest.fn();

    it('should call handler with user data when valid token provided', async () => {
      const mockToken = 'valid-jwt-token';
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };

      mockJWT.verify.mockReturnValue(mockDecoded as any);

      const wrappedHandler = optionalJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {};

      await wrappedHandler(req, res);

      expect(req.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      });
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should call handler without user data when no token provided', async () => {
      const wrappedHandler = optionalJWT(mockHandler);
      
      const req: any = {
        headers: {}
      };
      const res: any = {};

      await wrappedHandler(req, res);

      expect(req.user).toBeUndefined();
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should call handler without user data when JWT_SECRET not configured', async () => {
      delete process.env.JWT_SECRET;
      
      const wrappedHandler = optionalJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      const res: any = {};

      await wrappedHandler(req, res);

      expect(req.user).toBeUndefined();
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should call handler without user data when invalid token provided', async () => {
      const mockToken = 'invalid-jwt-token';
      const invalidError = new Error('Invalid token');
      
      mockJWT.verify.mockImplementation(() => {
        throw invalidError;
      });

      const wrappedHandler = optionalJWT(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {};

      await wrappedHandler(req, res);

      expect(req.user).toBeUndefined();
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });
  });

  describe('requireAdmin', () => {
    const mockHandler = jest.fn();

    it('should call handler when user is admin', async () => {
      const mockToken = 'admin-jwt-token';
      const mockDecoded = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      };

      mockJWT.verify.mockReturnValue(mockDecoded as any);

      const wrappedHandler = requireAdmin(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {};

      await wrappedHandler(req, res);

      expect(req.user).toEqual({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      });
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should return 403 when user is not admin', async () => {
      const mockToken = 'user-jwt-token';
      const mockDecoded = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user'
      };

      mockJWT.verify.mockReturnValue(mockDecoded as any);

      const wrappedHandler = requireAdmin(mockHandler);
      
      const req: any = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when no authentication', async () => {
      const wrappedHandler = requireAdmin(mockHandler);
      
      const req: any = {
        headers: {}
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('generateJWT', () => {
    it('should generate valid JWT token', () => {
      const mockToken = 'generated-jwt-token';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };

      mockJWT.sign.mockReturnValue(mockToken);

      const result = generateJWT(mockUser);

      expect(mockJWT.sign).toHaveBeenCalledWith(
        {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        },
        'test-secret-key',
        {
          expiresIn: '24h',
          issuer: 'site-scanner-api',
          audience: 'site-scanner-client'
        }
      );
      expect(result).toBe(mockToken);
    });

    it('should throw error when JWT_SECRET not configured', () => {
      delete process.env.JWT_SECRET;
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };

      expect(() => generateJWT(mockUser)).toThrow('JWT_SECRET not configured in environment');
    });
  });
});
