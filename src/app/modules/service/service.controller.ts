import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import ServiceService from './service.services';

const createService = catchAsync(async (req, res) => {
  const result = await ServiceService.createService(
    req?.user.profileId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});
const updateService = catchAsync(async (req, res) => {
  const result = await ServiceService.updateService(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});
const deleteService = catchAsync(async (req, res) => {
  const result = await ServiceService.deleteService(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service deleted successfully',
    data: result,
  });
});

const getAllService = catchAsync(async (req, res) => {
  const result = await ServiceService.getAllService(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});
const getMyServices = catchAsync(async (req, res) => {
  const result = await ServiceService.getMyServices(req.user.profileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});
const getSingleService = catchAsync(async (req, res) => {
  const result = await ServiceService.getSingleService(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const ServiceController = {
  createService,
  updateService,
  deleteService,
  getAllService,
  getMyServices,
  getSingleService,
};

export default ServiceController;
