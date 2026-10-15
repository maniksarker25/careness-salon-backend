import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import productServices from './product.services';

const createProduct = catchAsync(async (req, res) => {
  const { files } = req;
  // Check if files and store_image exist, and process multiple images
  if (files && typeof files === 'object' && 'product_image' in files) {
    req.body.product_image = files['product_image'][0].path;
  }

  const result = await productServices.createProductIntoDB(
    req?.user?.profileId,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProduct = catchAsync(async (req, res) => {
  const result = await productServices.getAllProduct(req?.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const getSingleProduct = catchAsync(async (req, res) => {
  const result = await productServices.getSingleProduct(req?.params?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const getShopProducts = catchAsync(async (req, res) => {
  const result = await productServices.getShopProducts(
    req.params.id,
    req?.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const getMyProducts = catchAsync(async (req, res) => {
  const result = await productServices.getMyProducts(
    req?.user.profileId,
    req?.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'product_image' in files) {
    req.body.product_image = files['product_image'][0].path;
  }

  const result = await productServices.updateProduct(
    req?.params?.id,
    req.user.profileId,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});
const deleteProduct = catchAsync(async (req, res) => {
  const result = await productServices.deleteProductFromDB(
    req?.params?.id,
    req?.user?.profileId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});
const changeProductStatus = catchAsync(async (req, res) => {
  const result = await productServices.changeProductStatus(
    req?.params?.id,
    req?.user?.profileId,
    req?.body?.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product status updated successfully',
    data: result,
  });
});

const productController = {
  createProduct,
  getAllProduct,
  getMyProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  changeProductStatus,
  getShopProducts,
};

export default productController;
