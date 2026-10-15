import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ICategory, ISubCategory } from './category.interface';
import Category, { SubCategory } from './category.model';
import mongoose from 'mongoose';
import Service from '../service/service.model';

const createCategoryIntoDB = async (shopId: string, payload: ICategory) => {
  const result = await Category.create({ ...payload, shop: shopId });
  return result;
};

const updateCategoryIntoDB = async (
  shopId: string,
  id: string,
  payload: Partial<ICategory>,
) => {
  const result = await Category.findOneAndUpdate(
    { _id: id, shop: shopId },
    payload,
    { new: true, runValidators: true },
  );
  return result;
};

const getAllCategories = async () => {
  const result = await Category.find();
  return result;
};
const getSpecificShopCategories = async (shopId: string) => {
  const result = await Category.find({ shop: shopId });
  return result;
};

const getMyCategories = async (profileId: string) => {
  const categories = await Category.aggregate([
    {
      $match: { shop: profileId },
    },
    {
      $lookup: {
        from: 'subcategories',
        localField: '_id',
        foreignField: 'category',
        as: 'subCategories',
      },
    },
    {
      $addFields: {
        totalSubCategories: { $size: '$subCategories' },
      },
    },
    {
      $project: {
        subCategories: 0,
      },
    },
  ]);

  return categories;
};

// delete category
const deleteCategoryFromDB = async (profileId: string, categoryId: string) => {
  const category = await Category.findOne({ shop: profileId, _id: categoryId });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedCategory = await Category.findOneAndDelete(
      { _id: categoryId, shop: profileId },
      { session },
    );

    if (!deletedCategory) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Category not found or does not belong to this shop',
      );
    }

    await Service.deleteMany({ category: categoryId }, { session });

    await session.commitTransaction();
    session.endSession();

    return deletedCategory;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof mongoose.Error) {
      throw new AppError(500, `Mongoose Error: ${error.message}`);
    }
  }
};

// sub category -----------------------------------------------------------

const createSubCategoryIntoDB = async (
  shopId: string,
  payload: ISubCategory,
) => {
  const category = await Category.findById(payload.category);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }
  const result = await SubCategory.create({ ...payload, shop: shopId });
  return result;
};

const updateSubCategoryIntoDB = async (
  shopId: string,
  id: string,
  payload: Partial<ISubCategory>,
) => {
  if (payload?.category) {
    const category = await Category.findById(payload.category);
    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }
  const result = await SubCategory.findOneAndUpdate(
    { _id: id, shop: shopId },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );
  return result;
};

const getMySubCategoriesFromDB = async (profileId: string) => {
  const result = await SubCategory.find({ shop: profileId }).populate(
    'category',
  );
  return result;
};

const deleteSubCategoryFromDB = async (shopId: string, id: string) => {
  const result = await SubCategory.findOneAndDelete({ _id: id, shop: shopId });
  return result;
};

const categoryService = {
  createCategoryIntoDB,
  updateCategoryIntoDB,
  getAllCategories,
  getSpecificShopCategories,
  createSubCategoryIntoDB,
  updateSubCategoryIntoDB,
  getMyCategories,
  deleteCategoryFromDB,
  getMySubCategoriesFromDB,
  deleteSubCategoryFromDB,
};

export default categoryService;
