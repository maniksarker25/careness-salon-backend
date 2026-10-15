/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';

const uploadImages = catchAsync(async (req, res) => {
  const { files } = req;
  // Check if files and store_image exist, and process multiple images
  let images;
  if (files && typeof files === 'object' && 'chat_images' in files) {
    images = files['chat_images'].map((file) => file.path);
  }
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shop category created successfully',
    data: images,
  });
});

const FileUploadController = {
  uploadImages,
};

export default FileUploadController;
