import StripeWebhookEvent from './stripeWebhookEvent.model';

const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

export const processStripeWebhookEvent = async (
  event: { id: string; type: string },
  scope: 'platform' | 'connected',
  handler: () => Promise<void>,
) => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
  const eventKey = `${scope}:${event.id}`;
  let eventRecord;

  try {
    eventRecord = await StripeWebhookEvent.findOneAndUpdate(
      {
        eventId: eventKey,
        status: 'processing',
        $or: [
          { processingStartedAt: { $lte: staleBefore } },
          { lastError: { $exists: true } },
        ],
      },
      {
        $set: {
          eventType: event.type,
          processingStartedAt: now,
        },
        $unset: { lastError: 1 },
      },
      { new: true },
    );

    if (!eventRecord) {
      try {
        eventRecord = await StripeWebhookEvent.create({
          eventId: eventKey,
          eventType: event.type,
          status: 'processing',
          processingStartedAt: now,
        });
      } catch (error) {
        const duplicateKey =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 11000;
        if (!duplicateKey) throw error;

        const existingEvent = await StripeWebhookEvent.findOne({
          eventId: eventKey,
        });
        if (!existingEvent || existingEvent.status === 'processed') return;

        eventRecord = await StripeWebhookEvent.findOneAndUpdate(
          {
            _id: existingEvent._id,
            status: 'processing',
            $or: [
              { processingStartedAt: { $lte: staleBefore } },
              { lastError: { $exists: true } },
            ],
          },
          {
            $set: {
              eventType: event.type,
              processingStartedAt: now,
            },
            $unset: { lastError: 1 },
          },
          { new: true },
        );
        if (!eventRecord) {
          throw new Error('Stripe webhook event is already being processed');
        }
      }
    }

    await handler();
    await StripeWebhookEvent.updateOne(
      { _id: eventRecord._id, status: 'processing' },
      {
        $set: { status: 'processed', processedAt: new Date() },
        $unset: { lastError: 1 },
      },
    );
  } catch (error) {
    if (eventRecord) {
      await StripeWebhookEvent.updateOne(
        { _id: eventRecord._id, status: 'processing' },
        {
          $set: {
            lastError:
              error instanceof Error ? error.message : 'Webhook processing failed',
          },
        },
      );
    }
    throw error;
  }
};
