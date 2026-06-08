const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
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

            // Member related
            "member_added",
            "member_request",
            "member_approved",
            "member_rejected",
            "announcement",
            "invite_rejected",
            "member_joined",

            // Payment related
            "payment_request_received",
            "payment_request_sent",
            "payment_accepted",
            "payment_rejected",

            // Loan related
            "loan_request_sent",
            "loan_proposal_sent",
            "loan_proposal_rejected_by_admin",
            "loan_proposal_accepted_by_member",
            "loan_proposal_rejected_by_member",
            "loan_created",
            "loan_approved_for_member"

        ],
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);