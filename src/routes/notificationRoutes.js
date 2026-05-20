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
 * /api/notifications/:
 *   get:
 *     summary: Get all notifications of logged in user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notifications fetched successfully"
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       title:
 *                         type: string
 *                         example: "Payment accepted"
 *                       message:
 *                         type: string
 *                         example: "Your payment of ₹500 has been accepted"
 *                       type:
 *                         type: string
 *                         example: "payment_accepted"
 *                       isRead:
 *                         type: boolean
 *                         example: false
 *                       groupId:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           groupName:
 *                             type: string
 *                             example: "Shivaji Group"
 *                           groupCode:
 *                             type: string
 *                             example: "SBG-001"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Failed to fetch notifications
 */
router.get("/", authMiddleware, getMyNotifications);

/**
 * @swagger
 * /api/notifications/mark-read/{notificationId}:
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
 * /api/notifications/mark-all-read:
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