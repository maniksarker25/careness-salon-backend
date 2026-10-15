import { Types } from "mongoose";

export interface IBlockHour {
  entityId: Types.ObjectId;      
  entityType: 'Shop' | 'Staff';     
  day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;  
  endTime: string;               
}