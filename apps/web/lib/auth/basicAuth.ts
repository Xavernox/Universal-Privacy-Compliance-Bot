import { NextRequest, NextResponse } from 'next/server';

const ADMIN_BASIC_TOKEN = process.env.ADMIN_BASIC_TOKEN;

export function verifyBasicToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);

  if (!ADMIN_BASIC_TOKEN) {
    console.error('ADMIN_BASIC_TOKEN is not configured');
    return false;
  }

  return token === ADMIN_BASIC_TOKEN;
}

export async function requireBasicAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  if (!verifyBasicToken(request)) {
    return NextResponse.json(
      { error: 'Invalid or missing admin token' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    );
  }

  return await handler(request);
}

export function withBasicAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return (request: NextRequest) => requireBasicAuth(request, handler);
}
