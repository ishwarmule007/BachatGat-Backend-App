const mongoose = require('mongoose');
const { off } = require('node:cluster');
const { type } = require('node:os');
const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        unique: true,
    },
    groupCode: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    village: String,
    taluka: String,
    district: String,
    state: String,
    formationDate: Date,
    location: {
        address: {
            type: String
        },

        latitude: {
            type: Number
        },

        longitude: {
            type: Number
        }
    },
    durationOfGroup: {
        type: Number,
        default: 0
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        monthlyContribution: {
            type: Number,
            default: 0,
            min: 0
        },

        roleInGroup: {
            type: String,
            enum: ["admin", "member"],
            default: "member"
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        note: {
            type: String,
            default: ""
        },

        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastSeenMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        unreadCount: {
            type: Number,
            default: 0
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);