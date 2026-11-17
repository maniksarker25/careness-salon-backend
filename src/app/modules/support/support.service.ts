import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../error/appError';
import sendEmail from '../../utilities/sendEmail';

export type TSupportMessage = {
  name: string;
  email: string;
  phone?: string;
  userType?: 'customer' | 'salon' | 'other';
  message: string;
};

const USER_TYPE_LABEL: Record<string, string> = {
  customer: 'Customer',
  salon: 'Salon owner',
  other: 'Other',
};

// Everything in the email comes from an anonymous form, so escape it.
const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const row = (label: string, value?: string) =>
  `<tr>
    <td style="padding:8px 12px;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
    <td style="padding:8px 12px;color:#0f172a;font-size:14px">${value ? escapeHtml(value) : '<span style="color:#94a3b8">Not provided</span>'}</td>
  </tr>`;

const supportEmailBody = (payload: TSupportMessage, receivedAt: Date) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>New support request</title></head>
<body style="margin:0;padding:24px;background:#f5f7f9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
    <tr><td style="padding:20px 24px;background:#016A70;border-radius:12px 12px 0 0;color:#ffffff;font-size:18px;font-weight:bold">
      New support request
    </td></tr>
    <tr><td style="padding:16px 12px 0">
      <table role="presentation" width="100%">
        ${row('Name', payload.name)}
        ${row('Email', payload.email)}
        ${row('Phone', payload.phone)}
        ${row('User type', payload.userType ? USER_TYPE_LABEL[payload.userType] : undefined)}
        ${row('Received', receivedAt.toUTCString())}
      </table>
    </td></tr>
    <tr><td style="padding:8px 24px 24px">
      <p style="margin:12px 0 6px;color:#64748b;font-size:13px">Message</p>
      <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(payload.message)}</div>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">Reply to this email to answer ${escapeHtml(payload.name)} directly.</p>
    </td></tr>
  </table>
</body></html>`;

const contactSupport = async (payload: TSupportMessage) => {
  const to = config.support_email;
  if (!to) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Support is not configured. Please try again later.',
    );
  }

  const subjectName = payload.name.replace(/[\r\n]+/g, ' ').slice(0, 80);
  try {
    await sendEmail({
      email: to,
      subject: `Support request from ${subjectName}`,
      html: supportEmailBody(payload, new Date()),
      replyTo: payload.email,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Support email failed:', error);
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'We could not send your message right now. Please try again later.',
    );
  }

  return { received: true };
};

export const SupportService = { contactSupport };
