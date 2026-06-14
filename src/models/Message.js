const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    messageType: {
        type: String,
        enum: ["text", "image", "video", "audio"],
        default: "text"
    },

    message: {
        type: String,
        required: true
    },

    isDeleted: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },

    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    pinnedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        emoji: {
            type: String,
            required: true
        },
        reactedAt: {
            type: Date,
            default: Date.now
        }
    }],
    starredBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        starredAt: {
            type: Date,
            default: Date.now
        }
    }],
    mediaUrl: {
        type: String,
        default: ""
    },

    thumbnailUrl: {
        type: String,
        default: ""
    },

    cloudinaryPublicId: {
        type: String,
        default: ""
    },
    audioDuration: {
        type: Number,
        default: 0
    },
    mediaSize: {
        type: Number,
        default: 0
    },

    mediaDuration: {
        type: Number,
        default: 0
    },

    mediaExpiresAt: {
        type: Date,
        default: null
    },

    mediaExpiredAt: {
        type: Date,
        default: null
    },

    isMediaExpired: {
        type: Boolean,
        default: false
    },
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports =
    mongoose.models.Message || mongoose.model("Message", messageSchema);