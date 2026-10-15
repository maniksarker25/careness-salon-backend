import { Types } from "mongoose";

export interface IRating {
    customer:Types.ObjectId;
    shop:Types.ObjectId;
    staff:Types.ObjectId;
    shopRating:number;
    shopRatingDescription:string;
    staffRating:number;
}