const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            "meeting",
            "payment_reminder",
            "general"
        ],
        default: "general"
    },

    meetingDate: Date,

    reminderDate: Date,

    isPinned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model(
    "Announcement",
    announcementSchema
);