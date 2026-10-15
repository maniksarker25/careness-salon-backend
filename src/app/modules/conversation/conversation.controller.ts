import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import ConversationService from './conversation.service';

const getChatList = catchAsync(async (req, res) => {
  const result = await ConversationService.getConversation(
    String(req.user.profileId),
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversation retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const ConversationController = { getChatList };

export default ConversationController;
