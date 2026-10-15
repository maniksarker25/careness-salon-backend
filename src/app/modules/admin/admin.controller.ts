import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import AdminServices from './admin.services';

const updateAdminProfile = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'profile_image' in files) {
    req.body.profile_image = files['profile_image'][0].path;
  }
  const result = await AdminServices.updateAdminProfile(
    req?.user?.id,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin profile updated successfully',
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const result = await AdminServices.deleteAdminFromDB(req?.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin deleted successfully',
    data: result,
  });
});

// update shop status
const updateAdminStatus = catchAsync(async (req, res) => {
  const result = await AdminServices.updateAdminStatus(
    req?.params?.id,
    req?.body?.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin status updated successfully',
    data: result,
  });
});
const getAllAdmin = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllAdminFromDB(req?.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin retrieved successfully',
    data: result,
  });
});

const addRating = catchAsync(async (req, res) => {
  const result = await AdminServices.addRating(
    req?.params?.shopId,
    req?.body?.rating,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Rating added successfully',
    data: result,
  });
});

const AdminController = {
  updateAdminProfile,
  updateShopStatus: updateAdminStatus,
  getAllAdmin,
  addRating,
  deleteAdmin,
};

export default AdminController;
