import { Schema, model } from "mongoose";
import { IBookingReschedule } from "./booking_reschedule.interface";
import { ENUM_RESCHEDULE_STATUS } from "../../utilities/enum";

const BookingRescheduleSchema = new Schema<IBookingReschedule>({
    bookingId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Booking",
    },
    rescheduleDate: {
        type: Date,
        required:true
    },
    // rescheduleTime: {
    //     type: String,
    //     required: true,
    // },
    status:{
        type:String,
        enum:Object.values(ENUM_RESCHEDULE_STATUS),
        default: ENUM_RESCHEDULE_STATUS.PENDING,
    }
    
}, {
    timestamps: true, // Optional: Adds createdAt and updatedAt fields
});

export const RescheduleRequest = model("RescheduleRequest", BookingRescheduleSchema);
