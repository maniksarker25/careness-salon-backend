import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import cartServices from './cart.services';

const addToCart = catchAsync(async (req, res) => {
  const result = await cartServices.addToCart({
    costumerId: req?.user?.profileId,
    shopId: req?.body?.shopId,
    productId: req?.body?.productId,
    price: req?.body?.price,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Add to cart successful',
    data: result,
  });
});
const removeCartItem = catchAsync(async (req, res) => {
  const result = await cartServices.removeCartItem(
    req?.user?.profileId,
    req?.body?.productId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item remove successfully',
    data: result,
  });
});
const viewCart = catchAsync(async (req, res) => {
  const result = await cartServices.viewCart(req?.user?.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart retrieved successfully',
    data: result,
  });
});

const increaseItemQuantity = catchAsync(async (req, res) => {
  const result = await cartServices.increaseCartItemQuantity(
    req?.user?.profileId,
    req?.body?.productId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item increase  successfully',
    data: result,
  });
});
const decreaseItemQuantity = catchAsync(async (req, res) => {
  const result = await cartServices.decreaseCartItemQuantity(
    req?.user?.profileId,
    req?.body?.productId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item increase  successfully',
    data: result,
  });
});

const clearCart = catchAsync(async (req, res) => {
  const result = await cartServices.clearCartFromDB(req?.user?.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart deleted  successfully',
    data: result,
  });
});

const cartControllers = {
  addToCart,
  removeCartItem,
  viewCart,
  clearCart,
  increaseItemQuantity,
  decreaseItemQuantity,
};

export default cartControllers;
