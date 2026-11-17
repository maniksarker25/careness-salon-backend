import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { SupportService } from './support.service';

const contactSupport = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, userType, message, website } = req.body;

  // Honeypot filled in: a bot. Pretend success so it doesn't retry.
  if (website) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Your message has been sent',
      data: { received: true },
    });
  }

  const result = await SupportService.contactSupport({
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || undefined,
    userType,
    message: message.trim(),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your message has been sent. We will get back to you soon.',
    data: result,
  });
});

const getTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.getTickets(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support requests retrieved successfully',
    data: result,
  });
});

const getTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.getTicket(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support request retrieved successfully',
    data: result,
  });
});

const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const { status, adminNote } = req.body;
  const result = await SupportService.updateTicket(req.params.id, {
    status,
    adminNote: typeof adminNote === 'string' ? adminNote.trim() : undefined,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support request updated successfully',
    data: result,
  });
});

const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.deleteTicket(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support request deleted successfully',
    data: result,
  });
});

export const SupportController = {
  contactSupport,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
