import { Types } from 'mongoose';

export interface IBusinessHour {
  entityId: Types.ObjectId;
  entityType: 'Shop' | 'Staff';
  day:
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday';
  openTime?: string; // Format: "HH:mm"
  closeTime?: string;
  isClosed?: boolean;
}
