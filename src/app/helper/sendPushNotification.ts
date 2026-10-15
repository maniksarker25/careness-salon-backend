import axios from 'axios';

import config from '../config';

interface INotificationPayload {
  playerIds: string[]; // List of OneSignal Player IDs to send notification to
  message: string; // The message body of the notification
  heading?: string; // The title/heading of the notification
  url?: string; // Optional URL to open when notification is clicked
  data?: object; // Optional additional data to send with the notification
  collapseId?: string; // Same id replaces the previous push instead of stacking
}

const sendNotification = async ({
  playerIds,
  message,
  heading = 'Notification', // Default heading
  url,
  data,
  collapseId,
}: INotificationPayload) => {
  console.log('Sending notification with payload:', playerIds);
  if (playerIds.length === 0) {
    console.error('No Player IDs provided.');
    return;
  }

  if (!config.onesignal.appId || !config.onesignal.apiKey) {
    console.error('OneSignal credentials are not configured.');
    return;
  }

  try {
    const payload = {
      app_id: config.onesignal.appId,
      include_subscription_ids: playerIds, // Send notification to these OneSignal subscription IDs
      target_channel: 'push',
      contents: { en: message },
      headings: { en: heading },
      url, // Optional URL to open on notification click
      data, // Optional data (e.g., order info)
      ...(collapseId ? { collapse_id: collapseId } : {}),
    };

    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${config.onesignal.apiKey}`,
        },
      },
    );

    console.log('Notification sent successfully:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending notification:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return;
    }

    console.error('Error sending notification:', error);
  }
};

export default sendNotification;
