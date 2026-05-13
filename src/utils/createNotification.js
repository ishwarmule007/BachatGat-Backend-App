const Notification = require("../models/notification");

const createNotification = async({
    userId,
    groupId,
    title,
    message,
    type
}) => {
    return await Notification.create({
        userId,
        groupId,
        title,
        message,
        type
    });
};

const createManyNotifications = async(notifications) => {
    return await Notification.insertMany(notifications);
};

module.exports = {
    createNotification,
    createManyNotifications
};