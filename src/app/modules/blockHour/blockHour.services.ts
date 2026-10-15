/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IBlockHour } from "./blockHour.interface";
import BlockHour from "./blockHour.model";

const addBlockHour  = async(payload:IBlockHour)=>{
    const result = await BlockHour.create(payload);

    return result;
}

const updateBusinessHour = async(id:string,payload:Partial<IBlockHour>)=>{
    const blockHour = await BlockHour.findById(id);
    const {day,entityId,entityType,...updatedPayload} = payload;
  
    if(!blockHour){
      throw new AppError(httpStatus.NOT_FOUND,"Block hour not found")
    }
    const result = await BlockHour.findByIdAndUpdate(id,updatedPayload,{new:true,runValidators:true})
    return result;
  }



  const deleteBlockHour = async(id:string)=>{
    const blockHour = await BlockHour.findById(id);

    if(!blockHour){
        throw new AppError(httpStatus.NOT_FOUND,"Block hour not found");
    }

    const result  = await BlockHour.findByIdAndDelete(id);
    return result;

  }

const BlockHourService = {
    addBlockHour,
    updateBusinessHour,
    deleteBlockHour
}

export default BlockHourService;

