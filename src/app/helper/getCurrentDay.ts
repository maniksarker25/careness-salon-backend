import { formatSalonDate, getSalonWeekday } from '../utilities/salonTime';

// Current weekday in the salon's timezone (not the server's).
const getCurrentDay = () => getSalonWeekday(formatSalonDate());

export default getCurrentDay;
