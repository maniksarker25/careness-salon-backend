import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import metaServices from './meta.services';

const getDashboardMetaData = catchAsync(async (req, res) => {
  const result = await metaServices.getDashboardMetaData();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: result,
  });
});

const getMonthlySalesAndProfitChartData = catchAsync(async (req, res) => {
  const result = await metaServices.getMonthlySalesAndProfitByYear(
    Number(req.query?.year),
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sales chart data retrieved successfully',
    data: result,
  });
});

const metaController = {
  getDashboardMetaData,
  getMonthlySalesAndProfitChartData,
};

export default metaController;
