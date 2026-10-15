import httpStatus from 'http-status';
import Stripe from 'stripe'; // Import Stripe using ES module syntax
import config from '../../config';
import AppError from '../../error/appError';
import {
  ENUM_BOOKING_STATUS,
  ENUM_PAYMENT_PURPOSE,
} from '../../utilities/enum';
import Booking from '../booking/booking.model';
import Client from '../client/client.model';
import Transaction from '../transaction/transaction.model';
import { getStripeAccountReadiness } from '../../helper/isAccountReady';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const createConnectedAccountAndOnboardingLink = async (
  salonEmail: string,
  profileId: string,
) => {
  const client = await Client.findOne({ email: salonEmail, _id: profileId });

  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  if (client.isStripeConnected) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Stripe is already connected');
  }

  const accountId =
    client.stripAccountId ||
    (
      await stripe.accounts.create({
        type: 'express',
        email: salonEmail,
        country: 'DE',
        capabilities: {
          transfers: { requested: true },
        },
        tos_acceptance: {
          service_agreement: 'recipient',
        },
      })
    ).id;

  const updatedClientProfile = await Client.findByIdAndUpdate(
    profileId,
    { stripAccountId: accountId },
    { new: true, runValidators: true },
  );

  if (!updatedClientProfile) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Server temporarily unavailable',
    );
  }

  // Step 2: Create the onboarding link
  const onboardingLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${accountId}`,
    return_url: `${config.stripe.onboarding_return_url}`,
    type: 'account_onboarding',
  });
  return onboardingLink.url;
};

const updateClientStripeConnectionStatus = async (accountId: string) => {
  if (!accountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe account ID is required.',
    );
  }

  try {
    const readiness = await getStripeAccountReadiness(accountId);
    const updatedClient = await Client.findOneAndUpdate(
      { stripAccountId: accountId },
      { isStripeConnected: readiness.ready },
      { new: true, runValidators: true },
    );

    if (!updatedClient) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `No client found with Stripe account ID: ${accountId}`,
      );
    }

    return {
      success: true,
      statusCode: httpStatus.OK,
      message: readiness.message,
      data: updatedClient,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'An error occurred while updating the client status.',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  if (paymentIntent.metadata.purpose === ENUM_PAYMENT_PURPOSE.ADMIN_FEE) {
    await Client.findByIdAndUpdate(paymentIntent.metadata.shopId, {
      $inc: { payOnShopChargeDueAmount: -(paymentIntent.amount / 100) },
    });
    const transactionData = {
      senderEntityId: paymentIntent.metadata.shopId,
      senderEntityType: 'Client',
      amount: paymentIntent.amount,
      type: 'Shop Charge',
    };
    await Transaction.create(transactionData);
  } else {
    const bookingId = paymentIntent.metadata.bookingId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    booking.status = ENUM_BOOKING_STATUS.BOOKED;
    await booking.save();
    const transactionData = {
      senderEntityId: booking.customerId,
      receiverEntityId: booking.shopId,
      senderEntityType: 'Customer',
      receiverEntityType: 'Client',
      amount: booking.totalPrice,
      type: 'Booking',
    };
    await Transaction.create(transactionData);
  }
};

const updateOnboardingLink = async (profileId: string) => {
  const shop = await Client.findById(profileId);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const accountLink = await stripe.accountLinks.create({
    account: shop.stripAccountId as string,
    refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${shop.stripAccountId}`,
    return_url: config.stripe.onboarding_return_url,
    type: 'account_onboarding',
  });

  return { link: accountLink.url };
};

const stripeServices = {
  createConnectedAccountAndOnboardingLink,
  updateClientStripeConnectionStatus,
  handlePaymentSuccess,
  updateOnboardingLink,
};

export default stripeServices;
