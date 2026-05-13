const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getMyNotifications);

router.patch(
    "/mark-read/:notificationId",
    authMiddleware,
    markNotificationAsRead
);

router.patch(
    "/mark-all-read",
    authMiddleware,
    markAllNotificationsAsRead
);

module.exports = router;