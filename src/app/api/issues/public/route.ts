import {NextResponse} from 'next/server';
import {redis} from '@/lib/redis';

export async function GET() {
  const issues = (await redis.get('issues')) || [];
  return NextResponse.json(issues);
}
