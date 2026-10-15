# Chat – Frontend Integration Guide

**Audience:** Flutter (mobile) and web developers integrating the Carenes chat.
**Backend reference:** [CHAT_SYSTEM.md](CHAT_SYSTEM.md) (architecture, data model, migration).

Chat is **1-to-1 between a Customer and a Shop owner (Client)**. History and
lists come from **REST**, live updates from **Socket.IO**.

---

## Table of contents

1. [What changed and what you must do](#1-what-changed-and-what-you-must-do)
2. [Core concepts (read first)](#2-core-concepts-read-first)
3. [Authentication](#3-authentication)
4. [REST API](#4-rest-api)
5. [Socket.IO](#5-socketio)
6. [Sending files / images](#6-sending-files--images)
7. [Screen-by-screen implementation plan](#7-screen-by-screen-implementation-plan)
8. [Client state rules](#8-client-state-rules)
9. [Error handling](#9-error-handling)
10. [Code examples](#10-code-examples)
11. [Migration checklist for existing app code](#11-migration-checklist-for-existing-app-code)
12. [QA test scenarios](#12-qa-test-scenarios)

---

## 1. What changed and what you must do

The old chat is **replaced**. Old app versions cannot connect any more (the
socket now requires a token).

| Area | Old | New |
|---|---|---|
| Socket connect | `?id=<userId>` | `auth: { token: <accessToken> }` |
| IDs | User id | **Profile id** (`Customer._id` / `Client._id`) |
| Send | `new-message` `{sender, receiver, msgByUserId, text...}` | `send-message` `{receiver, text...}` (+ ack) |
| Chat list | socket `chat-list` | REST `GET /conversation/get-chat-list` + live `conversation:update` |
| Open chat / history | socket `message-page` (all messages) | REST `GET /message/get-messages/:conversationId` (paginated) + live `message:new` |
| Mark read | `seen` with other user id | `seen` with `{ conversationId }` |
| Incoming events | `message`, `conversation` | `message:new`, `conversation:update`, `message:seen`, `conversation:seen` |
| `videoUrl` | string | **array of strings**; `pdfUrl` added |

**Deployment order:** backend + data migration first, then release the updated
apps. Coordinate the release with the backend team.

---

## 2. Core concepts (read first)

### 2.1 Profile ids, not user ids

Every chat id is a **profile id**:

| Logged-in role | Your profile id | The other side's profile id |
|---|---|---|
| `customer` | `Customer._id` | the shop's `Client._id` (the same `_id` returned by the shop APIs) |
| `client` | `Client._id` | the customer's `Customer._id` |

`receiver` in `send-message` is always **the other side's profile id**.
Never send a User id. Chat only works Customer ↔ Client.

### 2.2 One conversation per pair

A pair has exactly one conversation. The first `send-message` creates it. You
do **not** create conversations manually. To start a chat from a shop page,
the app only needs the shop's `Client._id`; the conversation id appears in the
ack / `conversation:update` after the first message.

### 2.3 Who am I? (`isMyMessage`)

- REST messages carry `isMyMessage`.
- Socket messages do **not**: compare `message.msgByUserId` with **your own
  profile id**. Store your profile id after login (it is also the `_id` in your
  profile API response).

### 2.4 Time

All timestamps are ISO-8601 UTC (`2026-03-29T10:15:00.000Z`). Convert to the
user's/salon's local time for display (salons run on `Europe/Berlin`, see
[TIMEZONE_HANDLING.md](TIMEZONE_HANDLING.md)).

### 2.5 Message ordering

REST history is **newest first**. Chat UIs usually render oldest at the top, so
reverse for display, or use a reversed list (`ListView(reverse: true)` in Flutter).

---

## 3. Authentication

Use the normal **access token** from login.

- REST: header `Authorization: <accessToken>` (a `Bearer <accessToken>` prefix is
  also accepted).
- Socket: pass the token in the handshake (see [5.1](#51-connect)).

Roles allowed: `customer`, `client`. Admins cannot use the chat APIs.

When the token expires: refresh it with the existing refresh-token flow, then
**disconnect and reconnect** the socket with the new token (the token is only
checked at connect time).

---

## 4. REST API

Base URL: the usual API base (e.g. `https://<host>/api/v1`). All responses use
the standard envelope:

```json
{ "success": true, "message": "…", "meta": { }, "data": [ ] }
```

Errors: `{ "success": false, "message": "…", "errorDetails": … }` with the HTTP
status (400 / 401 / 403 / 404 / 500).

### 4.1 Get chat list

`GET /conversation/get-chat-list`

| Query | Default | Max | Notes |
|---|---|---|---|
| `page` | 1 | – | |
| `limit` | 10 | 50 | |

Sorted by latest activity (newest first).

**Response `200`**

```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 3, "totalPage": 1 },
  "data": [
    {
      "_id": "66f1c0a2b8d3a4001e5a1111",
      "createdAt": "2026-03-01T09:00:00.000Z",
      "updatedAt": "2026-03-29T10:15:00.000Z",
      "lastMessageAt": "2026-03-29T10:15:00.000Z",
      "unseenMsg": 2,
      "lastMessage": {
        "_id": "66f1c0a2b8d3a4001e5a2222",
        "text": "See you at 10:00",
        "imageUrl": [],
        "videoUrl": [],
        "pdfUrl": [],
        "msgByUserId": "66f1b9…(other user's profile id)",
        "msgByUserModel": "Client",
        "receiverId": "66f1b8…(my profile id)",
        "receiverModel": "Customer",
        "seen": false,
        "createdAt": "2026-03-29T10:15:00.000Z"
      },
      "userData": {
        "_id": "66f1b9…",
        "user": "66f1a0…",
        "name": "Salon Berlin",
        "email": "shop@example.com",
        "profile_image": "uploads/images/shop_image/1711…-front.jpg"
      }
    }
  ]
}
```

Field notes:

| Field | Meaning |
|---|---|
| `_id` | **conversationId** – use it for history and `seen` |
| `userData` | the **other** person. Shop → shop name + first shop image; customer → "First Last" + profile image |
| `unseenMsg` | unread messages addressed to **me** in this conversation |
| `lastMessage` | `null` only for edge cases; show a preview from `text` / attachment type |
| `profile_image` | may be empty string → show a placeholder avatar. Prefix with the API origin if it is a relative path |

### 4.2 Get messages of a conversation

`GET /message/get-messages/:conversationId`

| Query | Default | Max | Notes |
|---|---|---|---|
| `page` | 1 | – | |
| `limit` | 20 | 100 | |
| `searchTerm` | – | – | case-insensitive text search (optional) |

**Response `200`** (newest first)

```json
{
  "success": true,
  "message": "Message retrieved successfully",
  "meta": { "page": 1, "limit": 20, "total": 57, "totalPage": 3 },
  "data": [
    {
      "_id": "66f1c0a2b8d3a4001e5a2222",
      "conversationId": "66f1c0a2b8d3a4001e5a1111",
      "text": "See you at 10:00",
      "imageUrl": [],
      "videoUrl": [],
      "pdfUrl": [],
      "msgByUserId": "66f1b9…",
      "msgByUserModel": "Client",
      "receiverId": "66f1b8…",
      "receiverModel": "Customer",
      "seen": false,
      "isMyMessage": false,
      "createdAt": "2026-03-29T10:15:00.000Z",
      "updatedAt": "2026-03-29T10:15:00.000Z"
    }
  ]
}
```

If the conversation does not exist or you are not a participant, you get
`200` with an empty `data` array and `meta.total = 0` (no information leak).

Pagination for "load older messages": request `page=2, 3, …` when the user
scrolls to the top; stop when `page >= meta.totalPage`.

> Messages that arrive live while the user is paging can shift pages. Always
> de-duplicate by `_id` when merging (see [8](#8-client-state-rules)).

---

## 5. Socket.IO

### 5.1 Connect

Connect **once after login** and keep one connection for the whole session
(not one per chat screen). Disconnect on logout.

```js
const socket = io(SOCKET_URL, {
  auth: { token: accessToken },      // preferred
  // alternatives also accepted: query: { token }, or an Authorization header
  transports: ['websocket'],
});
```

`SOCKET_URL` is the backend origin (same host/port the server listens on).

**Handshake errors** arrive as `connect_error` with `error.message`:

| message | Meaning | Action |
|---|---|---|
| `Authentication token is required` | no token sent | send token |
| `Invalid or expired token` | bad/expired JWT | refresh token, reconnect |
| `User is not allowed to connect` | deleted / blocked / inactive account | log out / show message |
| `Token is no longer valid` | password changed after token was issued | log in again |

On every successful (re)connect the server automatically sends
`onlineUser` and `totalUnseenConversation`. **After a reconnect, re-fetch the
chat list and the open conversation's latest page** to cover events missed while
offline (Socket.IO does not replay them).

### 5.2 Events – you emit (client → server)

#### `send-message`

Send a message. Use the **ack callback** to get the saved message or the error.

Payload:

```json
{
  "receiver": "66f1b9…",            // REQUIRED – other side's PROFILE id
  "text": "Hello",                   // optional if attachments are sent
  "imageUrl": ["uploads/images/chat-images/1711-a.png"],  // optional, string[]
  "videoUrl": [],                    // optional, string[]
  "pdfUrl": []                       // optional, string[]
}
```

Validation (server side):

| Rule | Limit |
|---|---|
| `receiver` | valid id of the opposite role, not yourself, must exist |
| content | needs `text` **or** at least one attachment |
| `text` | trimmed, max **5000** characters |
| attachments | each list max **10** URLs; each URL ≤ **2048** chars; strings only |
| rate limit | max **20** messages / **10 s** per connection (error `429`) |

Ack:

```json
{ "success": true, "data": { /* the saved message, see 5.4 */ } }
{ "success": false, "message": "Message cannot be empty" }
```

Never send `sender`, `msgByUserId`, or a conversation id – the server derives
the sender from your token and finds/creates the conversation itself.

#### `seen`

Mark everything addressed to me in a conversation as read. Emit when the user
**opens** a conversation and when a new message arrives **while that conversation
is on screen**.

```json
{ "conversationId": "66f1c0a2b8d3a4001e5a1111" }
```

No ack. Result comes back as `conversation:seen` (to you) and `message:seen`
(to the other person). If nothing was unread, nothing is emitted.

#### `typing`

Tell the other person that I am typing / stopped typing. It is **not stored**; the
server only relays it to the receiver. No ack.

```json
{ "receiver": "66f1b9…", "isTyping": true }
```

| Rule | Detail |
|---|---|
| `receiver` | other side's **profile id**, opposite role, must exist, not yourself |
| `isTyping` | must be a real boolean (`true` / `false`) |
| rate limit | max **40** typing events / 10 s per connection |
| invalid / over limit | **silently ignored** (no `socket-error`, typing is best effort) |

How to emit (recommended, see [7.3](#73-chat-message-screen)):

- when the user starts typing: emit `isTyping: true`;
- while they keep typing: re-emit `true` at most **once every 2–3 seconds**
  (throttle) – do **not** emit on every keystroke;
- when they stop for ~3 s, clear the text field, send the message, leave the
  screen or the app goes to background: emit `isTyping: false`.

#### `totalUnseenConversation`

Ask for the badge number. No payload. Answer arrives as the
`totalUnseenConversation` event. (Usually unnecessary – it is pushed
automatically, see below.)

### 5.3 Events – you listen (server → client)

| Event | When | Payload |
|---|---|---|
| `message:new` | a message is saved in a conversation I belong to (also my own sends, and from my other devices) | [message](#54-message-object) |
| `conversation:update` | same moment – update the chat-list row | see below |
| `message:seen` | the other person read my messages | `{ conversationId, seenBy }` |
| `conversation:seen` | I marked a conversation as read (also arrives on my other devices) | `{ conversationId, unreadCount: 0 }` |
| `typing` | the other person is typing / stopped | `{ from, isTyping }` – `from` = their **profile id** (same as `userData._id` in the chat list) |
| `totalUnseenConversation` | on connect; when I receive a message; after I mark seen | `{ totalUnseenConversation: number }` |
| `onlineUser` | on connect + whenever anyone connects/disconnects | `string[]` of online ids (both user ids and profile ids) |
| `socket-error` | a request of mine failed | `{ code, message, type, details? }` |

`conversation:update` payload:

```json
{
  "conversationId": "66f1c0a2b8d3a4001e5a1111",
  "lastMessage": { /* message object */ },
  "unreadDelta": 1,
  "userData": {
    "_id": "66f1b9…",
    "user": "66f1a0…",
    "name": "Salon Berlin",
    "profile_image": "uploads/images/shop_image/…"
  }
}
```

- `unreadDelta` is **0 for the sender** and **1 for the receiver**.
- `userData` is always **the other person from the recipient's point of view**.
  This is what lets a **brand-new conversation appear in the list** without
  refetching: if `conversationId` is not in your list, insert a new row from
  this payload (`unseenMsg = unreadDelta`).

`socket-error` types: `validation` (bad input), `general` (e.g. rate limit),
`server` (unexpected). Example:

```json
{ "code": 400, "message": "Message cannot be empty", "type": "validation" }
```

### 5.4 Message object

Same shape from `message:new`, the `send-message` ack, and REST (REST adds
`isMyMessage`):

```json
{
  "_id": "…",
  "conversationId": "…",
  "text": "Hello",
  "imageUrl": [],
  "videoUrl": [],
  "pdfUrl": [],
  "msgByUserId": "…sender profile id",
  "msgByUserModel": "Customer",
  "receiverId": "…receiver profile id",
  "receiverModel": "Client",
  "seen": false,
  "createdAt": "2026-03-29T10:15:00.000Z",
  "updatedAt": "2026-03-29T10:15:00.000Z"
}
```

### 5.5 Typing indicator – how to consume

`typing` carries only `{ from, isTyping }` (no conversation id), so key the state
by the other person's profile id:

```text
typingUsers: Map<profileId, Timer>

on 'typing' { from, isTyping }:
    if isTyping:
        show "typing…" for `from` (chat screen with that person, and the chat-list row)
        restart a 5 s timer for `from`; when it fires -> hide "typing…"
    else:
        hide "typing…" for `from`, cancel its timer

on 'message:new' where msgByUserId == from:
    hide "typing…" for `from`            // the message replaces the indicator

on 'onlineUser' no longer containing `from`  /  socket disconnect:
    clear all typing state
```

The 5 s safety timer is required: if the other person's app crashes or loses
network, no `isTyping: false` is ever sent.

### 5.6 Presence

`onlineUser` contains ids of everyone currently connected (user ids **and**
profile ids). To show a green dot for the person in a chat, check whether
`userData._id` (their profile id) is in the latest array. The list is
replaced as a whole each time. A user with several devices stays online until
the last one disconnects.

---

## 6. Sending files / images

Chat messages carry **URLs**, not binary data. Flow: upload the file over REST,
then send the returned path in `send-message`.

`POST /file-upload/upload-images` – `multipart/form-data`, auth required.

| Part | Allowed |
|---|---|
| field `chat_images` (up to 5 files) | `image/jpeg`, `image/png`, `image/jpg`, `image/webp` |
| size | max 20 MB per file |

Response `201`: `data` is an array of stored **relative paths**, e.g.
`["uploads/images/chat-images/1711999999-photo.png"]`.

Then:

```json
{ "receiver": "…", "imageUrl": ["uploads/images/chat-images/1711999999-photo.png"] }
```

To display an attachment, prefix the API origin:
`https://<host>/` + path (static route `/uploads`). Normalise backslashes (`\`
→ `/`) defensively – paths generated on a Windows dev server use backslashes.

> **Known backend limits (tell the backend team if you need more):**
> - The upload endpoint currently **returns paths only for `chat_images`**. The
>   `chat_videos` field is accepted and stored but its paths are not returned, and
>   **PDF upload is not supported yet**. Until that is added, the app can send
>   **text + images** only. `videoUrl` / `pdfUrl` already work on the chat side
>   once an upload route can supply the URLs.
> - Allowed upload types are fixed on the server (no `gif`, no documents).

---

## 7. Screen-by-screen implementation plan

### 7.1 App start / login

1. Login → store `accessToken`, `refreshToken`, **my profile id**.
2. Create the single socket connection with the token.
3. Register all listeners (once) – see [10](#10-code-examples).
4. Handle `connect_error` (table in 5.1).

### 7.2 Chat list screen

1. On open: `GET /conversation/get-chat-list?page=1&limit=10`. Infinite scroll
   with the next page.
2. Render row: avatar = `userData.profile_image`, title = `userData.name`,
   subtitle = `lastMessage` preview (`text`, or "📷 Photo" when `imageUrl` has
   items, etc.), time = `lastMessageAt`, badge = `unseenMsg`, green dot via
   `onlineUser`. While `typing` is active for `userData._id`, show "typing…"
   instead of the message preview (see [5.5](#55-typing-indicator--how-to-consume)).
3. Live: on `conversation:update`
   - find row by `conversationId`; if found: replace `lastMessage`, set
     `lastMessageAt = lastMessage.createdAt`, `unseenMsg += unreadDelta`, move the
     row to the top;
   - if not found: insert a new row at the top (use `userData` from the payload).
4. On `conversation:seen`: set that row's `unseenMsg = 0`.
5. Tab/app bar badge: the number from `totalUnseenConversation`.
6. On socket reconnect: refetch page 1.

### 7.3 Chat (message) screen

Opening a conversation:

1. If you came from the list you already know `conversationId`. If you came from
   a **shop page** (no conversation yet) you only know the shop's `Client._id`:
   look in the list for a row whose `userData._id` equals it. If none exists, the
   chat is empty – show the empty state; the conversation is created by the first
   message.
2. Load history: `GET /message/get-messages/:conversationId?page=1&limit=20`.
3. Emit `seen` `{ conversationId }`.
4. Keep `currentConversationId` in app state (used below).

Live:

- `message:new`: ignore if `message.conversationId !== currentConversationId`.
  Otherwise append (de-duplicate by `_id`). If `message.msgByUserId` is **not**
  me, also emit `seen { conversationId }` (the user is looking at it).
- `message:seen`: if `conversationId` matches, mark **my** messages in that
  conversation as `seen = true` (show "read" ticks).
- `typing`: if `from` is the person of this chat, show "typing…" under their
  name / as a bubble at the bottom (rules in [5.5](#55-typing-indicator--how-to-consume)).

Typing (emit):

1. On text-field change: if the field became non-empty and I have not sent
   `isTyping: true` in the last ~2.5 s, emit
   `typing { receiver, isTyping: true }` (throttled – never per keystroke).
2. Start/restart a ~3 s idle timer on each change; when it fires, emit
   `typing { receiver, isTyping: false }`.
3. Also emit `false` when the field is cleared, after sending a message, when
   leaving the screen, and when the app goes to background.

Sending:

1. Disable send for empty text with no attachments (the server rejects it).
2. Optimistic UI: add a local "sending" bubble with a temporary client id.
3. `emit('send-message', payload, ack)`. On ack success replace the temp bubble
   with `ack.data` (dedupe: `message:new` for the same `_id` will also arrive – do
   not add it twice). On failure mark the bubble "failed – tap to retry" and show
   `ack.message`.
4. A first message creating a new conversation: take `ack.data.conversationId` and
   store it as `currentConversationId` so later messages and `seen` work.

Older messages: when scrolled to the top, load `page + 1` and prepend.

Leaving the screen: set `currentConversationId = null` (so incoming messages
increase the list badge instead of auto-marking as seen).

### 7.4 Global

- Total unread badge on the chat tab → `totalUnseenConversation`.
- Foreground in-app toast for `message:new` when the chat screen is not open
  (optional; there are no push notifications for chat yet).
- Logout → `socket.disconnect()` and clear chat state.

---

## 8. Client state rules

1. **De-duplicate by `_id`** whenever merging messages from REST, ack and
   `message:new`.
2. **Sort** messages by `createdAt` (REST order is newest first).
3. **Own messages arrive twice** (ack + `message:new`) and also on your other
   devices – this is intended.
4. **Unread math:** `unreadDelta` is the only increment source; do not compute
   unread locally from messages.
5. **After reconnect, refetch** list + the open conversation's first page; do
   not rely on missed events.
6. Treat `profile_image` and attachment URLs as possibly relative paths; build
   absolute URLs with a single helper.
7. Never store or send user ids for chat; always profile ids.

---

## 9. Error handling

### Socket (`socket-error` and ack)

| `code` | `type` | Typical messages | UI |
|---|---|---|---|
| 400 | validation | `A valid receiver is required`, `You cannot message yourself`, `Message cannot be empty`, `Message cannot exceed 5000 characters`, `Invalid attachment list`, `A valid conversationId is required` | fix input / block send |
| 404 | validation | `Receiver not found` | show "user unavailable" |
| 429 | general | `You are sending messages too fast` | throttle, retry later |
| 500 | server | `Failed to send message`, `Failed to update seen status` | "failed – retry" |

### REST

| Status | Meaning | UI |
|---|---|---|
| 400 | invalid id | – |
| 401 | missing/expired token | refresh token → retry once → else logout |
| 403 | blocked / deleted / password changed | logout + message |
| 404 | user not found | – |

### Connection

Use Socket.IO's built-in reconnection (default on). Show a small "connecting…"
banner while disconnected; disable nothing – failed sends can be retried once
reconnected.

---

## 10. Code examples

### 10.1 Flutter (`socket_io_client`)

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatSocket {
  IO.Socket? _socket;

  void connect(String baseUrl, String accessToken) {
    _socket?.dispose();
    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': accessToken})
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );

    _socket!
      ..onConnect((_) {
        // refetch chat list + open conversation page 1 here
      })
      ..onConnectError((err) {
        // err e.g. "Invalid or expired token" -> refresh token, then connect() again
      })
      ..on('message:new', (data) { /* Map<String, dynamic> message */ })
      ..on('conversation:update', (data) { /* update list row */ })
      ..on('message:seen', (data) { /* mark my messages as read */ })
      ..on('typing', (data) { /* data['from'], data['isTyping'] */ })
      ..on('conversation:seen', (data) { /* unseenMsg = 0 */ })
      ..on('totalUnseenConversation', (data) { /* data['totalUnseenConversation'] */ })
      ..on('onlineUser', (data) { /* List<dynamic> ids */ })
      ..on('socket-error', (data) { /* show toast, data['message'] */ })
      ..connect();
  }

  /// Returns the saved message, or throws with the server message.
  Future<Map<String, dynamic>> sendMessage({
    required String receiverProfileId,
    String? text,
    List<String> imageUrl = const [],
  }) {
    final completer = Completer<Map<String, dynamic>>();
    _socket!.emitWithAck(
      'send-message',
      {
        'receiver': receiverProfileId,
        if (text != null && text.trim().isNotEmpty) 'text': text.trim(),
        if (imageUrl.isNotEmpty) 'imageUrl': imageUrl,
      },
      ack: (res) {
        if (res is Map && res['success'] == true) {
          completer.complete(Map<String, dynamic>.from(res['data']));
        } else {
          completer.completeError(res is Map ? res['message'] : 'Failed');
        }
      },
    );
    return completer.future;
  }

  void markSeen(String conversationId) =>
      _socket?.emit('seen', {'conversationId': conversationId});

  /// Call from a throttle (max once per ~2.5 s while typing) and with
  /// isTyping=false when the user stops / sends / leaves the screen.
  void sendTyping(String receiverProfileId, bool isTyping) =>
      _socket?.emit('typing', {'receiver': receiverProfileId, 'isTyping': isTyping});

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}
```

### 10.2 JavaScript / React

```js
import { io } from 'socket.io-client';

export function createChatSocket(url, token, handlers) {
  const socket = io(url, { auth: { token }, transports: ['websocket'] });

  socket.on('connect_error', (e) => handlers.onAuthError?.(e.message));
  socket.on('message:new', handlers.onMessage);
  socket.on('conversation:update', handlers.onConversationUpdate);
  socket.on('message:seen', handlers.onMessageSeen);
  socket.on('typing', handlers.onTyping); // { from, isTyping }
  socket.on('conversation:seen', handlers.onConversationSeen);
  socket.on('totalUnseenConversation', ({ totalUnseenConversation }) =>
    handlers.onUnreadBadge(totalUnseenConversation));
  socket.on('onlineUser', handlers.onOnline);
  socket.on('socket-error', handlers.onError);
  return socket;
}

export const sendMessage = (socket, payload) =>
  new Promise((resolve, reject) =>
    socket.emit('send-message', payload, (res) =>
      res?.success ? resolve(res.data) : reject(new Error(res?.message || 'Failed')),
    ),
  );

export const markSeen = (socket, conversationId) =>
  socket.emit('seen', { conversationId });

// throttle this to once per ~2.5 s while the user types
export const sendTyping = (socket, receiver, isTyping) =>
  socket.emit('typing', { receiver, isTyping });
```

### 10.3 Handling `conversation:update` (pseudo-code)

```text
onConversationUpdate(p):
  row = list.find(r => r._id == p.conversationId)
  if row:
      row.lastMessage   = p.lastMessage
      row.lastMessageAt = p.lastMessage.createdAt
      row.unseenMsg    += p.unreadDelta
  else:
      row = { _id: p.conversationId, lastMessage: p.lastMessage,
              lastMessageAt: p.lastMessage.createdAt,
              unseenMsg: p.unreadDelta, userData: p.userData }
  move row to top of list
```

---

## 11. Migration checklist for existing app code

- [ ] Remove all uses of events: `message-page`, `new-message`, `chat-list`, `message`, `conversation`.
- [ ] Socket connects with `auth: { token }` instead of `?id=`.
- [ ] All chat ids are profile ids (`Customer._id` / `Client._id`).
- [ ] Chat list from REST + `conversation:update`.
- [ ] Message history from REST with pagination (newest first).
- [ ] `send-message` with ack; only `receiver` + content, no sender fields.
- [ ] `seen` sends `{ conversationId }`.
- [ ] `typing` emitted (throttled) and `typing` listener with a 5 s safety timer.
- [ ] `videoUrl` treated as an array; `pdfUrl` supported.
- [ ] Single shared socket instance; disconnect on logout; reconnect on token refresh.
- [ ] Refetch list + open chat after reconnect.
- [ ] De-duplicate messages by `_id`.
- [ ] Unread badge from `totalUnseenConversation` / `unseenMsg`.

---

## 12. QA test scenarios

| # | Scenario | Expected |
|---|---|---|
| 1 | Connect without token | `connect_error: Authentication token is required` |
| 2 | Connect with expired token | `connect_error: Invalid or expired token` |
| 3 | Customer sends first message to a shop | ack success; conversation created; shop receives `message:new` + `conversation:update` (`unreadDelta: 1`, new row appears) |
| 4 | Shop replies | customer gets `message:new`; customer list row moves to top, `unseenMsg` +1, badge updates |
| 5 | Customer opens chat | history loads; `seen` emitted; shop gets `message:seen`; customer row `unseenMsg = 0` |
| 6 | Message arrives while that chat is open | appended once; `seen` emitted; no unread increase left behind |
| 7 | Both users send the very first message at the same time | one single conversation (no duplicates in list) |
| 8 | Empty text, no attachment | ack `Message cannot be empty` |
| 9 | Text of 5001 chars | ack `Message cannot exceed 5000 characters` |
| 10 | `receiver` = own profile id | `You cannot message yourself` |
| 11 | `receiver` = a user id (not profile id) | `Receiver not found` |
| 12 | Customer → customer | `Receiver not found` (opposite role required) |
| 13 | 21 messages within 10 s | the 21st is rejected with 429 |
| 14 | Same account on two devices | both devices get `message:new`; marking seen on one clears the badge on the other (`conversation:seen`); user stays online until both disconnect |
| 15 | Kill network, receive messages, reconnect | app refetches list/history; no missing or duplicated messages |
| 16 | Open another user's conversation id via REST | `200` with empty `data` |
| 17 | Scroll to top of a long chat | next pages load, no duplicates, stops at last page |
| 18 | Block/delete the user, reconnect | `connect_error: User is not allowed to connect` |
| 19 | A types in the chat | B sees "typing…" within a moment; it disappears when A stops, sends, or after 5 s without new events |
| 20 | A types, then the app is killed | B's "typing…" disappears by itself after 5 s |
| 21 | A types while B only has the chat list open | the row of A shows "typing…" instead of the preview |
| 22 | `typing` with a user id / own id / non-boolean `isTyping` | ignored silently, no `socket-error`, nothing delivered |
| 23 | 41+ typing events in 10 s | extra events are dropped, chat messages still work |
