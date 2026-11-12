/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import config from '../config';
import { Request, Response } from 'express';
import stripeServices from '../modules/stripe/stripe.services';
import handlePaymentSuccess from './handlePaymentSuccess';
import { processStripeWebhookEvent } from '../modules/stripe/stripeWebhookEvent.service';
import BookingFinancialOperation from '../modules/booking/bookingFinancialOperation.model';
import BookingTransfer, {
  BOOKING_TRANSFER_STATUS,
} from '../modules/booking/bookingTransfer.model';
import Booking from '../modules/booking/booking.model';
import NotificationService from '../modules/notification/notification.services';
import {
  ENUM_NOTIFICATION_TYPE,
  NOTIFICATION_ENTITY,
} from '../modules/notification/notification.enum';
import { USER_ROLE } from '../modules/user/user.constant';
import { ENUM_BOOKING_STATUS } from '../utilities/enum';
import { Types } from 'mongoose';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);

const notifyBookingFinancialIssue = async ({
  bookingId,
  eventId,
  title,
  message,
  type,
  meta,
}: {
  bookingId: Types.ObjectId;
  eventId: string;
  title: string;
  message: string;
  type: string;
  meta: Record<string, string | number | undefined>;
}) => {
  const booking = await Booking.findById(bookingId).select('shopId');
  if (!booking) return;
  for (const receiver of [booking.shopId.toString(), USER_ROLE.admin]) {
    await NotificationService.sendNotification({
      receiver,
      title,
      message,
      type,
      entity: NOTIFICATION_ENTITY.PAYMENT,
      entityId: booking._id,
      bookingId: booking._id,
      dedupeKey: `stripe-event-${eventId}-${receiver}`,
      meta,
    });
  }
};

