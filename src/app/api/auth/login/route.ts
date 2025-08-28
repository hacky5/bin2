import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-super-secret-key-for-testing';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Could not verify' }, { status: 401 });
    }

    let admins: any[] = await redis.get('admins') || [];
    if (typeof admins === 'string') {
        admins = JSON.parse(admins);
    }
    
    const user = admins.find(admin => admin.email === email);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: '24h' });
    
    const response = NextResponse.json({
        user: { id: user.id, email: user.email, role: user.role } 
    });

    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
