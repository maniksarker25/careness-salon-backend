import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import DiscountService from './discount.services';

const createDiscount = catchAsync(async (req, res) => {
  const result = await DiscountService.createDiscount(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Discount created successfully',
    data: result,
  });
});
const getDiscount = catchAsync(async (req, res) => {
  const result = await DiscountService.getDiscount(req.user.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Discount retrieved successfully',
    data: result,
  });
});
const updateDiscount = catchAsync(async (req, res) => {
  const result = await DiscountService.updateDiscount(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Discount updated successfully',
    data: result,
  });
});
const deleteDiscount = catchAsync(async (req, res) => {
  const result = await DiscountService.deleteDiscount(req.user.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Discount deleted successfully',
    data: result,
  });
});

const DiscountController = {
  createDiscount,
  getDiscount,
  updateDiscount,
  deleteDiscount,
};

export default DiscountController;
