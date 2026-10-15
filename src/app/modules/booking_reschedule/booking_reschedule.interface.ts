import { Types } from "mongoose";
import { ENUM_RESCHEDULE_STATUS } from "../../utilities/enum";

export interface IBookingReschedule {
    bookingId: Types.ObjectId;
    rescheduleDate: Date;
    rescheduleTime: string;
    status:(typeof ENUM_RESCHEDULE_STATUS)[keyof typeof ENUM_RESCHEDULE_STATUS];

}