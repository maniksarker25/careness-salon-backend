import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import bannerServices from './banner.services';

// shop banner
const createShopBanner = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'shop_banner' in files) {
    req.body.image = files['shop_banner'][0].path;
  }

  const result = await bannerServices.createShopBannerIntoDB(
    req?.user?.profileId,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner created successfully',
    data: result,
  });
});
const getMyShopBanner = catchAsync(async (req, res) => {
  const result = await bannerServices.getMyShopBanner(req?.user?.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner retrieved successfully',
    data: result,
  });
});
const deleteMyShopBanner = catchAsync(async (req, res) => {
  const result = await bannerServices.deleteMyShopBanner(
    req?.user?.profileId,
    req?.params?.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner deleted successfully',
    data: result,
  });
});

const updateShopBanner = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'shop_banner' in files) {
    req.body.image = files['shop_banner'][0].path;
  }

  const result = await bannerServices.updateShopBanner(
    req?.user?.profileId,
    req?.params?.id,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner updated successfully',
    data: result,
  });
});
// shop banner
const createAppBanner = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'app_banner' in files) {
    req.body.image = files['app_banner'][0].path;
  }

  const result = await bannerServices.createAppBannerIntoDB(req?.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner created successfully',
    data: result,
  });
});
const getAppBanner = catchAsync(async (req, res) => {
  const result = await bannerServices.getAppBannerFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner retrieved successfully',
    data: result,
  });
});
const deleteAppBanner = catchAsync(async (req, res) => {
  const result = await bannerServices.deleteAppBannerFromDB(req?.params?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner deleted successfully',
    data: result,
  });
});

const updateAppBanner = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'app_banner' in files) {
    req.body.image = files['app_banner'][0].path;
  }

  const result = await bannerServices.updateAppBannerIntoDB(
    req?.params?.id,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner updated successfully',
    data: result,
  });
});

const bannerController = {
  createShopBanner,
  getMyShopBanner,
  deleteMyShopBanner,
  updateShopBanner,
  createAppBanner,
  updateAppBanner,
  getAppBanner,
  deleteAppBanner,
};

export default bannerController;
