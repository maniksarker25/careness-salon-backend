import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import QueryBuilder from '../../builder/QueryBuilder';
import Notification from '../notification/notification.model';
import { ENUM_NOTIFICATION_TYPE } from '../notification/notification.enum';
import { USER_ROLE } from '../user/user.constant';
import {
  SUPPORT_TICKET_STATUS,
  SupportTicket,
  TSupportTicketStatus,
} from './support.model';
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
  // Save first: the ticket is the source of truth in the admin dashboard,
  // so a message is never lost even if the email or notification fails.
  const ticket = await SupportTicket.create({ ...payload, status: 'pending' });

  const notify = Notification.create({
    receiver: USER_ROLE.admin,
    type: ENUM_NOTIFICATION_TYPE.GENERAL,
    title: 'New support request',
    message: `${payload.name} sent a support message.`,
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Support notification failed:', error);
  });

  const to = config.support_email;
  const subjectName = payload.name.replace(/[\r\n]+/g, ' ').slice(0, 80);
  const mail = to
    ? sendEmail({
        email: to,
        subject: `Support request from ${subjectName}`,
        html: supportEmailBody(payload, ticket.get('createdAt') ?? new Date()),
        replyTo: payload.email,
      })
        .then(() => SupportTicket.updateOne({ _id: ticket._id }, { emailDelivered: true }))
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Support email failed:', error);
        })
    : Promise.resolve();

  await Promise.all([notify, mail]);
  return { received: true, ticketId: ticket._id };
};

//! Admin
const getTickets = async (query: Record<string, unknown>) => {
  const { status, ...rest } = query;
  const filter: Record<string, unknown> = {};
  if (status !== undefined && status !== '') {
    if (!SUPPORT_TICKET_STATUS.includes(status as TSupportTicketStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid status. Use one of: ${SUPPORT_TICKET_STATUS.join(', ')}`,
      );
    }
    filter.status = status;
  }

  const ticketQuery = new QueryBuilder(SupportTicket.find(filter), rest)
    .search(['name', 'email', 'phone', 'message'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta, counts] = await Promise.all([
    ticketQuery.modelQuery,
    ticketQuery.countTotal(),
    SupportTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(
    SUPPORT_TICKET_STATUS.map((s) => [
      s,
      counts.find((c: { _id: string }) => c._id === s)?.count ?? 0,
    ]),
  );

  return { meta: { ...meta, statusCounts }, result };
};

const assertId = (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid ticket id');
  }
};

const getTicket = async (id: string) => {
  assertId(id);
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
  return ticket;
};

const updateTicket = async (
  id: string,
  payload: { status?: TSupportTicketStatus; adminNote?: string },
) => {
  assertId(id);
  const update: Record<string, unknown> = {};
  if (payload.adminNote !== undefined) update.adminNote = payload.adminNote;
  if (payload.status !== undefined) {
    update.status = payload.status;
    update.statusChangedAt = new Date();
    update.resolvedAt = payload.status === 'resolved' ? new Date() : null;
  }
  const ticket = await SupportTicket.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
  return ticket;
};

const deleteTicket = async (id: string) => {
  assertId(id);
  const ticket = await SupportTicket.findByIdAndDelete(id);
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
  return ticket;
};

export const SupportService = {
  contactSupport,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
