/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../error/appError';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const stores = new Set<Map<string, RateLimitEntry>>();

const getClientIp = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
};

export const rateLimiter = ({
  windowMs,
  max,
  message = 'Too many requests. Please try again later.',
  keyGenerator = getClientIp,
}: RateLimitOptions) => {
  const store = new Map<string, RateLimitEntry>();
  stores.add(store);

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyGenerator(req);
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(max - current.count, 0));
    res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetAt / 1000));

    if (current.count > max) {
      throw new AppError(httpStatus.TOO_MANY_REQUESTS, message);
    }

    return next();
  };
};

setInterval(
  () => {
    const now = Date.now();

    stores.forEach((store) => {
      store.forEach((entry, key) => {
        if (entry.resetAt <= now) {
          store.delete(key);
        }
      });
    });
  },
  5 * 60 * 1000,
).unref();

export const generalApiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req) => `${getClientIp(req)}:${req.body?.email || 'unknown'}`,
});

export const sensitiveActionLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many sensitive requests. Please try again later.',
  keyGenerator: (req) =>
    `${getClientIp(req)}:${req.body?.email || req.user?.id || 'unknown'}`,
});
