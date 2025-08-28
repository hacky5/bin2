import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {getCurrentUser} from '@/lib/auth';
import {
  addLogEntry,
  sendWhatsAppMessage,
  sendSMSMessage,
  sendEmailMessage,
  generateTextMessage,
  generateHtmlMessage,
  addCommunicationHistory,
} from '@/lib/utils';
import {AISENSY_REMINDER_TEMPLATE} from '@/lib/constants';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  const userEmail = user ? user.email : 'System (Cron)';
  const remindersPaused = (await redis.get('reminders_paused')) || false;

  if (userEmail === 'System (Cron)' && remindersPaused) {
    await addLogEntry(
      'System',
      'Automatic reminder skipped because reminders are paused.'
    );
    return NextResponse.json({
      message: 'Reminders are paused, automatic reminder skipped.',
    });
  }

  let flats: any[] = (await redis.get('flats')) || [];
  if (typeof flats === 'string') {
    flats = JSON.parse(flats);
  }

  if (!flats.length) {
    return NextResponse.json(
      {message: 'No residents to remind.'},
      {status: 400}
    );
  }

  const personOnDuty = flats[0];
  const settings: any = (await redis.get('settings')) || {};
  const {message: customTemplate} = await req.json().catch(() => ({message: null}));
  const templateToUse =
    customTemplate ||
    settings.reminder_template ||
    "Reminder: It's your turn for bin duty.";

  const textMessage = generateTextMessage(templateToUse, personOnDuty, settings, '');
  const htmlMessage = generateHtmlMessage(
    templateToUse,
    personOnDuty,
    settings,
    'Bin Duty Reminder'
  );

  const contactInfo = personOnDuty.contact || {};
  if (contactInfo.whatsapp) {
    sendWhatsAppMessage(
      contactInfo.whatsapp,
      textMessage,
      AISENSY_REMINDER_TEMPLATE
    );
    addCommunicationHistory('Reminder (WhatsApp)', personOnDuty.name, textMessage);
  }
  if (contactInfo.sms) {
    sendSMSMessage(contactInfo.sms, textMessage);
    addCommunicationHistory('Reminder (SMS)', personOnDuty.name, textMessage);
  }
  if (contactInfo.email) {
    sendEmailMessage(contactInfo.email, 'Bin Duty Reminder', htmlMessage);
    addCommunicationHistory(
      'Reminder (Email)',
      personOnDuty.name,
      `Subject: Bin Duty Reminder\nBody: ${templateToUse}`
    );
  }

  await redis.set('last_reminder_date', new Date().toISOString().split('T')[0]);
  await addLogEntry(userEmail, `Reminder Sent to ${personOnDuty.name}`);

  // Advance turn
  if (flats.length > 1) {
    const rotatedFlats = [...flats.slice(1), flats[0]];
    await redis.set('flats', JSON.stringify(rotatedFlats));
  }

  return NextResponse.json({
    message: `Reminder sent to ${personOnDuty.name}.`,
  });
}
