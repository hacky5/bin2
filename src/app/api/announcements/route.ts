import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import {
  addLogEntry,
  addCommunicationHistory,
  sendWhatsAppMessage,
  sendSMSMessage,
  sendEmailMessage,
  generateTextMessage,
  generateHtmlMessage,
} from '@/lib/utils';
import {AISENSY_ANNOUNCEMENT_TEMPLATE} from '@/lib/constants';

async function createAnnouncementHandler(req: NextRequest) {
  const {subject, message, resident_ids} = await req.json();
  if (!subject || !message || !resident_ids || !Array.isArray(resident_ids)) {
    return NextResponse.json(
      {message: 'Subject, message, and resident_ids are required.'},
      {status: 400}
    );
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  let allFlats: any[] = (await redis.get('flats')) || [];
  if (typeof allFlats === 'string') {
    allFlats = JSON.parse(allFlats);
  }
  const settings: any = (await redis.get('settings')) || {};

  const recipients = allFlats.filter(flat => resident_ids.includes(flat.id));

  if (!recipients.length) {
    return NextResponse.json(
      {message: 'No valid recipients found for the provided IDs.'},
      {status: 400}
    );
  }

  const recipientNames: string[] = [];
  for (const resident of recipients) {
    recipientNames.push(resident.name);
    const textMessage = generateTextMessage(message, resident, settings, subject);
    const htmlMessage = generateHtmlMessage(message, resident, settings, subject);

    const contactInfo = resident.contact || {};
    if (contactInfo.whatsapp) {
      sendWhatsAppMessage(
        contactInfo.whatsapp,
        textMessage,
        AISENSY_ANNOUNCEMENT_TEMPLATE
      );
      addCommunicationHistory(
        'Announcement (WhatsApp)',
        resident.name,
        textMessage
      );
    }
    if (contactInfo.sms) {
      sendSMSMessage(contactInfo.sms, textMessage);
      addCommunicationHistory('Announcement (SMS)', resident.name, textMessage);
    }
    if (contactInfo.email) {
      sendEmailMessage(contactInfo.email, subject, htmlMessage);
      addCommunicationHistory(
        'Announcement (Email)',
        resident.name,
        `Subject: ${subject}\nBody: ${message}`
      );
    }
  }

  await addLogEntry(
    user.email,
    `Announcement sent to ${
      recipients.length
    } resident(s): ${recipientNames.join(', ')}`
  );
  return NextResponse.json({
    message: `Announcement sent successfully to ${recipients.length} resident(s).`,
  });
}

export const POST = roleRequired(
  ['superuser', 'editor'],
  createAnnouncementHandler
);
