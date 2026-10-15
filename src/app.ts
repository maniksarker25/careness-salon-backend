/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import { generalApiLimiter } from './app/middlewares/rateLimiter';
import securityHeaders from './app/middlewares/securityHeaders';
import router from './app/routes';
const app: Application = express();
// for stripe----
import Stripe from 'stripe'; // Import Stripe using ES module syntax
import config from './app/config';
import handleConnectedAccountWebhook from './app/handleWebhook/connectedAccountWebhook';
import handleWebhook from './app/handleWebhook/webhook';
const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:7585',
  'http://localhost:3000',
  'http://localhost:7586',
  'http://192.168.10.25:7585',
  'http://192.168.10.25:7586',
  'http://10.0.60.38:7585',
  'http://10.0.60.187:5175',
  'http://10.0.60.187:7585',
  'http://69.62.117.207:4173',
  'https://admin.carenes.de',
];

const allowedOrigins = defaultAllowedOrigins;
// parser---------------------
app.post(
  '/careness-webhook',
  express.raw({ type: 'application/json', limit: '2mb' }),
  handleWebhook,
);
app.post(
  '/careness-connected-account/webhook',
  express.raw({ type: 'application/json', limit: '2mb' }),
  handleConnectedAccountWebhook,
);
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(generalApiLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(
  '/uploads',
  express.static('uploads', {
    dotfiles: 'deny',
    etag: true,
    index: false,
    maxAge: '1d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    },
  }),
);
// application routers ----------------
app.use('/', router);

app.get('/', async (req, res) => {
  res.status(200).send({ message: 'Wellcome to careness salon service' });
});

// onboarding refresh url
router.get('/stripe/onboarding/refresh', async (req, res, next) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).send('Missing accountId');
    }

    // Generate a new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId as string,
      refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${accountId}`,
      return_url: config.stripe.onboarding_return_url,
      type: 'account_onboarding',
    });

    res.redirect(accountLink.url);
  } catch (error) {
    next(error);
  }
});

// not found
app.use(notFound);
// global error handler
app.use(globalErrorHandler);

export default app;
