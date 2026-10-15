/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as HTTPServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server as IOServer, Socket } from 'socket.io';
import config from '../config';
import Client from '../modules/client/client.model';
import Customer from '../modules/customer/customer.model';
import { USER_ROLE } from '../modules/user/user.constant';
import { User } from '../modules/user/user.model';
import handleChat, { ChatSocketContext } from './handleChat';
import { toChatProfileSummary } from './helper';

let io: IOServer;

// Online presence, counted per connection so that a user with two devices/tabs
// stays online until the last one disconnects.
const onlineUsers = new Set<string>();
const onlineUserConnections = new Map<string, number>();

const markOnline = (ids: string[]) => {
  ids.filter(Boolean).forEach((id) => {
    onlineUsers.add(id);
    onlineUserConnections.set(id, (onlineUserConnections.get(id) || 0) + 1);
  });
};

const markOffline = (ids: string[]) => {
  ids.filter(Boolean).forEach((id) => {
    const count = onlineUserConnections.get(id) || 0;
    if (count <= 1) {
      onlineUserConnections.delete(id);
      onlineUsers.delete(id);
    } else {
      onlineUserConnections.set(id, count - 1);
    }
  });
};

type AuthenticatedSocketUser = {
  role: string;
  rooms: string[];
  chat?: ChatSocketContext; // only customers and clients can chat
};

const getTokenFromSocket = (socket: Socket): string | undefined => {
  const raw =
    (socket.handshake.auth?.token as string | undefined) ||
    (socket.handshake.query?.token as string | undefined) ||
    socket.handshake.headers?.authorization;
  if (!raw || typeof raw !== 'string') return undefined;
  const [scheme, token] = raw.split(' ');
  return /^bearer$/i.test(scheme) && token ? token : raw;
};

// Verifies the JWT and the account state (same rules as the REST `auth`
// middleware). The identity always comes from the token, never from what the
// client sends.
const authenticateSocket = async (
  socket: Socket,
): Promise<AuthenticatedSocketUser> => {
  const token = getTokenFromSocket(socket);
  if (!token) throw new Error('Authentication token is required');

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.isDeleted || user.status === 'blocked' || !user.isActive) {
    throw new Error('User is not allowed to connect');
  }
  if (
    user.passwordChangedAt &&
    (await User.isJWTIssuedBeforePasswordChange(
      user.passwordChangedAt,
      decoded.iat as number,
    ))
  ) {
    throw new Error('Token is no longer valid');
  }

  const userId = user._id.toString();
  const isAdmin =
    user.role === USER_ROLE.admin || user.role === USER_ROLE.superAdmin;
  const rooms = [
    userId,
    isAdmin ? USER_ROLE.admin : '',
    user.role === USER_ROLE.superAdmin ? USER_ROLE.superAdmin : '',
  ];

  let chat: ChatSocketContext | undefined;
  if (user.role === USER_ROLE.customer) {
    const customer = await Customer.findOne({ user: user._id }).select(
      'user firstName lastName profile_image',
    );
    if (customer) {
      chat = {
        profileId: customer._id.toString(),
        role: user.role,
        profile: toChatProfileSummary(customer, 'Customer'),
      };
    }
  } else if (user.role === USER_ROLE.client) {
    const client: any = await Client.findOne({ user: user._id }).select(
      'user firstName lastName shopName shopImages profile_image',
    );
    if (client) {
      chat = {
        profileId: client._id.toString(),
        role: user.role,
        profile: toChatProfileSummary(client, 'Client'),
      };
    }
  }
  if (chat) rooms.push(chat.profileId);

  return { role: user.role, rooms: rooms.filter(Boolean), chat };
};

const initializeSocket = (server: HTTPServer) => {
  if (!io) {
    io = new IOServer(server, {
      pingTimeout: 60000,
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:7585',
          'http://192.168.10.25:7585',
          'http://192.168.10.25:7586',
          'http://10.0.60.38:7585',
          'http://69.62.117.207:4173',
          'http://10.0.60.187:7585',
          'https://admin.carenes.de',
        ],
      },
    });

    // Reject unauthenticated connections before they are established
    io.use(async (socket, next) => {
      try {
        socket.data.auth = await authenticateSocket(socket);
        next();
      } catch (error: any) {
        next(new Error(error?.message || 'Unauthorized'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const { rooms, chat } = socket.data.auth as AuthenticatedSocketUser;

      rooms.forEach((room) => socket.join(room));
      markOnline(rooms);
      io.emit('onlineUser', Array.from(onlineUsers));

      if (chat) handleChat(io, socket, chat);

      socket.on('disconnect', () => {
        markOffline(rooms);
        io.emit('onlineUser', Array.from(onlineUsers));
      });
    });
  }
  return io;
};

const isUserOnline = (userId: string) => onlineUsers.has(userId);

const getIO = () => {
  if (!io) {
    throw new Error(
      'Socket.io is not initialized. Call initializeSocket first.',
    );
  }
  return io;
};

export { getIO, initializeSocket, isUserOnline };
