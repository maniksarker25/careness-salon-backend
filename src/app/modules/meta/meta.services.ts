import Booking from '../booking/booking.model';
import Client from '../client/client.model';
import Customer from '../customer/customer.model';
import Service from '../service/service.model';
import {
  ENUM_BOOKING_STATUS,
  ENUM_PAYMENT_TYPE,
} from '../../utilities/enum';
import {
  SALON_TIMEZONE,
  endOfSalonYear,
  startOfSalon,
  startOfSalonMonthOffset,
  startOfSalonYear,
} from '../../utilities/salonTime';

const getDashboardMetaData = async () => {
  const totalService = await Service.countDocuments();
  const totalCustomer = await Customer.countDocuments();
  const totalClient = await Client.countDocuments();

  // Month boundaries are in salon (Germany) time, not server time.
  const currentMonthStart = startOfSalon('month');
  const lastMonthStart = startOfSalonMonthOffset(-1);

  // Customer -----------
  const currentMonthCustomerCount = await Customer.countDocuments({
    createdAt: {
      $gte: currentMonthStart,
      $lt: new Date(),
    },
  });
  const lastMonthCustomerCount = await Customer.countDocuments({
    createdAt: {
      $gte: lastMonthStart,
      $lt: currentMonthStart,
    },
  });

  const customerChangeType =
    currentMonthCustomerCount > lastMonthCustomerCount
      ? 'increase'
      : 'decrease';
  const customerChangePercentage =
    lastMonthCustomerCount > 0
      ? Math.abs(
          ((currentMonthCustomerCount - lastMonthCustomerCount) /
            lastMonthCustomerCount) *
            100,
        )
      : 0;

  // client --------------------
  const currentMonthClientCount = await Client.countDocuments({
    createdAt: {
      $gte: currentMonthStart,
      $lt: new Date(),
    },
  });
  const lastMonthClientCount = await Client.countDocuments({
    createdAt: {
      $gte: lastMonthStart,
      $lt: currentMonthStart,
    },
  });

  const clientChangeType =
    currentMonthClientCount > lastMonthClientCount ? 'increase' : 'decrease';
  const clientChangePercentage =
    lastMonthClientCount > 0
      ? Math.abs(
          ((currentMonthClientCount - lastMonthClientCount) /
            lastMonthClientCount) *
            100,
        )
      : 0;

  // service -------------

  const currentMonthServiceCount = await Service.countDocuments({
    createdAt: {
      $gte: currentMonthStart,
      $lt: new Date(),
    },
  });
  const lastMonthServiceCount = await Service.countDocuments({
    createdAt: {
      $gte: lastMonthStart,
      $lt: currentMonthStart,
    },
  });

  const serviceChangeType =
    currentMonthServiceCount > lastMonthServiceCount ? 'increase' : 'decrease';
  const serviceChangePercentage =
    lastMonthServiceCount > 0
      ? Math.abs(
          ((currentMonthServiceCount - lastMonthServiceCount) /
            lastMonthServiceCount) *
            100,
        )
      : 0;

  const result = await calculateSalesAndProfit();

  // total sales -------------
  const totalSalesChangeType =
    result.currentMonth.totalSales > result.previousMonth.totalSales
      ? 'increase'
      : 'decrease';
  const totalSalesChangePercentage =
    result.previousMonth.totalSales > 0
      ? Math.abs(
          ((result.currentMonth.totalSales - result.previousMonth.totalSales) /
            result.previousMonth.totalSales) *
            100,
        )
      : 0;

  // total profit-----------------------
  const totalProfitChangeType =
    result.currentMonth.totalSales > result.previousMonth.totalSales
      ? 'increase'
      : 'decrease';
  const totalProfitChangePercentage =
    result.previousMonth.totalSales > 0
      ? Math.abs(
          ((result.currentMonth.totalProfit -
            result.previousMonth.totalProfit) /
            result.previousMonth.totalProfit) *
            100,
        )
      : 0;

  return {
    totalSales: result.overall.totalSales,
    pendingSales: result.overall.pendingSales,
    totalProfit: result.overall.totalProfit,
    totalService,
    totalCustomer,
    totalClient,
    customerChangeType,
    customerChangePercentage: customerChangePercentage.toFixed(2),
    clientChangeType,
    clientChangePercentage: clientChangePercentage.toFixed(2),
    serviceChangeType,
    serviceChangePercentage: serviceChangePercentage.toFixed(2),
    totalSalesChangeType,
    totalSalesChangePercentage: totalSalesChangePercentage.toFixed(2),
    totalProfitChangeType,
    totalProfitChangePercentage: totalProfitChangePercentage.toFixed(2),
  };
};

// Platform profit rates on a recognized booking amount.
const ONLINE_PROFIT_RATE = 0.05;
const PAY_ON_SHOP_PROFIT_RATE = 0.1;

// Revenue is only recognized once the appointment is COMPLETED (or marked
// no-show, which also ends as COMPLETED), for both payment types:
//  - online: the customer already paid, so a completed/no-show booking is
//    revenue (the shop is paid out and the platform keeps its fee);
//  - pay-on-shop: revenue only if payment was actually collected, so a
//    pay-on-shop no-show (isNoShow) counts as neither revenue nor pending.
// A BOOKED booking has not happened yet, so it is pending for both types.
const isRecognized = {
  $and: [
    { $eq: ['$status', ENUM_BOOKING_STATUS.COMPLETED] },
    {
      $not: [
        {
          $and: [
            { $eq: ['$paymentType', ENUM_PAYMENT_TYPE.PAY_ON_SHOP] },
            { $eq: [{ $ifNull: ['$isNoShow', false] }, true] },
          ],
        },
      ],
    },
  ],
};

