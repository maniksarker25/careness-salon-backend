import Stripe from 'stripe';
import config from '../config';
/* eslint-disable @typescript-eslint/no-explicit-any */
const stripe = new Stripe(config.stripe.stripe_secret_key as string);

export const getStripeAccountReadiness = async (accountId: string) => {
  if (!accountId) {
    return {
      ready: false,
      message: 'Stripe account is not connected',
    };
  }

  const account = await stripe.accounts.retrieve(accountId);
  const currentlyDue = account.requirements?.currently_due || [];
  const pastDue = account.requirements?.past_due || [];
  const disabledReason = account.requirements?.disabled_reason;
  const transfersActive = account.capabilities?.transfers === 'active';

  if (!account.details_submitted) {
    return {
      ready: false,
      message: 'Stripe onboarding is not completed',
    };
  }

  if (!transfersActive) {
    return {
      ready: false,
      message: 'Stripe transfer capability is not active',
    };
  }

  if (!account.payouts_enabled) {
    return {
      ready: false,
      message: 'Stripe payouts are not enabled yet',
    };
  }

  if (currentlyDue.length > 0 || pastDue.length > 0 || disabledReason) {
    return {
      ready: false,
      message: 'Stripe account requires more information',
    };
  }

  return {
    ready: true,
    message: 'Stripe account is ready',
  };
};

const isAccountReady = async (accountId: string): Promise<boolean> => {
  try {
    const readiness = await getStripeAccountReadiness(accountId);
    return readiness.ready;
  } catch (error: any) {
    console.error(`Failed to check account ${accountId}:`, error.message);
    return false;
  }
};

export default isAccountReady;
