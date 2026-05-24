const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const authMiddleware = require("../middlewares/authMiddleware");
const {
    getGroupMessages,
    clearChatForMe,
    uploadChatMedia,
    uploadAudio
} = require("../controllers/chatController");
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
 * /api/chat/socket_events_documentation:
 *   get:
 *     summary: Socket.IO chat events documentation
 *     description: |
 *       This route is only for Socket.IO event documentation.
 *       Frontend should not call this API in actual chat flow.
 *
 *       -----------------------------------
 *       SOCKET EMIT EVENTS
 *       -----------------------------------
 *
 *       1. joinGroup
 *
 *       socket.emit("joinGroup", {
 *         groupCode
 *       });
 *
 *       -----------------------------------
 *
 *       2. sendMessage
 *
 *       2.1 Normal Text Message
 *
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         message,
 *         messageType
 *       });
 *
 *       Example:
 *
 *       {
 *         "groupCode": "SBG-001",
 *         "message": "Hello",
 *         "messageType": "text"
 *       }
 *
 *       -----------------------------------
 *
 *       2.2 Reply Message
 *
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         message,
 *         messageType,
 *         replyTo
 *       });
 *
 *       replyTo = old messageId
 *
 *       -----------------------------------
 *
 *       2.3 Image Message
 *
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         messageType,
 *         mediaUrl,
 *         cloudinaryPublicId,
 *         mediaSize
 *       });
 *
 *       Example:
 *
 *       {
 *         "groupCode": "SBG-001",
 *         "messageType": "image",
 *         "mediaUrl": "https://cloudinary-url",
 *         "cloudinaryPublicId": "chat/images/abc123",
 *         "mediaSize": 500000
 *       }
 *
 *       Image max size = 1 MB
 *
 *       Images expire after 7 days.
 *
 *       -----------------------------------
 *
 *       2.4 Video Message
 *
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         messageType,
 *         mediaUrl,
 *         thumbnailUrl,
 *         cloudinaryPublicId,
 *         mediaSize,
 *         mediaDuration
 *       });
 *
 *       Example:
 *
 *       {
 *         "groupCode": "SBG-001",
 *         "messageType": "video",
 *         "mediaUrl": "https://cloudinary-video-url",
 *         "thumbnailUrl": "https://thumbnail-url",
 *         "cloudinaryPublicId": "chat/videos/abc123",
 *         "mediaSize": 5000000,
 *         "mediaDuration": 25
 *       }
 *
 *       Video max size = 10 MB
 *
 *       Videos expire after 7 days.
 *
 *       -----------------------------------
 *
 *       2.5 Voice Note / Audio Message
 *
 *       socket.emit("sendMessage", {
 *         groupCode,
 *         messageType,
 *         mediaUrl,
 *         cloudinaryPublicId,
 *         mediaSize,
 *         audioDuration
 *       });
 *
 *       Example:
 *
 *       {
 *         "groupCode": "SBG-001",
 *         "messageType": "audio",
 *         "mediaUrl": "https://cloudinary-audio-url",
 *         "cloudinaryPublicId": "chat/audio/abc123",
 *         "mediaSize": 300000,
 *         "audioDuration": 18
 *       }
 *
 *       Audio max size = 2 MB
 *
 *       Audio expires after 7 days.
 *
 *       Audio should be uploaded in Cloudinary using:
 *
 *       resource_type = "video"
 *
 *       -----------------------------------
 *
 *       3. deleteMessage
 *
 *       socket.emit("deleteMessage", {
 *         messageId
 *       });
 *
 *       -----------------------------------
 *
 *       4. pinMessage
 *
 *       socket.emit("pinMessage", {
 *         messageId
 *       });
 *
 *       -----------------------------------
 *
 *       5. unpinMessage
 *
 *       socket.emit("unpinMessage", {
 *         messageId
 *       });
 *
 *       -----------------------------------
 *
 *       6. reactMessage
 *
 *       socket.emit("reactMessage", {
 *         messageId,
 *         emoji
 *       });
 *
 *       -----------------------------------
 *
 *       7. removeReaction
 *
 *       socket.emit("removeReaction", {
 *         messageId
 *       });
 *
 *       -----------------------------------
 *
 *       8. starMessage
 *
 *       socket.emit("starMessage", {
 *         messageId
 *       });
 *
 *       -----------------------------------
 *
 *       9. unstarMessage
 *
 *       socket.emit("unstarMessage", {
 *         messageId
 *       });
 *
 *       -----------------------------------
 *       SOCKET LISTEN EVENTS
 *       -----------------------------------
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
 * 
 *     tags:
 *       - Socket Events
 *
 *     responses:
 *       200:
 *         description: Socket.IO events documentation fetched successfully
 */
router.get("/socket_events_documentation", (req, res) => {
    res.status(200).json({
        message: "Socket.IO events documentation fetched successfully",
        documentation: "Check the API description for details"
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
/**
 * @swagger
 * /api/chat/upload-media:
 *   post:
 *     summary: Upload chat image or video
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Media uploaded successfully
 *                 mediaUrl:
 *                   type: string
 *                 cloudinaryPublicId:
 *                   type: string
 *                 mediaSize:
 *                   type: number
 *                 messageType:
 *                   type: string
 *                   example: image
 */
router.post(
    "/upload-media",
    authMiddleware,
    upload.single("media"),
    uploadChatMedia
);
/**
 * @swagger
 * /api/chat/upload-audio:
 *   post:
 *     summary: Upload voice note/audio for chat
 *     description: |
 *       Upload audio file to Cloudinary.
 *       Returned mediaUrl should be used in sendMessage socket event.
 *
 *       Supported formats:
 *       - mp3
 *       - wav
 *       - m4a
 *       - ogg
 *
 *       Maximum audio size:
 *       - 2 MB
 *
 *       Audio files expire after 7 days from chat automatically.
 *
 *     tags:
 *       - Chat Media Upload
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - media
 *             properties:
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: Audio file
 *
 *     responses:
 *       200:
 *         description: Audio uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Audio uploaded successfully
 *
 *                 mediaUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/video/upload/audio.mp3
 *
 *                 cloudinaryPublicId:
 *                   type: string
 *                   example: chat/audio/abc123
 *
 *                 mediaSize:
 *                   type: number
 *                   example: 300000
 *
 *                 audioDuration:
 *                   type: number
 *                   example: 18
 *
 *       400:
 *         description: Invalid audio file
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Failed to upload audio
 */
router.post(
    "/upload-audio",
    authMiddleware,
    upload.single("media"),
    uploadAudio
);
module.exports = router;