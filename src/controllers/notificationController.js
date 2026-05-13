const Notification = require("../models/notification");

const getMyNotifications = async(req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ userId })
            .populate("groupId", "groupName groupCode")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Notifications fetched successfully",
            notifications
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

const markNotificationAsRead = async(req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate({
            _id: notificationId,
            userId
        }, {
            isRead: true
        }, {
            new: true
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update notification",
            error: error.message
        });
    }
};

const markAllNotificationsAsRead = async(req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany({
            userId,
            isRead: false
        }, {
            isRead: true
        });

        res.status(200).json({
            message: "All notifications marked as read"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update notifications",
            error: error.message
        });
    }
};

module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};