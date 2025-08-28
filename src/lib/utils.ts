import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import {redis} from '@/lib/redis';
import {v4 as uuidv4} from 'uuid';
import {Resend} from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const AISENSY_API_KEY = process.env.AISENSY_API_KEY;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const addLogEntry = async (
  userEmail: string,
  actionDescription: string
) => {
  let logs: any = (await redis.get('logs')) || [];
  if (typeof logs === 'string') logs = JSON.parse(logs);

  const timestamp = new Date().toISOString();
  const newEntry = `[${timestamp}] (${userEmail}) ${actionDescription}`;

  logs.unshift(newEntry);
  if (logs.length > 100) {
    logs = logs.slice(0, 100);
  }
  await redis.set('logs', JSON.stringify(logs));
};

export const addCommunicationHistory = async (
  entryType: string,
  recipient: string,
  content: string
) => {
  let history: any = (await redis.get('communication_history')) || [];
  if (typeof history === 'string') history = JSON.parse(history);

  const newEntry = {
    id: uuidv4(),
    type: entryType,
    recipient: recipient,
    content: content,
    timestamp: new Date().toISOString(),
  };
  history.unshift(newEntry);
  await redis.set('communication_history', JSON.stringify(history));
};

export const sendWhatsAppMessage = async (
  recipientNumber: string,
  messageBody: string,
  campaignName: string
) => {
  if (!AISENSY_API_KEY || !campaignName) {
    console.error('AiSensy API key or campaign name is not configured.');
    return false;
  }

  const url = 'https://api.aisensy.com/v1/messages/campaign';
  const payload = {
    apiKey: AISENSY_API_KEY,
    campaignName: campaignName,
    destination: recipientNumber,
    userName: 'User',
    templateParams: [messageBody],
  };
  const headers = {'Content-Type': 'application/json'};

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(
      `WhatsApp message sent to ${recipientNumber} via AiSensy campaign '${campaignName}'.`
    );
    return true;
  } catch (e: any) {
    console.error(
      `Error sending WhatsApp to ${recipientNumber} via AiSensy: ${e.message}`
    );
    return false;
  }
};

export const sendSMSMessage = async (
  recipientNumber: string,
  messageBody: string
) => {
  // SMS functionality remains to be implemented with a service like BulkSMS
  // For now, this is a placeholder.
  console.log(
    `SMS not yet implemented, but would send to ${recipientNumber}: ${messageBody}`
  );
  return true;
};

export const sendEmailMessage = async (
  recipientEmail: string,
  subject: string,
  htmlBody: string
) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key is not configured.');
    return false;
  }

  try {
    const {data} = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [recipientEmail],
      subject: subject,
      html: htmlBody,
    });
    console.log(`Email sent to ${recipientEmail}: ${(data as any).id}`);
    return true;
  } catch (e: any) {
    console.error(`Error sending email to ${recipientEmail}: ${e.message}`);
    return false;
  }
};

export const generateTextMessage = (
  template: string,
  resident: any,
  settings: any,
  subject: string
) => {
  const firstName = resident.name.split(' ')[0];
  const flatNumber = resident.flat_number;
  const ownerName = settings.owner_name || 'Admin';
  const ownerNumber = settings.owner_contact_number || '';
  let personalizedBody = template
    .replace(/{first_name}/g, firstName)
    .replace(/{flat_number}/g, flatNumber);
  const footer = `\n\nContact ${ownerName} at ${ownerNumber} to report an issue.`;

  if (subject) {
    return `Announcement: ${subject}\n${personalizedBody}${footer}`;
  } else {
    return `${personalizedBody}${footer}`;
  }
};

export const generateHtmlMessage = (
  template: string,
  resident: any,
  settings: any,
  subject: string
) => {
  const firstName = resident.name.split(' ')[0];
  const flatNumber = resident.flat_number;
  const ownerName = settings.owner_name || 'Admin';
  const ownerNumber = settings.owner_contact_number || '';
  const reportLink = settings.report_issue_link || '#';

  let personalizedBody = template
    .replace(/{first_name}/g, firstName)
    .replace(/{flat_number}/g, flatNumber)
    .replace(/\n/g, '<br>');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
            body {
                font-family: 'Poppins', sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                border: 1px solid #e8e8e8;
            }
            .header {
                background-color: #4A90E2; /* A nice blue */
                color: #ffffff;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px;
                line-height: 1.7;
                color: #555;
            }
            .content p {
                margin: 0 0 15px 0;
            }
            .button-container {
                text-align: center;
                margin-top: 25px;
            }
            .button {
                display: inline-block;
                padding: 12px 25px;
                background-color: #50C878; /* A friendly green */
                color: #ffffff;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
            }
            .footer {
                padding: 20px;
                font-size: 12px;
                color: #888;
                text-align: center;
                background-color: #f9f9f9;
                border-top: 1px solid #e8e8e8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${subject}</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                <p>${personalizedBody}</p>
                <div class="button-container">
                    <a href="${reportLink}" class="button">Report an Issue</a>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated message. For urgent enquiries, please contact ${ownerName} at ${ownerNumber}.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  return html;
};

export const generateOwnerIssueEmail = (issue: any, settings: any) => {
  const baseUrl = (
    settings.report_issue_link || 'http://localhost:9002'
  ).split('/report')[0];
  const issuesLink = `${baseUrl}/issues`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Maintenance Issue Reported</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
            body {
                font-family: 'Poppins', sans-serif;
                background-color: #f9fafb;
                color: #374151;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 560px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
            }
            .header {
                background-color: #FF5A5F;
                color: #ffffff;
                padding: 24px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 32px;
                color: #4b5563;
            }
            .content h2 {
                font-size: 20px;
                color: #111827;
                margin-top: 0;
                margin-bottom: 20px;
            }
            .content p {
                margin: 0 0 10px;
                line-height: 1.6;
            }
            .details-box {
                background-color: #f3f4f6;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
            }
            .details-box strong {
                color: #111827;
            }
            .button-container {
                text-align: center;
                margin-top: 30px;
                margin-bottom: 10px;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #3B82F6;
                color: #ffffff;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #2563EB;
            }
            .footer {
                padding: 24px;
                font-size: 13px;
                color: #9ca3af;
                text-align: center;
                background-color: #f9fafb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Issue Reported</h1>
            </div>
            <div class="content">
                <h2>A new maintenance issue has been submitted.</h2>
                <p>Here are the details:</p>
                <div class="details-box">
                    <p><strong>Reported By:</strong> ${issue.reported_by}</p>
                    <p><strong>Flat Number:</strong> ${issue.flat_number}</p>
                    <p><strong>Description:</strong></p>
                    <p>${issue.description}</p>
                </div>
                <div class="button-container">
                    <a href="${issuesLink}" class="button">View All Issues</a>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated notification from your Bin Reminder App.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  return html;
};
