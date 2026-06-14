const mongoose = require("mongoose");

const loanRequestSchema =
    new mongoose.Schema({

        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true
        },

        requestedAmount: {
            type: Number,
            required: true
        },

        requestedDurationMonths: {
            type: Number,
            required: true
        },

        purpose: {
            type: String,
            default: ""
        },

        repaymentType: {
            type: String,
            enum: [
                "INSTALLMENT",
                "INTEREST_ONLY"
            ],
            required: true
        },

        requestStatus: {
            type: String,
            enum: [
                "PENDING",
                "PROPOSAL_SENT",
                "ACCEPTED",
                "REJECTED",
                "CANCELLED",
                "FINALIZED"
            ],
            default: "PENDING"
        },

        adminProposal: {

            approvedAmount: {
                type: Number
            },

            repaymentType: {
                type: String,
                enum: [
                    "INSTALLMENT",
                    "INTEREST_ONLY"
                ]
            },

            months: {
                type: Number
            },

            proposalMessage: {
                type: String
            },

            proposedAt: {
                type: Date
            }
        },

        memberResponseAt: {
            type: Date
        },

        rejectionReason: {
            type: String,
            default: ""
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.models.LoanRequest ||
    mongoose.model(
        "LoanRequest",
        loanRequestSchema
    );