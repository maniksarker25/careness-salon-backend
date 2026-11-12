/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ownsBusinessHour } from '../bussinessHour/businessHour.utils';
import { IBlockHour } from './blockHour.interface';
import BlockHour from './blockHour.model';

const assertOwnsBlockTarget = async (
  shopId: string,
  entityType: IBlockHour['entityType'],
  entityId: IBlockHour['entityId'] | string,
) => {
  const ownsTarget = await ownsBusinessHour(entityType, entityId, shopId);
  if (!ownsTarget) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not allowed to change these blocked hours',
    );
  }
};

const addBlockHour = async (shopId: string, payload: IBlockHour) => {
  await assertOwnsBlockTarget(shopId, payload.entityType, payload.entityId);
  return BlockHour.create(payload);
};

const updateBusinessHour = async (
  shopId: string,
  id: string,
  payload: Partial<IBlockHour>,
) => {
  const blockHour = await BlockHour.findById(id);
  if (!blockHour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Block hour not found');
  }
  await assertOwnsBlockTarget(shopId, blockHour.entityType, blockHour.entityId);
  const { day: _day, entityId: _entityId, entityType: _entityType, ...updatedPayload } =
    payload;
  return BlockHour.findByIdAndUpdate(id, updatedPayload, {
    new: true,
    runValidators: true,
  });
};

const deleteBlockHour = async (shopId: string, id: string) => {
  const blockHour = await BlockHour.findById(id);
  if (!blockHour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Block hour not found');
  }
  await assertOwnsBlockTarget(shopId, blockHour.entityType, blockHour.entityId);
  return BlockHour.findByIdAndDelete(id);
};

const BlockHourService = {
    addBlockHour,
    updateBusinessHour,
    deleteBlockHour
}

export default BlockHourService;

