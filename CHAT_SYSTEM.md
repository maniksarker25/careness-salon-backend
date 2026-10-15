# Chat System (Client/Shop owner <-> Customer)

Real-time 1-to-1 chat between a **Customer** and a **Client** (shop owner),
REST for history, Socket.IO for live events. Admins/super admins do not chat.

> This replaced the old chat (`sender/receiver/messages[]`, identity taken from
> `?id=` in the socket URL). The new design follows the `kevo-backend` chat.
> **The app (Flutter/web) must be updated - see section 6.**

## 1. Key rules

- **IDs are PROFILE ids**: `Customer._id` / `Client._id` (not `User._id`). The
  `receiver` you send to is the other side's profile id (for a shop, its
  `Client._id`, the same id used everywhere else in the shop APIs).
- **Identity comes from the JWT only.** The socket is rejected without a valid
  access token. The server never trusts a `sender` from the payload.
- A customer can only chat with a client and vice versa. Self-chat and
  customer<->customer are rejected.
- Exactly **one conversation per pair** (`participantKey`, unique index).

## 2. Data model

`conversations` ([conversation.model.ts](src/app/modules/conversation/conversation.model.ts))

| Field | Meaning |
|---|---|
| `participants` | `[profileId, profileId]` |
| `participantsModel` | `['Customer'\|'Client', ...]` same order |
| `participantKey` | both ids sorted and joined by `:` - **unique** (partial index, so legacy docs can coexist until migrated) |
| `lastMessage`, `lastMessageAt` | for the chat list; no message loading to sort/preview |

`messages` ([message.model.ts](src/app/modules/message/message.model.ts))

| Field | Meaning |
|---|---|
| `conversationId` | owning conversation |
| `msgByUserId` + `msgByUserModel` | sender profile |
| `receiverId` + `receiverModel` | receiver profile |
| `text`, `imageUrl[]`, `videoUrl[]`, `pdfUrl[]`, `seen` | content |

Indexes: `{conversationId, createdAt}`, `{conversationId, receiverId, seen}`,
`{receiverId, seen, createdAt}`. Messages are **not** stored in an array inside
the conversation (the old design hit Mongo's 16 MB document limit and loaded all
messages for every list/preview).

## 3. REST API (needs `Authorization: <accessToken>`, roles: client, customer)

### GET `/conversation/get-chat-list?page=1&limit=10`
Chat list, newest first. One aggregation, no per-row queries. Response
`data[]`:
```json
{
  "_id": "conversationId",
  "unseenMsg": 2,
  "lastMessage": { "text": "...", "msgByUserId": "...", "seen": false, "createdAt": "..." },
  "lastMessageAt": "...",
  "userData": { "_id": "otherProfileId", "user": "otherUserId", "name": "Shop or First Last", "email": "...", "profile_image": "..." }
}
```
`userData.name`/`profile_image` = shop name + first shop image for a Client,
"First Last" + profile image for a Customer. `meta` = `{page, limit, total, totalPage}`.

### GET `/message/get-messages/:conversationId?page=1&limit=20&searchTerm=`
Messages, **newest first**, paginated (limit max 100). Only a participant can
read; others get an empty result. Each item has `isMyMessage`.

## 4. Socket.IO

### Connect
```js
io(BASE_URL, { auth: { token: ACCESS_TOKEN } })
// also accepted: ?token=... or an Authorization header
```
Failure -> `connect_error` event (`"Authentication token is required"`,
`"Invalid or expired token"`, `"User is not allowed to connect"`).
Same account rules as the REST `auth` middleware (deleted/blocked/inactive user,
password changed after token issue).

### Client -> server

| Event | Payload | Notes |
|---|---|---|
| `send-message` | `{ receiver, text?, imageUrl?, videoUrl?, pdfUrl? }` + optional ack callback | `receiver` = other profile id. Needs text or at least one attachment. |
| `typing` | `{ receiver, isTyping }` | relayed to the receiver only (not stored); invalid/flooding events silently dropped; max 40 per 10 s |
| `seen` | `{ conversationId }` | marks all messages addressed to me in that conversation as seen |
| `totalUnseenConversation` | - | asks for the badge number |

