import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired} from '@/lib/auth';

async function getCommunicationHistoryHandler(req: NextRequest) {
  const history = (await redis.get('communication_history')) || [];
  return NextResponse.json(history);
}

export const GET = roleRequired(
  ['superuser', 'editor'],
  getCommunicationHistoryHandler
);
