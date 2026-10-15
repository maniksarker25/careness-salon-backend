import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import ClientServices from './client.services';

const updateClientProfile = catchAsync(async (req, res) => {
  // console.log(req);
  const { files } = req;
  if (files && typeof files === 'object' && 'profile_image' in files) {
    req.body.profile_image = files['profile_image'][0].path;
  }
  if (files && typeof files === 'object' && 'shop_image' in files) {
    req.body.shopImages = files['shop_image'].map((file) => file.path);
  }

  const result = await ClientServices.updateClientProfile(
    req?.user?.id,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Client profile updated successfully',
    data: result,
  });
});

const getAllClient = catchAsync(async (req, res) => {
  const result = await ClientServices.getAllClientFromDB(req?.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Client retrieved successfully',
    data: result,
  });
});

const updateClientStatus = catchAsync(async (req, res) => {
  const result = await ClientServices.updateClientStatus(
    req?.params?.id,
    req?.body?.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Client status updated successfully',
    data: result,
  });
});

const getNearbyShop = catchAsync(async (req, res) => {
  const result = await ClientServices.getNearbyShopWithTime(
    req?.user?.profileId,
    // req?.body,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop retrieved successfully',
    data: result,
  });
});
const getSingleShop = catchAsync(async (req, res) => {
  const result = await ClientServices.getSingleShop(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop retrieved successfully',
    data: result,
  });
});
const addShopDetails = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'shop_image' in files) {
    req.body.shopImages = files['shop_image'].map((file) => file.path);
  }

  const result = await ClientServices.addShopDetails(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop details added successfully',
    data: result,
  });
});

const addBankDetails = catchAsync(async (req, res) => {
  const result = await ClientServices.addBankDetails(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bank details added successfully',
    data: result,
  });
});
const getShopDetails = catchAsync(async (req, res) => {
  const result = await ClientServices.getShopDetails(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop details added successfully',
    data: result,
  });
});
const getPayOnShopData = catchAsync(async (req, res) => {
  const result = await ClientServices.getPayOnShopData(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pay on shop data retrieved successfully',
    data: result,
  });
});

const payAdminFee = catchAsync(async (req, res) => {
  const result = await ClientServices.payAdminFee(req.user.profileId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Url for pay admin fee',
    data: result,
  });
});

const notifyAllShopsForAdminFee = catchAsync(async (req, res) => {
  const result = await ClientServices.notifyAllShopsForAdminFee();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent successfully to all shops',
    data: result,
  });
});

const notifySingleShopsForAdminFee = catchAsync(async (req, res) => {
  const result = await ClientServices.notifySingleShopsForAdminFee(
    req.params.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent successfully to shop',
    data: result,
  });
});

const deleteShop = catchAsync(async (req, res) => {
  const result = await ClientServices.deleteClient(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop deleted successfully',
    data: result,
  });
});
const ClientController = {
  updateClientProfile,
  getAllClient,
  updateClientStatus,
  getNearbyShop,
  getSingleShop,
  addShopDetails,
  addBankDetails,
  getShopDetails,
  getPayOnShopData,
  payAdminFee,
  notifyAllShopsForAdminFee,
  notifySingleShopsForAdminFee,
  deleteShop,
};

export default ClientController;
