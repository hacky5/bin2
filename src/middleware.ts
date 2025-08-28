import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-super-secret-key-for-testing';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // These routes are public and don't require authentication
  if (pathname.startsWith('/api/auth/login') || pathname === '/api/issues/public' || (pathname === '/api/issues' && request.method === 'POST')) {
    return NextResponse.next();
  }
  
  // For all other API routes, check for a valid token
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Token is missing!' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET_KEY);
      await jose.jwtVerify(token, secret);
      // The token is valid, continue to the API route
      return NextResponse.next();
    } catch (err) {
      return new NextResponse(
        JSON.stringify({ message: 'Token is invalid!' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // For non-API routes, let them pass
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
}
