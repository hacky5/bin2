import {NextRequest, NextResponse} from 'next/server';
import * as jose from 'jose';
import {redis} from '@/lib/redis';

const JWT_SECRET_KEY =
  process.env.JWT_SECRET_KEY || 'default-super-secret-key-for-testing';

export async function getCurrentUser(req: NextRequest | NextResponse) {
  const token = (req as NextRequest).cookies.get('token')?.value;
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY);
    const {payload} = await jose.jwtVerify(token, secret);

    let admins: any[] = (await redis.get('admins')) || [];
    if (typeof admins === 'string') {
      admins = JSON.parse(admins);
    }

    const currentUser = admins.find(admin => admin.id === payload.id);
    return currentUser || null;
  } catch (e) {
    return null;
  }
}

type AuthenticatedHandler = (
  req: NextRequest,
  ...args: any[]
) => Promise<NextResponse>;

export function roleRequired(
  roles: string[],
  handler: AuthenticatedHandler
): (req: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (req: NextRequest, ...args: any[]) => {
    const user = await getCurrentUser(req);
    if (!user || (roles.length > 0 && !roles.includes(user.role))) {
      return new NextResponse(JSON.stringify({message: 'Permission denied!'}), {
        status: 403,
        headers: {'Content-Type': 'application/json'},
      });
    }
    (req as any).currentUser = user;
    return handler(req, ...args);
  };
}
