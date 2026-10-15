import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import shopBookmarkServices from './shop.bookmark.services';

const shopBookmarkAddDelete = catchAsync(async (req, res) => {
  const result = await shopBookmarkServices.shopBookmarkAddAndDelete(
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
  const result = await shopBookmarkServices.getMyBookmarkFromDB(
    req?.user?.profileId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookmark retrieved successfully',
    data: result,
  });
});
// delete bookmark
const deleteBookmark = catchAsync(async (req, res) => {
  const result = await shopBookmarkServices.deleteBookmarkFromDB(
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

const shopBookmarkController = {
  shopBookmarkAddDelete,
  getMyBookmark,
  deleteBookmark,
};

export default shopBookmarkController;
