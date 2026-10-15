import { Types } from 'mongoose';

export interface ICategory {
  shop: Types.ObjectId;
  categoryName: string;
  appointmentColor: string;
}

export interface ISubCategory {
  shop: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  image: string;
}
