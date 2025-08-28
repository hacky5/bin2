import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { redis } from '@/lib/redis';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-super-secret-key-for-testing';

export async function getCurrentUser(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    if (!token) {
        return null;
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET_KEY);
        const { payload } = await jose.jwtVerify(token, secret);
        
        let admins: any[] = await redis.get('admins') || [];
        if (typeof admins === 'string') {
            admins = JSON.parse(admins);
        }

        const currentUser = admins.find(admin => admin.id === payload.id);
        return currentUser || null;
    } catch (e) {
        return null;
    }
}

export function roleRequired(roles: string[]) {
    return async (req: NextRequest, handler: (req: NextRequest) => Promise<Response>) => {
        const user = await getCurrentUser(req);
        if (!user || !roles.includes(user.role)) {
            return new Response(JSON.stringify({ message: 'Permission denied!' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        return handler(req);
    };
}

