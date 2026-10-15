import { SALON_TIMEZONE } from '../utilities/salonTime';

// Pin the Node process to the salon timezone (Europe/Berlin) so anything that
// still relies on "local time" (logs, third-party libs, stray `new Date()`
// getters) behaves the same on every machine/host. Business logic does NOT
// depend on this - it uses the helpers in utilities/salonTime.ts - this is a
// safety net. Must be imported before anything else in server.ts.
// See TIMEZONE_HANDLING.md.
process.env.TZ = SALON_TIMEZONE;
