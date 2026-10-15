import { formatSalonCompactTimestamp } from './salonTime';

// "YYYYMMDDHHmmss" in salon (Germany) time, independent of the server timezone.
export const generateTimestamp = () => formatSalonCompactTimestamp();
