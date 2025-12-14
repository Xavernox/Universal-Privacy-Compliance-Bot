import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Extend NextApiRequest to include user data
declare module 'next' {
  interface NextApiRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

// JWT Authentication middleware
export function validateJWT(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid authorization token provided' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Get JWT secret from environment
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET not configured in environment');
        return res.status(500).json({ error: 'Authentication configuration error' });
      }

      // Verify token
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      };

      // Add user data to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      // Call the original handler
      return handler(req, res);

    } catch (error: any) {
      console.error('JWT validation failed:', error.message);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token format' });
      } else {
        return res.status(401).json({ error: 'Authentication failed' });
      }
    }
  };
}

// Optional JWT validation (doesn't fail if no token provided)
export function optionalJWT(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;

        if (jwtSecret) {
          try {
            const decoded = jwt.verify(token, jwtSecret) as {
              id: string;
              email: string;
              role: string;
            };
            
            req.user = {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role
            };
          } catch (tokenError) {
            // Token is invalid, but we'll continue without user data
            console.warn('Invalid token provided:', tokenError);
          }
        }
      }

      return handler(req, res);

    } catch (error: any) {
      console.error('Optional JWT validation failed:', error.message);
      // Continue without user data
      return handler(req, res);
    }
  };
}

// Generate JWT token
export function generateJWT(user: { id: string; email: string; role: string }): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured in environment');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'site-scanner-api',
      audience: 'site-scanner-client'
    }
  );
}

// Admin role check middleware
export function requireAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return validateJWT(async (req: NextApiRequest, res: NextApiResponse) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    return handler(req, res);
  });
}
