/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import config from '../config';
import { Request, Response } from 'express';
import stripeServices from '../modules/stripe/stripe.services';
import handlePaymentSuccess from './handlePaymentSuccess';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
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

    // Handle different event types
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

        // Perform any post-payment actions, like updating your database
        // Example: Activate the collaboration or update the status

        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        try {
          await stripeServices.updateClientStripeConnectionStatus(account.id);
        } catch (err) {
          console.error(
            `Failed to update client status for Stripe account ID: ${account.id}`,
            err,
          );
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

    res.status(200).send('Success');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export default handleWebhook;
