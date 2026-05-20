const express = require("express");

const {
    getGroupMessages
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
 *       2.1 For normal message:
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         message,
 *         messageType
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
 *       7. removeReaction
 *       socket.emit("removeReaction", {
 *         messageId
 *       });
 *
 *       Listen Events:
 *
 *       1. joinedGroup
 *       2. receiveMessage
 *       3. messageDeleted
 *       4. messagePinned
 *       5. messageUnpinned
 *       6. errorMessage
 *       7. messageReacted
 *       8. messageReactionRemoved
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

module.exports = router;