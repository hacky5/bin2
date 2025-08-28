import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import {addLogEntry} from '@/lib/utils';

async function getSettingsHandler(req: NextRequest) {
  const settings = (await redis.get('settings')) || {};
  const remindersPaused = (await redis.get('reminders_paused')) || false;
  (settings as any).reminders_paused = remindersPaused;
  return NextResponse.json(settings);
}

export const GET = roleRequired(['superuser'], getSettingsHandler);

async function updateSettingsHandler(req: NextRequest) {
  const newSettings = await req.json();
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  let currentSettings: any = (await redis.get('settings')) || {};
  if (typeof currentSettings === 'string')
    currentSettings = JSON.parse(currentSettings);

  if ('reminders_paused' in newSettings) {
    await redis.set(
      'reminders_paused',
      JSON.stringify(newSettings.reminders_paused)
    );
    delete newSettings.reminders_paused;
  }

  const mergedSettings = {...currentSettings, ...newSettings};

  await redis.set('settings', JSON.stringify(mergedSettings));
  await addLogEntry(
    user.email,
    `Settings Updated: ${Object.keys(newSettings).join(', ')}`
  );
  return NextResponse.json(mergedSettings);
}

export const PUT = roleRequired(['superuser'], updateSettingsHandler);
