import httpStatus from 'http-status';
import AppError from '../../error/appError';
import ProductBookmark from './product.bookmark.model';
import { Product } from '../product/product.model';

// const createBookmarkIntoDB = async (productId: string, customerId: string) => {
//   const result = await ProductBookmark.create({
//     product: productId,
//     costumer: customerId,
//   });
//   return result;
// };

const productBookmarkAddDelete = async (
  profileId: string,
  productId: string,
) => {
  // check if article exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }
  const bookmark = await ProductBookmark.findOne({
    costumer: profileId,
    product: productId,
  });
  if (bookmark) {
    await ProductBookmark.findOneAndDelete({
      costumer: profileId,
      product: productId,
    });
    return null;
  } else {
    const result = await ProductBookmark.create({
      costumer: profileId,
      product: productId,
    });
    return result;
  }
};

// get bookmark from db
const getMyBookmarkFromDB = async (costumerId: string) => {
  const result = await ProductBookmark.find({ costumer: costumerId });
  return result;
};

// delete bookmark
const deleteBookmarkFromDB = async (id: string, costumerId: string) => {
  const bookmark = await ProductBookmark.findOne({
    _id: id,
    costumer: costumerId,
  });

  if (!bookmark) {
    throw new AppError(httpStatus.NOT_FOUND, 'This bookmark does not exists');
  }
  const result = await ProductBookmark.findOneAndDelete({
    _id: id,
    costumer: costumerId,
  });
  return result;
};
const productBookmarkServices = {
  // createBookmarkIntoDB,
  productBookmarkAddDelete,
  getMyBookmarkFromDB,
  deleteBookmarkFromDB,
};

export default productBookmarkServices;
