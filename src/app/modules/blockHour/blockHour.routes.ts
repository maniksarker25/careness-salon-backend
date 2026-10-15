import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";
import validateRequest from "../../middlewares/validateRequest";
import blockHourValidations from "./blockHour.validation";
import BlockHourController from "./blockHour.controller";

const router = express.Router();

router.post("/add-block-hour",auth(USER_ROLE.client),validateRequest(blockHourValidations.createBlockHourValidationSchema),BlockHourController.addBlockHour);
router.patch(
    '/update-block-hour/:id',
    auth(USER_ROLE.client),
    validateRequest(blockHourValidations.updateBlockHourSchema),
    BlockHourController.updateBlockHour,
  );

router.delete("/delete-block-hour/:id",auth(USER_ROLE.client),BlockHourController.deleteBlockHour);
export const blockHourRoutes = router