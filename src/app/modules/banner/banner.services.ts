import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { IAppBanner, IShopBanner } from './banner.interface';
import { AppBanner, ShopBanner } from './banner.model';

// shop banner ------------------------
const createShopBannerIntoDB = async (shopId: string, payload: IShopBanner) => {
  const result = await ShopBanner.create({ ...payload, shop: shopId });
  return result;
};

const getMyShopBanner = async (shopId: string) => {
  const result = await ShopBanner.find({ shop: shopId });
  return result;
};

const deleteMyShopBanner = async (shopId: string, bannerId: string) => {
  const shopBanner = await ShopBanner.findOne({ shop: shopId, _id: bannerId });
  if (!shopBanner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop banner not found');
  }
  const result = await ShopBanner.findOneAndDelete({
    shop: shopId,
    _id: bannerId,
  });

  return result;
};

const updateShopBanner = async (
  shopId: string,
  bannerId: string,
  payload: Partial<IShopBanner>,
) => {
  const shopBanner = await ShopBanner.findOne({ shop: shopId, _id: bannerId });
  if (!shopBanner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop banner not found');
  }
  const result = await ShopBanner.findOneAndUpdate(
    {
      shop: shopId,
      _id: bannerId,
    },
    payload,
    { new: true, runValidators: true },
  );
  return result;
};
// app banner ------------------------
const createAppBannerIntoDB = async (payload: IAppBanner) => {
  const result = await AppBanner.create(payload);
  return result;
};

const getAppBannerFromDB = async () => {
  const result = await AppBanner.find();
  return result;
};

const deleteAppBannerFromDB = async (bannerId: string) => {
  const shopBanner = await AppBanner.findById(bannerId);
  if (!shopBanner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Banner not found');
  }
  const result = await AppBanner.findByIdAndDelete(bannerId);

  return result;
};

const updateAppBannerIntoDB = async (
  bannerId: string,
  payload: Partial<IAppBanner>,
) => {
  const shopBanner = await AppBanner.findById(bannerId);
  if (!shopBanner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Banner not found');
  }
  const result = await AppBanner.findByIdAndUpdate(bannerId, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const bannerServices = {
  createShopBannerIntoDB,
  getMyShopBanner,
  deleteMyShopBanner,
  updateShopBanner,
  createAppBannerIntoDB,
  updateAppBannerIntoDB,
  getAppBannerFromDB,
  deleteAppBannerFromDB,
};

export default bannerServices;
