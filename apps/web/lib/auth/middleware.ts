import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export async function requireAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return await handler(authenticatedRequest, user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 401 });
  }
}

export async function requireAdmin(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req, user) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return handler(req, user);
  });
}

export function withAuth(
  handler: (request: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return (request: NextRequest) => requireAuth(request, handler);
}

export function withAdmin(
  handler: (request: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return (request: NextRequest) => requireAdmin(request, handler);
}