Limits: text <= 5000 chars, <= 10 URLs per attachment type (<= 2048 chars each),
20 `send-message` per 10 s per socket (then error 429).

Ack for `send-message`: `{ success: true, data: message }` or
`{ success: false, message }`.

### Server -> client

| Event | Payload | To |
|---|---|---|
| `message:new` | the message | sender + receiver (all their devices) |
| `conversation:update` | `{ conversationId, lastMessage, unreadDelta, userData }` - `unreadDelta` 0 for sender, 1 for receiver; `userData` = the OTHER user | each side |
| `typing` | `{ from, isTyping }` (`from` = sender profile id) | the receiver |
| `conversation:seen` | `{ conversationId, unreadCount: 0 }` | the user who marked seen |
| `message:seen` | `{ conversationId, seenBy }` | the other user |
| `totalUnseenConversation` | `{ totalUnseenConversation: n }` (conversations with unseen messages) | on connect, after a new message (receiver), after `seen` |
| `onlineUser` | array of online user ids + profile ids | everyone, on connect/disconnect |
| `socket-error` | `{ code, message, type, details? }` | the failing socket |

Rooms joined on connect: `userId`, `profileId` (customer/client), and
`admin`/`superAdmin` for admin accounts (kept for notifications).
Online presence is reference-counted: a user with two devices stays online until
the last one disconnects.

## 5. Where the code is

| Part | File |
|---|---|
| Auth + connection + presence | [src/app/socket/socketManager.ts](src/app/socket/socketManager.ts) |
| Chat events (send/seen) | [src/app/socket/handleChat.ts](src/app/socket/handleChat.ts) |
| Error + helpers | [src/app/socket/helper.ts](src/app/socket/helper.ts) |
| Chat list API | [src/app/modules/conversation/](src/app/modules/conversation/) |
| Message history API | [src/app/modules/message/](src/app/modules/message/) |
| Old-data migration | [src/scripts/migrateChat.ts](src/scripts/migrateChat.ts) |

Removed: `helper/getConversation.ts`, `getSingleConversation.ts`,
`getTotalUnseenConversation.ts` and the socket events `message-page`,
`new-message`, `chat-list` (replaced by the REST APIs and `send-message`).

## 6. What the app must change

| Before | Now |
|---|---|
| connect with `?id=<userId>` | connect with `auth: { token }` |
| `new-message` with `sender`, `receiver`, `msgByUserId` | `send-message` with only `receiver` (profile id) |
| `chat-list` event | `GET /conversation/get-chat-list` (+ `conversation:update` live) |
| `message-page` event (all messages) | `GET /message/get-messages/:conversationId` (paginated, newest first) |
| `seen` with the other user's id | `seen` with `conversationId` |
| `message`, `conversation` events | `message:new`, `conversation:update`, `message:seen`, `conversation:seen` |
| `videoUrl` was a string | `videoUrl` is an array; `pdfUrl` added |
| user ids | profile ids (Customer._id / Client._id) |

## 7. Deploy / migration (old data)

1. **Back up the database.**
2. Dry run: `npx ts-node --transpile-only src/scripts/migrateChat.ts`
3. Apply: `npx ts-node --transpile-only src/scripts/migrateChat.ts --apply`
   - converts old conversations/messages (user ids -> profile ids, adds
     `conversationId`/`receiverId`, `videoUrl` string -> array), merges duplicate
     conversations of the same pair, sets `lastMessage`, builds indexes.
   - conversations that cannot be mapped to a customer/client pair are skipped
     and printed.
4. Deploy the new backend and the updated app together (old app versions cannot
   connect: no token).

The unique index is *partial* (`participantKey` must exist), so the server
starts fine even before the migration is run.

## 8. Not included / ideas

- Push notification for a message when the receiver is offline (a hook point is
  the end of `send-message` in `handleChat.ts`).
- Message delete/edit, block user, "last seen" time.
- Multiple server instances need the Socket.IO Redis adapter (`onlineUsers` and
  rooms are in-memory per process).
- `onlineUser` broadcasts the full list to everyone; fine for now, replace with
  per-contact presence if the user count grows large.
- Uploading chat files: use the existing `/file-upload` API and send the
  returned URLs in `imageUrl` / `videoUrl` / `pdfUrl`.
