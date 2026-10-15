import cron from 'node-cron';
import { Device } from './device.model';
export const upsertDevice = async (
  userId: string,
  playerId: string,
  platform?: string,
) => {
  if (!playerId) return;

  return await Device.findOneAndUpdate(
    { userId, playerId },
    {
      userId,
      playerId,
      platform,
      isActive: true,
      lastActiveAt: new Date(),
    },
    { upsert: true, new: true },
  );
};

export const deactivateDevice = async (userId: string, playerId: string) => {
  if (!playerId) return;

  await Device.findOneAndUpdate({ userId, playerId }, { isActive: false });
};

cron.schedule('0 2 * * 0', async () => {
  try {
    console.log('Device cleanup cron started');

    const result = await Device.deleteMany({
      isActive: false,
      lastActiveAt: {
        $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`Device cleanup done. Deleted: ${result.deletedCount}`);
  } catch (error) {
    console.error('Device cleanup cron failed:', error);
  }
});
