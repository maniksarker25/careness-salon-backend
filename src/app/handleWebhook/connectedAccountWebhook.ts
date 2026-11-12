/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import config from '../config';
import { Request, Response } from 'express';
import stripeServices from '../modules/stripe/stripe.services';
import Client from '../modules/client/client.model';
import NotificationService from '../modules/notification/notification.services';
import {
  ENUM_NOTIFICATION_TYPE,
  NOTIFICATION_ENTITY,
} from '../modules/notification/notification.enum';
import { USER_ROLE } from '../modules/user/user.constant';
import { processStripeWebhookEvent } from '../modules/stripe/stripeWebhookEvent.service';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const handleConnectedAccountWebhook = async (req: Request, res: Response) => {
  const endpointSecret = config.stripe.connected_account_webhook_secret;
  const sig = req.headers['stripe-signature'];

  try {
    // Verify the event
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret as string,
    );

    await processStripeWebhookEvent(event, 'connected', async () => {
      switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const result =
          await stripeServices.updateClientStripeConnectionStatus(account.id);
        if (!result.success) {
          throw new Error(result.message);
        }
        break;
      }
      case 'payout.failed': {
        const accountId = event.account;
        if (!accountId) {
          throw new Error('Connected account ID is missing from payout event');
        }
        const shop = await Client.findOne({ stripAccountId: accountId }).select(
          '_id',
        );
        if (!shop) {
          console.error(
            `No salon found for failed payout on Stripe account ${accountId}`,
          );
          break;
        }

        const payout = event.data.object as Stripe.Payout;
        const receivers = [shop._id.toString(), USER_ROLE.admin];
        for (const receiver of receivers) {
          await NotificationService.sendNotification({
            receiver,
            title: 'Salon bank payout failed',
            message:
              'A scheduled Stripe payout to the salon bank account failed. Please review the connected Stripe account.',
            type: ENUM_NOTIFICATION_TYPE.PAYOUT_FAILED,
            entity: NOTIFICATION_ENTITY.PAYMENT,
            entityId: shop._id,
            dedupeKey: `stripe-payout-failed-${event.id}-${receiver}`,
            meta: { payoutId: payout.id },
          });
        }
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

export default handleConnectedAccountWebhook;
