const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
    loanNumber: {
        type: String,
        unique: true,
        required: true
    },

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    loanAmount: {
        type: Number,
        required: true,
        min: 1
    },

    purpose: {
        type: String,
        trim: true,
        default: ""
    },

    interestPercent: {
        type: Number,
        required: true,
        min: 0
    },

    interestAmount: {
        type: Number,
        required: true
    },

    totalAmount: {
        type: Number,
        required: true
    },

    months: {
        type: Number,
        required: true,
        min: 1
    },

    monthlyEMI: {
        type: Number,
        required: true
    },

    penaltyPerDay: {
        type: Number,
        default: 0
    },

    loanStartDate: {
        type: Date,
        required: true
    },

    loanEndDate: {
        type: Date,
        required: true
    },

    paidAmount: {
        type: Number,
        default: 0
    },

    remainingAmount: {
        type: Number,
        required: true
    },

    paidInstallments: {
        type: Number,
        default: 0
    },

    remainingInstallments: {
        type: Number,
        required: true
    },

    loanStatus: {
        type: String,
        enum: [
            "ACTIVE",
            "OVERDUE",
            "PAID"
        ],
        default: "ACTIVE"
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

module.exports =
    mongoose.models.Loan ||
    mongoose.model("Loan", loanSchema);