const handleWebhook = async (req: Request, res: Response) => {
  const endpointSecret = config.stripe.webhook_endpoint_secret as string;
  const sig = req.headers['stripe-signature'];

  try {
    // Verify the event
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret,
    );

    await processStripeWebhookEvent(event, 'platform', async () => {
      switch (event.type) {
      //   case 'payment_intent.succeeded': {
      //     const paymentIntent = event.data.object as Stripe.PaymentIntent;
      //     console.log(paymentIntent.metadata);
      //     const { userId, paymentPurpose } = paymentIntent.metadata;

      //     console.log(
      //       `Payment successful for user ${userId}, subscription ${userId}`,
      //     );
      //     // await handlePaymentSuccess(userId, paymentPurpose);
      //     // Update subscription status in your database

      //     break;
      //   }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== 'paid') {
          break;
        }

        const paymentIntentId = session.payment_intent;
        if (!paymentIntentId || typeof paymentIntentId !== 'string') {
          throw new Error('Missing payment intent on checkout session');
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId,
        );

        await handlePaymentSuccess(
          session.metadata,
          paymentIntent.id,
          paymentIntent.amount / 100,
        );

        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId || session.payment_status === 'paid') {
          break;
        }
        await Booking.deleteOne({
          _id: bookingId,
          status: ENUM_BOOKING_STATUS.PENDING,
        });
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const result =
          await stripeServices.updateClientStripeConnectionStatus(account.id);
        if (!result.success) {
          throw new Error(result.message);
        }
        break;
      }
      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.funds_withdrawn':
      case 'charge.dispute.funds_reinstated':
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId =
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent?.id;
        if (!paymentIntentId) break;

        const disputeStatus =
          event.type === 'charge.dispute.funds_reinstated' ||
          dispute.status === 'won' ||
          dispute.status === 'warning_closed'
            ? 'won'
            : dispute.status === 'lost'
              ? 'lost'
              : 'open';
        const operationUpdate = {
          disputeId: dispute.id,
          disputeStatus,
        };
        await BookingFinancialOperation.updateMany(
          { sourcePaymentIntentId: paymentIntentId },
          {
            $set: {
              ...operationUpdate,
              ...(disputeStatus === 'open'
                ? { status: 'needs_review' }
                : {}),
            },
            ...(disputeStatus === 'open'
              ? { $unset: { processingStartedAt: 1 } }
              : {}),
          },
        );
        const [transferRecords, operationRecords] = await Promise.all([
          BookingTransfer.find({
            sourcePaymentIntentId: paymentIntentId,
          }).select('bookingId'),
          BookingFinancialOperation.find({
            sourcePaymentIntentId: paymentIntentId,
          }).select('bookingId'),
        ]);
        await BookingTransfer.updateMany(
          { sourcePaymentIntentId: paymentIntentId },
          { $set: operationUpdate },
        );
        const notifiedBookings = new Set<string>();
        for (const record of [...transferRecords, ...operationRecords]) {
          const bookingId = record.bookingId.toString();
          if (notifiedBookings.has(bookingId)) continue;
          notifiedBookings.add(bookingId);
          await notifyBookingFinancialIssue({
            bookingId: record.bookingId,
            eventId: event.id,
            title:
              disputeStatus !== 'open'
                ? 'Stripe dispute closed'
                : 'Stripe dispute requires attention',
            message:
              disputeStatus !== 'open'
                ? `A payment dispute was closed with status: ${disputeStatus}.`
                : 'A dispute was opened or its funds status changed for this booking payment.',
            type: ENUM_NOTIFICATION_TYPE.DISPUTE_OPENED,
            meta: { disputeId: dispute.id, disputeStatus },
          });
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!paymentIntentId) break;

        const operations = await BookingFinancialOperation.find({
          sourcePaymentIntentId: paymentIntentId,
        }).select(
          '_id bookingId refundAmountInCents status',
        );
        const refunds = await stripe.refunds.list({
          payment_intent: paymentIntentId,
          limit: 100,
        });
        for (const operation of operations) {
          const matchingRefund = refunds.data.find(
            (refund) =>
              refund.metadata?.bookingFinancialOperationId ===
              operation._id.toString(),
          );
          if (
            matchingRefund &&
            matchingRefund.amount === operation.refundAmountInCents
          ) {
            await BookingFinancialOperation.updateOne(
              { _id: operation._id },
              {
                $set: {
                  stripeRefundId: matchingRefund.id,
                  refundStatus:
                    matchingRefund.status === 'succeeded'
                      ? 'succeeded'
                      : 'pending',
                },
              },
            );
            continue;
          }
          await BookingFinancialOperation.updateOne(
            { _id: operation._id },
            {
              $set: {
                status: 'needs_review',
                lastError:
                  'A Stripe refund was reported without a matching recorded refund; reconcile the booking payment.',
              },
            },
          );
          await notifyBookingFinancialIssue({
            bookingId: operation.bookingId,
            eventId: event.id,
            title: 'Booking payment refund changed',
            message:
              'Stripe reported a refund for this booking payment. Please reconcile its refund and salon transfer status.',
            type: ENUM_NOTIFICATION_TYPE.REFUND_FAILED,
            meta: { paymentIntentId },
          });
        }
        break;
      }
      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer;
        const bookingTransfer = await BookingTransfer.findOne({
          stripeTransferId: transfer.id,
        });
        if (bookingTransfer) {
          await BookingTransfer.findByIdAndUpdate(bookingTransfer._id, {
            $set: {
              status: transfer.reversed
                ? BOOKING_TRANSFER_STATUS.REVERSED
                : BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED,
              reversedAmountInCents: transfer.amount_reversed,
              lastError: 'A related Stripe salon transfer was reversed.',
            },
            $unset: { processingStartedAt: 1 },
          });
          await BookingFinancialOperation.updateOne(
            { bookingId: bookingTransfer.bookingId },
            {
              $set: {
                status: 'needs_review',
                lastError: 'A related Stripe salon transfer was reversed.',
              },
              $unset: { processingStartedAt: 1 },
            },
          );
          await notifyBookingFinancialIssue({
            bookingId: bookingTransfer.bookingId,
            eventId: event.id,
            title: 'Salon transfer reversed',
            message:
              'A Stripe transfer for this booking was reversed. Please review the booking payment.',
            type: ENUM_NOTIFICATION_TYPE.TRANSFER_REVERSED,
            meta: {
              stripeTransferId: transfer.id,
              reversedAmountInCents: transfer.amount_reversed,
            },
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log(
          `Payment failed for intent ${paymentIntent.id}`,
        );

        // Notify the user about the failure
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
      }
    });

    res.status(200).send('Success');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export default handleWebhook;
