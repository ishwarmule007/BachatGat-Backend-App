const express = require("express");

const {
    getGroupMessages,
    clearChatForMe
} = require("../controllers/chatController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
/**
 * @swagger
 * /api/chat/groups/{groupCode}/messages:
 *   get:
 *     summary: Get all messages of a group chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "SBG-001"
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Messages fetched successfully"
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       groupId:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567891"
 *                       senderId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "665c1f9a2b7d8f1234567892"
 *                           fullName:
 *                             type: string
 *                             example: "Atharv Saraf"
 *                           mobileNumber:
 *                             type: string
 *                             example: "9876543210"
 *                           roleSelection:
 *                             type: string
 *                             example: "admin"
 *                       messageType:
 *                         type: string
 *                         example: "text"
 *                       message:
 *                         type: string
 *                         example: "Hello everyone"
 *                       isPinned:
 *                         type: boolean
 *                         example: false
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: You are not approved member of this group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Failed to fetch messages
 */
router.get(
    "/groups/:groupCode/messages",
    authMiddleware,
    getGroupMessages
);
/**
 * @swagger
 * /api/chat/socket-events:
 *   get:
 *     summary: Socket.IO chat events documentation
 *     description: |
 *       This route is only for documentation.
 *       It is not used in frontend API calls.
 *
 *       Socket Events
 *
 *       Emit Events:
 *
 *       1. joinGroup
 *       socket.emit("joinGroup", {
 *         groupCode
 *       });
 *
 *       2. sendMessage
 *
 *       2.1 For normal text message:
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         message,
 *         messageType
 *       });
 *
 *       Example:
 *       socket.emit("sendMessage", {
 *         groupCode: "AtharvS123",
 *         message: "hello",
 *         messageType: "text"
 *       });
 *
 *       2.2 For reply message:
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         message,
 *         messageType,
 *         replyTo
 *       });
 *
 *       Here replyTo means old messageId to which user is replying.
 *
 *       Example:
 *       socket.emit("sendMessage", {
 *         groupCode: "AtharvS123",
 *         message: "reply test",
 *         messageType: "text",
 *         replyTo: "MESSAGE_ID"
 *       });
 *
 *       2.3 For image message:
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         messageType: "image",
 *         mediaUrl,
 *         cloudinaryPublicId,
 *         mediaSize
 *       });
 *
 *       Example:
 *       socket.emit("sendMessage", {
 *         groupCode: "AtharvS123",
 *         messageType: "image",
 *         mediaUrl: "https://example.com/image.jpg",
 *         cloudinaryPublicId: "chat-media/image123",
 *         mediaSize: 900000
 *       });
 *
 *       Image max size allowed: 1 MB
 *
 *       2.4 For video message:
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         messageType: "video",
 *         mediaUrl,
 *         thumbnailUrl,
 *         cloudinaryPublicId,
 *         mediaSize,
 *         mediaDuration
 *       });
 *
 *       Example:
 *       socket.emit("sendMessage", {
 *         groupCode: "AtharvS123",
 *         messageType: "video",
 *         mediaUrl: "https://example.com/video.mp4",
 *         thumbnailUrl: "https://example.com/thumb.jpg",
 *         cloudinaryPublicId: "chat-media/video123",
 *         mediaSize: 8000000,
 *         mediaDuration: 25
 *       });
 *
 *       Video max size allowed: 10 MB
 *
 *       Uploaded image/video media automatically expires after 7 days.
 *       After expiry frontend should show:
 *       "This photo has expired"
 *       or
 *       "This video has expired"
 *
 *       3. deleteMessage
 *       socket.emit("deleteMessage", {
 *         messageId
 *       });
 *
 *       4. pinMessage
 *       socket.emit("pinMessage", {
 *         messageId
 *       });
 *
 *       5. unpinMessage
 *       socket.emit("unpinMessage", {
 *         messageId
 *       });
 *
 *       6. reactMessage
 *       socket.emit("reactMessage", {
 *         messageId,
 *         emoji
 *       });
 *
 *       Example:
 *       socket.emit("reactMessage", {
 *         messageId,
 *         emoji: "🔥"
 *       });
 *
 *       7. removeReaction
 *       socket.emit("removeReaction", {
 *         messageId
 *       });
 *
 *       8. starMessage
 *       socket.emit("starMessage", {
 *         messageId
 *       });
 *
 *       9. unstarMessage
 *       socket.emit("unstarMessage", {
 *         messageId
 *       });
 *
 *       Listen Events:
 *
 *       1. joinedGroup
 *
 *       2. receiveMessage
 *
 *       3. messageDeleted
 *
 *       4. messagePinned
 *
 *       5. messageUnpinned
 *
 *       6. errorMessage
 *
 *       7. messageReacted
 *
 *       8. messageReactionRemoved
 *
 *       9. messageStarred
 *
 *       10. messageUnstarred
 *     tags:
 *       - Socket Events
 *     responses:
 *       200:
 *         description: Socket.IO event documentation
 */
router.get("/socket_events_documentation", (req, res) => {
    res.status(200).json({
        message: "socket event documentation"
    });
});

/**
 * @swagger
 * /api/chat/groups/{groupCode}/clear-chat:
 *   delete:
 *     summary: Clear group chat for current user
 *     description: |
 *       This API clears the group chat only for the logged in user.
 *       Messages are not deleted from database.
 *       Other group members will still see old messages.
 *       After clearing, user will only receive new messages sent after clear time.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Group code of the chat
 *     responses:
 *       200:
 *         description: Chat cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat cleared for you successfully
 *                 groupCode:
 *                   type: string
 *                   example: Atharv-01
 *                 groupId:
 *                   type: string
 *                   example: 6a044f5869932cd638df0f73
 *                 clearedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-05-20T10:30:00.000Z
 *
 *       403:
 *         description: User is not approved member
 *
 *       404:
 *         description: Group not found
 *
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/groups/:groupCode/clear-chat",
    authMiddleware,
    clearChatForMe
);
module.exports = router;