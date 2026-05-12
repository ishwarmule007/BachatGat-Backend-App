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
exports.getMemberPaymentPage = async(req, res) => {
        try {
            const userId = req.user._id;
            const { groupCode } = req.params;

            const group = await Group.findOne({ groupCode }).populate(
                "adminId",
                "fullName mobileNumber upiId bankAccountDetails"
            );

            if (!group) {
                return res.status(404).json({ message: "Group not found" });
            }

            const member = group.members.find(
                (m) => m.userId.toString() === userId.toString()
            );

            if (!member) {
                return res.status(403).json({
                    message: "You are not a member of this group",
                });
            }

            if (member.status !== "approved") {
                return res.status(403).json({
                    message: "Your group membership is not approved yet",
                });
            }

            const amount = member.monthlyContribution || 0;

            if (!group.adminId.upiId) {
                return res.status(400).json({
                    message: "Admin has not added UPI ID yet",
                });
            }

            const upiLink = `upi://pay?pa=${group.adminId.upiId}&pn=${encodeURIComponent(
            group.adminId.fullName
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
            `Monthly contribution for ${group.groupName}`
        )}`;

        res.status(200).json({
            success: true,
            message: "Member payment page fetched successfully",
            paymentPage: {
                group: {
                    groupId: group._id,
                    groupName: group.groupName,
                    groupCode: group.groupCode,
                },
                amount,
                ownerAccount: {
                    adminName: group.adminId.fullName,
                    mobileNumber: group.adminId.mobileNumber,
                    upiId: group.adminId.upiId,
                    bankAccountDetails: group.adminId.bankAccountDetails,
                },
                upiLink,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};