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
    groupStatus: {
        type: String,
        enum: ["active", "closed"],
        default: "active"
    },
    presidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    secretaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    treasurerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
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
            enum: ["president", "secretary", "treasurer", "member"],
            default: "member"
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "removed"
            ],
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
        removedAt: {
            type: Date,
            default: null
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);