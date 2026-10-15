import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import customerServices from './customer.services';

const getAllCustomer = catchAsync(async (req, res) => {
  const result = await customerServices.getAllCustomer(req?.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Costumer register successfully',
    data: result,
  });
});

const updateCustomerProfile = catchAsync(async (req, res) => {
  const { files } = req;
  if (files && typeof files === 'object' && 'profile_image' in files) {
    req.body.profile_image = files['profile_image'][0].path;
  }

  const result = await customerServices.updateCustomerProfile(
    req?.user?.profileId,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Costumer profile updated successfully',
    data: result,
  });
});
const completeCustomerProfile = catchAsync(async (req, res) => {
  const result = await customerServices.completeCustomerProfile(
    req.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your profile complete successfully',
    data: result,
  });
});

const customerController = {
  getAllCustomer,
  updateCustomerProfile,
  completeCustomerProfile,
};

export default customerController;
