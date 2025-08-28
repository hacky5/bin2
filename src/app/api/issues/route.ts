'use server';

import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {v4 as uuidv4} from 'uuid';
import {roleRequired} from '@/lib/auth';
import {
  addLogEntry,
  addCommunicationHistory,
  sendWhatsAppMessage,
  sendSMSMessage,
  sendEmailMessage,
  generateOwnerIssueEmail,
} from '@/lib/utils';
import {
  AISENSY_ANNOUNCEMENT_TEMPLATE,
} from '@/lib/constants';

// GET all issues (protected)
async function getIssuesHandler(req: NextRequest) {
  const issues = (await redis.get('issues')) || [];
  return NextResponse.json(issues);
}
export const GET = roleRequired(['superuser', 'editor'], getIssuesHandler);

// POST a new issue (public)
export async function POST(req: NextRequest) {
  try {
    const {name, flat_number, description} = await req.json();
    let issues: any[] = (await redis.get('issues')) || [];
     if (typeof issues === 'string') {
      issues = JSON.parse(issues);
    }

    const newIssue = {
      id: uuidv4(),
      reported_by: name,
      flat_number,
      description,
      status: 'Reported',
      timestamp: new Date().toISOString(),
    };

    issues.unshift(newIssue);
    await redis.set('issues', JSON.stringify(issues));

    const settings: any = (await redis.get('settings')) || {};
    const ownerWhatsapp = settings.owner_contact_whatsapp;
    const ownerSms = settings.owner_contact_number;
    const ownerEmail = settings.owner_contact_email;
    const ownerName = settings.owner_name || 'Owner';

    const baseUrl = (settings.report_issue_link || 'http://localhost:9002').split(
      '/report'
    )[0];
    const issuesLink = `${baseUrl}/issues`;

    const whatsappNotification = `New Issue Reported by ${
      newIssue.reported_by
    }, Flat ${
      newIssue.flat_number
    }: ${newIssue.description.substring(0, 80)}... See it here: ${issuesLink}`;
    const smsNotification = `New Issue Reported by ${newIssue.reported_by}, Flat ${newIssue.flat_number}. Description: ${newIssue.description}`;
    const htmlNotification = generateOwnerIssueEmail(newIssue, settings);

    if (ownerWhatsapp) {
      sendWhatsAppMessage(
        ownerWhatsapp,
        whatsappNotification,
        AISENSY_ANNOUNCEMENT_TEMPLATE
      );
      addCommunicationHistory(
        'New Issue (WhatsApp)',
        ownerName,
        whatsappNotification
      );
    }
    if (ownerSms) {
      sendSMSMessage(ownerSms, smsNotification);
      addCommunicationHistory('New Issue (SMS)', ownerName, smsNotification);
    }
    if (ownerEmail) {
      sendEmailMessage(
        ownerEmail,
        'New Maintenance Issue Reported',
        htmlNotification
      );
      addCommunicationHistory(
        'New Issue (Email)',
        ownerName,
        `Subject: New Maintenance Issue Reported\nBody: ${newIssue.description}`
      );
    }

    await addLogEntry(
      'Public',
      `Issue Reported by ${
        newIssue.reported_by
      }: ${newIssue.description.substring(0, 50)}...`
    );

    return NextResponse.json(
      {message: 'Issue reported successfully.'},
      {status: 201}
    );
  } catch (error) {
    console.error('Error reporting issue:', error);
    return NextResponse.json(
      {message: 'An internal server error occurred'},
      {status: 500}
    );
  }
}

// DELETE multiple issues
async function deleteIssuesHandler(req: NextRequest) {
  const {ids} = await req.json();
  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json(
      {message: 'No issue IDs provided'},
      {status: 400}
    );
  }
  let issues: any[] = (await redis.get('issues')) || [];
  if (typeof issues === 'string') {
      issues = JSON.parse(issues);
  }
  const initialLength = issues.length;
  issues = issues.filter(issue => !ids.includes(issue.id));

  if (issues.length === initialLength) {
    return NextResponse.json(
      {message: 'No matching issues found to delete'},
      {status: 404}
    );
  }

  await redis.set('issues', JSON.stringify(issues));
  await addLogEntry(
    (req as any).currentUser.email,
    `Deleted ${initialLength - issues.length} issue(s)`
  );
  return NextResponse.json({message: 'Issues deleted successfully'});
}

export const DELETE = roleRequired(['superuser', 'editor'], deleteIssuesHandler);
