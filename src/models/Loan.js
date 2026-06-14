const mongoose = require("mongoose");

const loanSchema =
    new mongoose.Schema({

        loanNumber: {
            type: String,
            unique: true
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

        loanRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LoanRequest"
        },

        loanAmount: {
            type: Number,
            required: true
        },

        repaymentType: {
            type: String,
            enum: [
                "INSTALLMENT",
                "INTEREST_ONLY"
            ],
            required: true
        },

        interestPercent: {
            type: Number,
            required: true
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
            required: true
        },

        monthlyEMI: {
            type: Number,
            required: true
        },

        penaltyPerDay: {
            type: Number,
            default: 0
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

        loanStartDate: {
            type: Date,
            required: true
        },

        loanEndDate: {
            type: Date,
            required: true
        },

        loanStatus: {
            type: String,
            enum: [
                "ACTIVE",
                "COMPLETED",
                "OVERDUE"
            ],
            default: "ACTIVE"
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.models.Loan ||
    mongoose.model(
        "Loan",
        loanSchema
    );