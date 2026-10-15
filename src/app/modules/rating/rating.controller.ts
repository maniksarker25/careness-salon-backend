import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import RatingServices from './rating.service';

const createRating = catchAsync(async (req, res) => {
  const result = await RatingServices.createRating(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Rating added. Thanks for your time',
    data: result,
  });
});
const getRatings = catchAsync(async (req, res) => {
  const result = await RatingServices.getSobRating(
    req.user.profileId,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Rating retrieved',
    data: result,
  });
});

const RatingController = {
  createRating,
  getRatings,
};

export default RatingController;
