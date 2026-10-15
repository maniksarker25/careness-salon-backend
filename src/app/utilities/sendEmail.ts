/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import config from '../config';

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!config.resend.api_key) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
  if (!resendClient) {
    resendClient = new Resend(config.resend.api_key);
  }
  return resendClient;
};

const sendEmail = async (options: {
  email: string;
  subject: string;
  html: any;
  attachments?: any[];
}) => {
  const { email, subject, html } = options;

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
  const defaultAttachments: any[] = [];

  // Automatically attach Carenes logo with CID when template references cid:carenes-logo
  if (
    typeof html === 'string' &&
    html.includes('cid:carenes-logo') &&
    fs.existsSync(logoPath)
  ) {
    defaultAttachments.push({
      filename: 'carenes-logo.png',
      content: fs.readFileSync(logoPath),
      contentId: 'carenes-logo',
    });
  }

  const allAttachments = [
    ...defaultAttachments,
    ...(options.attachments || []),
  ];

  const senderName = config.resend.name || 'Carenes';
  const fromEmail = config.resend.from_email;

  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not set in environment variables');
  }

  const client = getResendClient();

  const { data, error } = await client.emails.send({
    from: `${senderName} <${fromEmail}>`,
    to: email,
    subject,
    html,
    ...(allAttachments.length > 0 && { attachments: allAttachments }),
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }

  return data;
};

export default sendEmail;
