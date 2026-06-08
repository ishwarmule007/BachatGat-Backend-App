const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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
    amount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    upiId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    screenshotUrl: {
        type: String,
        required: true,
    },

    extractedInfo: {
        extractedAmount: Number,
        transactionId: String,
        paidTo: String,
        paidFrom: String,
        transactionDate: Date,
    },
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: {
        type: String
    },
    resubmittedAt: {
        type: Date
    },

    resubmissionCount: {
        type: Number,
        default: 0
    },
    additionalComments: {
        type: String,
        default: ""
    },
    contributionAmount: {
        type: Number,
        default: 0
    },

    loanAmount: {
        type: Number,
        default: 0
    },
}, { timestamps: true });
module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);