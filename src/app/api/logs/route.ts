import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import {addLogEntry} from '@/lib/utils';

async function getLogsHandler(req: NextRequest) {
  const logs = (await redis.get('logs')) || [];
  return NextResponse.json(logs);
}

export const GET = roleRequired(['superuser', 'editor'], getLogsHandler);

async function deleteLogsHandler(req: NextRequest) {
  const {logs: logsToDelete} = await req.json();
  if (!logsToDelete || !Array.isArray(logsToDelete)) {
    return NextResponse.json(
      {message: 'No logs provided to delete'},
      {status: 400}
    );
  }
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  let currentLogs: any[] = (await redis.get('logs')) || [];
  if (typeof currentLogs === 'string') {
    currentLogs = JSON.parse(currentLogs);
  }
  const initialLength = currentLogs.length;

  const logsToDeleteSet = new Set(logsToDelete);
  currentLogs = currentLogs.filter(log => !logsToDeleteSet.has(log));

  await redis.set('logs', JSON.stringify(currentLogs));
  await addLogEntry(
    user.email,
    `Deleted ${initialLength - currentLogs.length} log entries`
  );
  return NextResponse.json({message: 'Logs deleted successfully'});
}

export const DELETE = roleRequired(['superuser', 'editor'], deleteLogsHandler);
