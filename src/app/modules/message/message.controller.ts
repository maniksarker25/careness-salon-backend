import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import MessageService from './message.service';

const getMessages = catchAsync(async (req, res) => {
  const result = await MessageService.getMessagesByConversationId(
    String(req.user.profileId),
    req.params.id,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message retrieved successfully',
    meta: result.meta,
    data: {
      conversationId: result.conversationId,
      userData: result.userData,
      messages: result.result,
    },
  });
});

const getMessagesWithUser = catchAsync(async (req, res) => {
  const result = await MessageService.getMessagesWithUser(
    String(req.user.profileId),
    req.user.role,
    req.params.otherProfileId,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.conversationId
      ? 'Message retrieved successfully'
      : 'No previous messages with this user',
    meta: result.meta,
    data: {
      conversationId: result.conversationId,
      userData: result.userData,
      messages: result.result,
    },
  });
});

const MessageController = { getMessages, getMessagesWithUser };

export default MessageController;
