import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import ShopCategoryServices from './shopCategory.services';

const createShopCategory = catchAsync(async (req, res) => {
  const { files } = req;
  // Check if files and store_image exist, and process multiple images
  if (files && typeof files === 'object' && 'shop_category_image' in files) {
    req.body.image = files['shop_category_image'][0].path;
  }
  const result = await ShopCategoryServices.createShopCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shop category created successfully',
    data: result,
  });
});
const updateShopCategory = catchAsync(async (req, res) => {
  const { files } = req;
  // Check if files and store_image exist, and process multiple images
  if (files && typeof files === 'object' && 'shop_category_image' in files) {
    req.body.image = files['shop_category_image'][0].path;
  }

  const result = await ShopCategoryServices.updateShopCategory(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop category updated successfully',
    data: result,
  });
});
const deleteShopCategory = catchAsync(async (req, res) => {
  const result = await ShopCategoryServices.deleteShopCategory(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop category deleted successfully',
    data: result,
  });
});
const getAllShopCategory = catchAsync(async (req, res) => {
  const result = await ShopCategoryServices.getAllShopCategory(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop category retrieved successfully',
    data: result,
  });
});

const ShopCategoryController = {
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
  getAllShopCategory,
};

export default ShopCategoryController;
