import httpStatus from "http-status";
import catchAsync from "../../utilities/catchasync";
import sendResponse from "../../utilities/sendResponse";
import BlockHourService from "./blockHour.services";

const addBlockHour = catchAsync(async (req, res) => {
    const result = await BlockHourService.addBlockHour(req.body);
     sendResponse(res, {
       statusCode: httpStatus.OK,
       success: true,
       message: 'Block hour added successfully',
       data: result,
     });
   });
   const updateBlockHour  = catchAsync(async(req,res)=>{
    const result = await BlockHourService.updateBusinessHour(req.params.id,req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Block hour updated successfully',
      data: result,
    });
  })

const deleteBlockHour = catchAsync(async(req,res)=>{
    const result = await BlockHourService.deleteBlockHour(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Block hour deleted successfully',
        data: result,
      });
})

const BlockHourController = {
    addBlockHour,
    updateBlockHour,
    deleteBlockHour
}

export default BlockHourController;