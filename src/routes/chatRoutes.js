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

module.exports = router;