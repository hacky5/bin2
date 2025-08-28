import {NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import {addLogEntry} from '@/lib/utils';

async function getDashboardData(req: NextResponse) {
  try {
    const user = await getCurrentUser(req);

    const flats: any[] = (await redis.get('flats')) || [];
    const lastRunDate: string =
      (await redis.get('last_reminder_date')) || 'N/A';
    const remindersPaused: boolean =
      (await redis.get('reminders_paused')) || false;

    if (!flats.length) {
      return NextResponse.json({
        current_duty: {name: 'N/A'},
        next_in_rotation: {name: 'N/A'},
        system_status: {
          last_reminder_run: lastRunDate,
          reminders_paused: remindersPaused,
        },
      });
    }

    const currentPerson = flats[0];
    const nextPerson = flats.length > 1 ? flats[1] : {name: 'N/A'};

    const dashboardData = {
      current_duty: {name: currentPerson.name},
      next_in_rotation: {name: nextPerson.name},
      system_status: {
        last_reminder_run: lastRunDate,
        reminders_paused: remindersPaused,
      },
    };
    return NextResponse.json(dashboardData);
  } catch (e: any) {
    const user = await getCurrentUser(req);
    if (user) {
      await addLogEntry(user.email, `Error fetching dashboard: ${e.message}`);
    }
    return NextResponse.json({error: e.message}, {status: 500});
  }
}

export const GET = roleRequired([], getDashboardData);
