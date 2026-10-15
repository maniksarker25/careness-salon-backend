import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import productBookmarkServices from './product.bookmark.services';

// const createBookmark = catchAsync(async (req, res) => {
//   const result = await productBookmarkServices.createBookmarkIntoDB(
//     req?.body?.productId,
//     req?.user?.profileId,
//   );

//   sendResponse(res, {
//     statusCode: 201,
//     success: true,
//     message: 'Bookmark created successfully',
//     data: result,
//   });
// });

const productBookmarkAddDelete = catchAsync(async (req, res) => {
  const result = await productBookmarkServices.productBookmarkAddDelete(
    req.user.profileId,
    req.params.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result
      ? 'Bookmark added successfully'
      : 'Bookmark deleted successfully',
    data: result,
  });
});
// get my bookmark
const getMyBookmark = catchAsync(async (req, res) => {
  const result = await productBookmarkServices.getMyBookmarkFromDB(
    req?.user?.profileId,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Bookmark retrieved successfully',
    data: result,
  });
});
// delete bookmark
const deleteBookmark = catchAsync(async (req, res) => {
  const result = await productBookmarkServices.deleteBookmarkFromDB(
    req?.params?.id,
    req?.user?.profileId,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Bookmark deleted successfully',
    data: result,
  });
});

const productBookmarkController = {
  // createBookmark,
  productBookmarkAddDelete,
  getMyBookmark,
  deleteBookmark,
};

export default productBookmarkController;
