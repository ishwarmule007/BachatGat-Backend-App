const PaymentRequest = require("../models/PaymentRequest");
const Contribution = require("../models/contribution");

exports.updatePaymentRequestStatus = async(req, res) => {
    try {
        const { paymentRequestId, status } = req.body;

        if (!paymentRequestId || !status) {
            return res.status(400).json({
                message: "paymentRequestId and status are required",
            });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be accepted or rejected",
            });
        }

        const paymentRequest = await PaymentRequest.findById(paymentRequestId);

        if (!paymentRequest) {
            return res.status(404).json({
                message: "Payment request not found",
            });
        }

        if (paymentRequest.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to manage this payment request",
            });
        }

        if (paymentRequest.status !== "pending") {
            return res.status(400).json({
                message: "Payment request is already processed",
            });
        }

        paymentRequest.status = status;

        if (status === "accepted") {
            paymentRequest.acceptedAt = new Date();

            await Contribution.create({
                userId: paymentRequest.userId,
                groupId: paymentRequest.groupId,
                amount: paymentRequest.amount,
                month: paymentRequest.month,
                status: "paid",
                paymentRequestId: paymentRequest._id,
            });
        }

        if (status === "rejected") {
            paymentRequest.rejectedAt = new Date();
        }

        await paymentRequest.save();

        res.status(200).json({
            message: `Payment request ${status} successfully`,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};