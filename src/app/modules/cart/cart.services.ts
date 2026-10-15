/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import Cart from './cart.model';
import { Product } from '../product/product.model';

interface addToCartProps {
  costumerId: string;
  shopId: string;
  productId: any;
  price: number;
}

const addToCart = async ({ costumerId, shopId, productId }: addToCartProps) => {
  let cart = await Cart.findOne({ customer: costumerId });

  if (cart) {
    if (cart?.shop?.toString() !== shopId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You already add item in cart for a different shop , you need to order those or clear cart then you can add to cart for this item',
      );
    }
  }

  if (!cart) {
    cart = new Cart({
      customer: costumerId,
      shop: shopId,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    const product = await Product.findById(productId).select('price');
    // Add new item to the cart
    cart.items.push({
      product: productId,
      quantity: 1,
      price: product?.price as number,
    });
  }

  await cart.save();
  return cart;
};

// remove cart item

export const removeCartItem = async (customerId: string, productId: string) => {
  const cart = await Cart.findOne({ customer: customerId });

  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  );

  await cart.save();
  return cart;
};

// view cart

const viewCart = async (costumerId: string) => {
  const cart = await Cart.findOne({ customer: costumerId }).populate(
    'items.product',
    'name quantity price images',
  );

  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  return cart;
};

// increase quantity

const increaseCartItemQuantity = async (
  customerId: string,
  productId: string,
) => {
  const cart = await Cart.findOne({ customer: customerId });

  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Item not found');
  }

  item.quantity += 1;

  await cart.save();
  return cart;
};

// decrease quantity---------------

export const decreaseCartItemQuantity = async (
  customerId: string,
  productId: string,
) => {
  const cart = await Cart.findOne({ customer: customerId });

  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Item not found');
  }

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Quantity cannot be less than 1',
    );
  }

  await cart.save();
  return cart;
};

const clearCartFromDB = async (customerId: string) => {
  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, "You don't have any cart");
  }
  const result = await Cart.findOneAndDelete({ customer: customerId });

  return result;
};

const cartServices = {
  addToCart,
  removeCartItem,
  viewCart,
  increaseCartItemQuantity,
  decreaseCartItemQuantity,
  clearCartFromDB,
};

export default cartServices;
