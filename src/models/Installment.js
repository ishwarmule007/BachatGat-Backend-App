const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema({
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
    },

    paymentRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentRequest"
    },

    remarks: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

installmentSchema.index({
    loanId: 1,
    installmentNumber: 1
}, {
    unique: true
});

module.exports =
    mongoose.models.Installment ||
    mongoose.model("Installment", installmentSchema);