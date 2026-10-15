/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * One-off migration of the OLD chat data to the new chat format.
 *
 *   old conversation: { sender: User, receiver: User, messages: [Message] }
 *   old message:      { msgByUserId: User, videoUrl: string, seen, text, imageUrl }
 *
 *   new conversation: { participants: [profileId, profileId], participantsModel,
 *                       participantKey, lastMessage, lastMessageAt }
 *   new message:      { msgByUserId/receiverId: profileId (+ Model), conversationId,
 *                       videoUrl: string[], pdfUrl: string[] }
 *
 * Run it ONCE, before (or right after) deploying the new chat code:
 *
 *   npx ts-node --transpile-only src/scripts/migrateChat.ts           # dry run, writes nothing
 *   npx ts-node --transpile-only src/scripts/migrateChat.ts --apply   # really migrate
 *
 * It is safe to run again: already migrated conversations/messages are skipped.
 * Take a database backup before using --apply. See CHAT_SYSTEM.md.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import config from '../app/config';
import Conversation from '../app/modules/conversation/conversation.model';

const APPLY = process.argv.includes('--apply');

type Profile = { id: mongoose.Types.ObjectId; model: 'Customer' | 'Client' };

async function main() {
  await mongoose.connect(config.database_url as string);
  const db = mongoose.connection.db!;
  const users = db.collection('users');
  const customers = db.collection('customers');
  const clients = db.collection('clients');
  const conversations = db.collection('conversations');
  const messages = db.collection('messages');

  console.log(APPLY ? '*** APPLY MODE ***' : '*** DRY RUN (no writes) ***');

  // User id -> profile, cached
  const profileCache = new Map<string, Profile | null>();
  const resolveProfile = async (userId: any): Promise<Profile | null> => {
    const key = String(userId);
    if (profileCache.has(key)) return profileCache.get(key)!;
    let result: Profile | null = null;
    const user = await users.findOne({ _id: new mongoose.Types.ObjectId(key) });
    if (user?.role === 'customer') {
      const c = await customers.findOne({ user: user._id }, { projection: { _id: 1 } });
      if (c) result = { id: c._id as any, model: 'Customer' };
    } else if (user?.role === 'client') {
      const c = await clients.findOne({ user: user._id }, { projection: { _id: 1 } });
      if (c) result = { id: c._id as any, model: 'Client' };
    }
    profileCache.set(key, result);
    return result;
  };

  const legacy = await conversations
    .find({ participantKey: { $exists: false }, sender: { $exists: true } })
    .toArray();
  console.log(`Legacy conversations found: ${legacy.length}`);

  const stats = { migrated: 0, merged: 0, skipped: 0, messages: 0 };
  const touched = new Set<string>();

  for (const conv of legacy) {
    const a = await resolveProfile(conv.sender);
    const b = await resolveProfile(conv.receiver);
    // chat is only Customer <-> Client
    if (!a || !b || a.model === b.model) {
      console.warn(`SKIP conversation ${conv._id}: cannot map participants to a customer/client pair`);
      stats.skipped += 1;
      continue;
    }

    const participantKey = [a.id.toString(), b.id.toString()].sort().join(':');
    const existing = await conversations.findOne({ participantKey });
    const targetId = existing ? existing._id : conv._id;

    if (APPLY) {
      if (!existing) {
        await conversations.updateOne(
          { _id: conv._id },
          {
            $set: {
              participants: [a.id, b.id],
              participantsModel: [a.model, b.model],
              participantKey,
            },
            $unset: { sender: '', receiver: '', messages: '' },
          },
        );
      }
    }

    const messageIds: any[] = conv.messages || [];
    const oldMessages = messageIds.length
      ? await messages.find({ _id: { $in: messageIds } }).toArray()
      : [];

    const ops: any[] = [];
    for (const m of oldMessages) {
      if (m.conversationId) continue; // already migrated
      const senderIsA = String(m.msgByUserId) === String(conv.sender);
      const from = senderIsA ? a : b;
      const to = senderIsA ? b : a;
      ops.push({
        updateOne: {
          filter: { _id: m._id },
          update: {
            $set: {
              msgByUserId: from.id,
              msgByUserModel: from.model,
              receiverId: to.id,
              receiverModel: to.model,
              conversationId: targetId,
              videoUrl: Array.isArray(m.videoUrl)
                ? m.videoUrl
                : m.videoUrl
                  ? [m.videoUrl]
                  : [],
              pdfUrl: m.pdfUrl || [],
              imageUrl: m.imageUrl || [],
              seen: !!m.seen,
            },
          },
        },
      });
    }
    stats.messages += ops.length;
    touched.add(String(targetId));

    if (APPLY) {
      if (ops.length) await messages.bulkWrite(ops);
      if (existing) {
        // duplicate pair -> messages moved into the surviving conversation
        await conversations.deleteOne({ _id: conv._id });
        stats.merged += 1;
      } else {
        stats.migrated += 1;
      }
    } else if (existing) {
      stats.merged += 1;
    } else {
      stats.migrated += 1;
    }
  }

  // lastMessage / lastMessageAt for every touched conversation
  if (APPLY) {
    for (const id of touched) {
      const _id = new mongoose.Types.ObjectId(id);
      const last = await messages
        .find({ conversationId: _id })
        .sort({ createdAt: -1 })
        .limit(1)
        .next();
      if (last) {
        await conversations.updateOne(
          { _id },
          { $set: { lastMessage: last._id, lastMessageAt: last.createdAt } },
        );
      }
    }
    // create the new indexes (unique participantKey etc.)
    await Conversation.syncIndexes().catch(() => undefined);
  }

  console.log('Result:', stats);
  if (!APPLY) console.log('Dry run only. Re-run with --apply to migrate.');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
