// cart.model.ts
import { model, Schema } from 'mongoose';
import { ICart } from './cart.interface';
import { deliveryFee } from './cart.constaint';

const CartSchema = new Schema<ICart>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    shop: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Admin',
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalQuantity: {
      type: Number,
      default: 0,
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to calculate totalQuantity and totalPrice
CartSchema.pre<ICart>('save', function (next) {
  this.totalQuantity = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.subTotal = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  this.deliveryFee = deliveryFee;
  this.totalPrice = Number((this.subTotal + deliveryFee).toFixed(2));
  next();
});

const Cart = model<ICart>('Cart', CartSchema);
export default Cart;
