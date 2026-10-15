/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import Booking from '../booking/booking.model';
import Discount from '../discount/discount.model';
import { IProduct } from './product.interface';
import { Product } from './product.model';

const createProductIntoDB = async (shopId: string, payload: IProduct) => {
  const result = await Product.create({ ...payload, shop: shopId });
  return result;
};

// const getAllProduct = async (query: Record<string, any>) => {
//   const productQuery = new QueryBuilder(Product.find(), query)
//     .search(['name'])
//     .filter()
//     .sort()
//     .paginate()
//     .fields();
//   const meta = await productQuery.countTotal();
//   const result = await productQuery.modelQuery;

//   return {
//     meta,
//     result,
//   };
// };

const getAllProduct = async (query: Record<string, any>) => {
  // Step 1: Aggregate total sales and total sold count for each product
  const totalProductData = await Booking.aggregate([
    { $unwind: '$products' }, // Unwind products array in each booking
    {
      $group: {
        _id: '$products.productId',
        totalSales: { $sum: '$products.price' }, // Sum up the price for total sales
        totalSold: { $sum: 1 }, // Count each occurrence as a booking
      },
    },
  ]);

  // Step 2: Create a mapping for quick lookup of total sales and sold count by productId
  const productDataMap = totalProductData.reduce(
    (acc: any, data: any) => {
      acc[data._id.toString()] = {
        totalSales: data.totalSales,
        totalSold: data.totalSold,
      };
      return acc;
    },
    {} as Record<string, { totalSales: number; totalSold: number }>,
  );

  // Step 3: Build the product query with pagination, search, etc.
  const productQuery = new QueryBuilder(
    Product.find().populate({ path: 'shop', select: 'shopName' }),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await productQuery.countTotal();
  const result = await productQuery.modelQuery;

  // Step 4: Add totalSales and totalSold to each product in the result
  const resultWithSalesAndSold = result.map((product) => {
    const productId = product._id.toString();
    const { totalSales = 0, totalSold = 0 } = productDataMap[productId] || {};
    return {
      ...product.toObject(),
      totalSales,
      totalSold,
    };
  });

  return {
    meta,
    result: resultWithSalesAndSold,
  };
};

const getSingleProduct = async (id: string) => {
  const result = await Product.findById(id);
  return result;
};

const updateProduct = async (
  id: string,
  shopId: string,
  payload: Partial<IProduct>,
) => {
  //!TODO: need to use id and shop id both for update product
  const product = await Product.findOne({ _id: id, shop: shopId });
  if (!product) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Unauthorized access');
  }
  const result = await Product.findOneAndUpdate(
    { _id: id, shop: shopId },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};

const deleteProductFromDB = async (id: string, profileId: string) => {
  //!TODO: need to use id and shop id both for update product
  const result = await Product.findOneAndDelete({ _id: id, shop: profileId });
  return result;
};

const changeProductStatus = async (
  id: string,
  profileId: string,
  status: string,
) => {
  const result = await Product.findOneAndUpdate(
    { _id: id, shop: profileId },
    { status: status },
    { new: true, runValidators: true },
  );
  return result;
};

// const getMyProducts = async (shopId: string, query: Record<string, any>) => {
//   const productQuery = new QueryBuilder(Product.find({ shop: shopId }), query)
//     .search(['name'])
//     .filter()
//     .sort()
//     .paginate()
//     .fields();
//   const meta = await productQuery.countTotal();
//   const result = await productQuery.modelQuery;

//   return {
//     meta,
//     result,
//   };
// };

const getShopProducts = async (shopId: string, query: Record<string, any>) => {
  // Fetch active discount for the shop
  const now = new Date();
  const discount: any = await Discount.findOne({
    shop: shopId,
    discountStartDate: { $lte: now },
    discountEndDate: { $gte: now },
  });

  // Create a query to retrieve products based on the provided criteria
  const productQuery = new QueryBuilder(Product.find({ shop: shopId }), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await productQuery.countTotal();
  let products = await productQuery.modelQuery;

  // If there is an active discount, apply it to eligible products
  if (discount) {
    const isAllServices = discount.services === 'all-services';
    // const discountProducts = isAllServices
    //   ? products
    //   : products.filter(product => discount.products.includes(product._id));

    // Add discount price to eligible products
    products = products.map((product) => {
      if (isAllServices || (discount.products && discount.products.includes(product._id))) {
        const discountAmount =
          product.price * (discount.discountPercentage / 100);
        const discountPrice = product.price - discountAmount;
        return {
          ...product.toObject(),
          discountPrice: discountPrice,
        };
      }
      return product.toObject();
    });
  }

  return {
    meta,
    result: products,
  };
};

const getMyProducts = async (shopId: string, query: Record<string, any>) => {
  // Step 1: Aggregate total sales and total sold count for each product
  const totalProductData = await Booking.aggregate([
    { $unwind: '$products' }, // Unwind products array in each booking
    {
      $group: {
        _id: '$products.productId',
        totalSales: { $sum: '$products.price' }, // Sum up the price for total sales
        totalSold: { $sum: 1 }, // Count each occurrence as a booking
      },
    },
  ]);

  // Step 2: Create a mapping for quick lookup of total sales and sold count by productId
  const productDataMap = totalProductData.reduce(
    (acc: any, data: any) => {
      acc[data._id.toString()] = {
        totalSales: data.totalSales,
        totalSold: data.totalSold,
      };
      return acc;
    },
    {} as Record<string, { totalSales: number; totalSold: number }>,
  );

  // Step 3: Build the product query with pagination, search, etc.
  const productQuery = new QueryBuilder(Product.find({ shop: shopId }), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await productQuery.countTotal();
  const result = await productQuery.modelQuery;

  // Step 4: Add totalSales and totalSold to each product in the result
  const resultWithSalesAndSold = result.map((product) => {
    const productId = product._id.toString();
    const { totalSales = 0, totalSold = 0 } = productDataMap[productId] || {};
    return {
      ...product.toObject(),
      totalSales,
      totalSold,
    };
  });

  return {
    meta,
    result: resultWithSalesAndSold,
  };
};

const productServices = {
  createProductIntoDB,
  getAllProduct,
  getSingleProduct,
  updateProduct,
  deleteProductFromDB,
  changeProductStatus,
  getShopProducts,
  getMyProducts,
};

export default productServices;
