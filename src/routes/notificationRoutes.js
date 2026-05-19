const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notificationController");

/**
 * @swagger
 * /api/notification:
 *   get:
 *     summary: Get all notifications of logged in user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Failed to fetch notifications
 */
router.get("/", authMiddleware, getMyNotifications);

/**
 * @swagger
 * /api/notification/mark-read/{notificationId}:
 *   patch:
 *     summary: Mark single notification as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Failed to update notification
 */
router.patch(
    "/mark-read/:notificationId",
    authMiddleware,
    markNotificationAsRead
);

/**
 * @swagger
 * /api/notification/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Failed to update notifications
 */
router.patch(
    "/mark-all-read",
    authMiddleware,
    markAllNotificationsAsRead
);

module.exports = router;