const revenueProjection = {
  totalPrice: 1,
  recognizedAmount: { $cond: [isRecognized, '$totalPrice', 0] },
  pendingAmount: {
    $cond: [
      { $eq: ['$status', ENUM_BOOKING_STATUS.BOOKED] },
      '$totalPrice',
      0,
    ],
  },
  profit: {
    $cond: [
      isRecognized,
      {
        $multiply: [
          '$totalPrice',
          {
            $cond: [
              { $eq: ['$paymentType', ENUM_PAYMENT_TYPE.ONLINE] },
              ONLINE_PROFIT_RATE,
              PAY_ON_SHOP_PROFIT_RATE,
            ],
          },
        ],
      },
      0,
    ],
  },
};

const calculateSalesAndProfit = async () => {
  // Month boundaries are in salon (Germany) time, not server time.
  const currentMonthStart = startOfSalon('month');
  const previousMonthStart = startOfSalonMonthOffset(-1);
  // 1 ms before the current month starts
  const previousMonthEnd = new Date(currentMonthStart.getTime() - 1);

  const bookings = await Booking.aggregate([
    {
      $match: {
        status: {
          $in: [ENUM_BOOKING_STATUS.BOOKED, ENUM_BOOKING_STATUS.COMPLETED],
        },
      },
    },
    {
      $project: {
        startTime: 1,
        ...revenueProjection,
      },
    },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$recognizedAmount' }, // Overall recognized sales
              pendingSales: { $sum: '$pendingAmount' }, // Overall pending (unpaid pay-on-shop) sales
              totalProfit: { $sum: '$profit' }, // Overall total profit
            },
          },
        ],
        currentMonth: [
          {
            $match: {
              startTime: { $gte: currentMonthStart },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$recognizedAmount' }, // Current month recognized sales
              pendingSales: { $sum: '$pendingAmount' }, // Current month pending sales
              totalProfit: { $sum: '$profit' }, // Current month total profit
            },
          },
        ],
        previousMonth: [
          {
            $match: {
              startTime: { $gte: previousMonthStart, $lte: previousMonthEnd },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$recognizedAmount' }, // Previous month recognized sales
              pendingSales: { $sum: '$pendingAmount' }, // Previous month pending sales
              totalProfit: { $sum: '$profit' }, // Previous month total profit
            },
          },
        ],
      },
    },
  ]);

  const overall = bookings[0].overall[0] || {
    totalSales: 0,
    pendingSales: 0,
    totalProfit: 0,
  };
  const currentMonth = bookings[0].currentMonth[0] || {
    totalSales: 0,
    pendingSales: 0,
    totalProfit: 0,
  };
  const previousMonth = bookings[0].previousMonth[0] || {
    totalSales: 0,
    pendingSales: 0,
    totalProfit: 0,
  };

  return {
    overall: {
      totalSales: overall.totalSales,
      pendingSales: overall.pendingSales,
      totalProfit: overall.totalProfit,
    },
    currentMonth: {
      totalSales: currentMonth.totalSales,
      pendingSales: currentMonth.pendingSales,
      totalProfit: currentMonth.totalProfit,
    },
    previousMonth: {
      totalSales: previousMonth.totalSales,
      pendingSales: previousMonth.pendingSales,
      totalProfit: previousMonth.totalProfit,
    },
  };
};

const getMonthlySalesAndProfitByYear = async (year: number) => {
  // Calculate start and end dates for the given year
  // Jan 1st 00:00 to Dec 31st 23:59:59.999 of the given year, in salon time
  const startDate = startOfSalonYear(year);
  const endDate = endOfSalonYear(year);

  const data = await Booking.aggregate([
    {
      $match: {
        status: {
          $in: [ENUM_BOOKING_STATUS.BOOKED, ENUM_BOOKING_STATUS.COMPLETED],
        },
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $project: {
        // Group by the month as seen in salon time (Mongo defaults to UTC)
        month: { $month: { date: '$startTime', timezone: SALON_TIMEZONE } },
        ...revenueProjection,
      },
    },
    {
      $group: {
        _id: { month: '$month' },
        totalSales: { $sum: '$recognizedAmount' },
        pendingSales: { $sum: '$pendingAmount' },
        totalProfit: { $sum: '$profit' },
      },
    },
    {
      $sort: { '_id.month': 1 }, // Sort by month
    },
  ]);

  // Map month numbers to names
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Fill in missing months with default values
  const fullYearData = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    const monthData = data.find((d) => d._id.month === monthIndex) || {
      totalSales: 0,
      pendingSales: 0,
      totalProfit: 0,
    };
    return {
      month: monthNames[i],
      totalSales: monthData.totalSales,
      pendingSales: monthData.pendingSales,
      totalProfit: monthData.totalProfit,
    };
  });

  // Calculate total sales for the entire year
  const totalYearlySales = fullYearData.reduce(
    (sum, monthData) => sum + monthData.totalSales,
    0,
  );
  const totalYearlyPendingSales = fullYearData.reduce(
    (sum, monthData) => sum + monthData.pendingSales,
    0,
  );

  return {
    success: true,
    message: `Sales chart data retrieved successfully for ${year}`,
    data: fullYearData,
    totalSales: totalYearlySales,
    totalPendingSales: totalYearlyPendingSales,
  };
};

const metaServices = {
  getDashboardMetaData,
  getMonthlySalesAndProfitByYear,
};

export default metaServices;
