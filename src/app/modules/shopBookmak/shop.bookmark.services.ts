import httpStatus from 'http-status';
import AppError from '../../error/appError';
import ShopBookmark from './shop.bookmark.model';
import Client from '../client/client.model';
import Discount from '../discount/discount.model';

const shopBookmarkAddAndDelete = async (profileId: string, shopId: string) => {
  // check if article exists
  const shop = await Client.findById(shopId);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  const bookmark = await ShopBookmark.findOne({
    costumer: profileId,
    shop: shopId,
  });
  if (bookmark) {
    await ShopBookmark.findOneAndDelete({
      costumer: profileId,
      shop: shopId,
    });
    return null;
  } else {
    const result = await ShopBookmark.create({
      costumer: profileId,
      shop: shopId,
    });
    return result;
  }
};

// get bookmark from db
// const getMyBookmarkFromDB = async (costumerId: string) => {
//   const result = await ShopBookmark.find({ costumer: costumerId }).populate({
//     path: 'shop',
//     select: 'shopName shopImages totalRatingCount totalRating location',
//   });
//   console.log('result', result);
//   const currentDate = new Date();
//   const discount = await Discount.findOne({
//     shop: result?.shop?._id,
//     discountEndDate: { $gt: currentDate },
//   });
//   console.log('discound', discount);
//   const updatedResult = {
//     ...result.toObject(),
//     discountParcentage: discount?.discountPercentage || 0,
//   };
//   return updatedResult;
// };
const getMyBookmarkFromDB = async (costumerId: string) => {
  const results = await ShopBookmark.find({ costumer: costumerId }).populate({
    path: 'shop',
    select: 'shopName shopImages totalRatingCount totalRating location',
  });
  const currentDate = new Date();

  const updatedResults = await Promise.all(
    results.map(async (bookmark) => {
      const discount = await Discount.findOne({
        shop: bookmark.shop._id,
        discountEndDate: { $gt: currentDate },
      });

      return {
        ...bookmark.toObject(),
        discountPercentage: discount?.discountPercentage || 0,
      };
    }),
  );

  return updatedResults;
};

// delete bookmark
const deleteBookmarkFromDB = async (id: string, costumerId: string) => {
  const bookmark = await ShopBookmark.findOne({
    _id: id,
    costumer: costumerId,
  });

  if (!bookmark) {
    throw new AppError(httpStatus.NOT_FOUND, 'This bookmark does not exists');
  }
  const result = await ShopBookmark.findOneAndDelete({
    _id: id,
    costumer: costumerId,
  });
  return result;
};
const shopBookmarkServices = {
  // createBookmarkIntoDB,
  shopBookmarkAddAndDelete,
  getMyBookmarkFromDB,
  deleteBookmarkFromDB,
};

export default shopBookmarkServices;
