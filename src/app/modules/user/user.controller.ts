import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import userServices from './user.services';

const registerCustomer = catchAsync(async (req, res) => {
  const result = await userServices.registerCustomer(
    req?.body?.password,
    req?.body?.confirmPassword,
    req?.body?.customer,
    req?.body?.platform,
    req?.body?.playerId,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      'Register successfull , please check your email for verification code',
    data: result,
  });
});

// register Client
const registerClient = catchAsync(async (req, res) => {
  const result = await userServices.registerClient(
    req?.body?.password,
    req.body.confirmPassword,
    req?.body?.client,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Client register successfully',
    data: result,
  });
});

// register Admin
const registerAdmin = catchAsync(async (req, res) => {
  const result = await userServices.registerAdmin(
    req?.body?.password,
    req?.body?.admin,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Admin created successfully',
    data: result,
  });
});

// get me
const getMyProfile = catchAsync(async (req, res) => {
  const { email, role } = req.user;
  const result = await userServices.getMyProfile(email, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully retrieved your data',
    data: result,
  });
});

const verifyCode = catchAsync(async (req, res) => {
  const result = await userServices.verifyCode(
    req?.body?.email,
    req?.body?.verifyCode,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully verified your account with email',
    data: result,
  });
});
const resendVerifyCode = catchAsync(async (req, res) => {
  const result = await userServices.resendVerifyCode(req?.body?.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Verify code send to your message inbox ',
    data: result,
  });
});

const blockUnblockUser = catchAsync(async (req, res) => {
  const result = await userServices.blockUnblockUser(
    req.params.id,
    req.body.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User successfully ${
      result?.status === 'blocked' ? 'blocked' : 'unblocked'
    }`,
    data: result,
  });
});
const deleteAccount = catchAsync(async (req, res) => {
  const result = await userServices.deleteAccount(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User account deleted successfully',
    data: result,
  });
});

const userController = {
  registerCustomer,
  registerClient,
  registerAdmin,
  getMyProfile,
  verifyCode,
  resendVerifyCode,
  blockUnblockUser,
  deleteAccount,
};
export default userController;
