import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import StaffServices from './staff.services';

const createStaff = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'profile_image' in files) {
    req.body.profile_image = files['profile_image'][0].path;
  }

  const result = await StaffServices.createStaffIntoDB(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Staff created successfully',
    data: result,
  });
});
const updateStaff = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'profile_image' in files) {
    req.body.profile_image = files['profile_image'][0].path;
  }

  const result = await StaffServices.updateStaffIntoDB(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staff updated successfully',
    data: result,
  });
});
// delete staff
const deleteStaff = catchAsync(async (req, res) => {
  const result = await StaffServices.deleteStaffFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staff deleted successfully',
    data: result,
  });
});
// get all staff
const getAllStaff = catchAsync(async (req, res) => {
  const result = await StaffServices.getAllStaff(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staff retrieved successfully',
    data: result,
  });
});
// get my staff
const getMyStaff = catchAsync(async (req, res) => {
  const result = await StaffServices.getMyStaff(req.user?.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staff retrieved successfully',
    data: result,
  });
});

const getShopStaffs = catchAsync(async (req, res) => {
  const result = await StaffServices.getShopStaffs(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staff retrieved successfully',
    data: result,
  });
});
// get single staff
const getSingleStaff = catchAsync(async (req, res) => {
  const result = await StaffServices.getSingleStaff(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staff retrieved successfully',
    data: result,
  });
});
// get available staff
const getAvailableStaff = catchAsync(async (req, res) => {
  const result = await StaffServices.getAvailableStaff(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Available staffs retrieved successfully',
    data: result,
  });
});

const StaffController = {
  createStaff,
  updateStaff,
  deleteStaff,
  getAllStaff,
  getMyStaff,
  getAvailableStaff,
  getSingleStaff,
  getShopStaffs,
};

export default StaffController;
