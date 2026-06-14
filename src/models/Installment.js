const mongoose = require("mongoose");

const installmentSchema =
    new mongoose.Schema({

        loanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Loan",
            required: true
        },

        installmentNumber: {
            type: Number,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        dueDate: {
            type: Date,
            required: true
        },

        paidDate: {
            type: Date
        },

        penaltyAmount: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "PAID",
                "OVERDUE"
            ],
            default: "PENDING"
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.models.Installment ||
    mongoose.model(
        "Installment",
        installmentSchema
    );