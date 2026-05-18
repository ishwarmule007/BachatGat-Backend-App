const PaymentRequest = require("../models/PaymentRequest");
const Contribution = require("../models/contribution");
const Group = require("../models/Group");
const User = require("../models/User");
const { createNotification } = require("../utils/createNotification");
exports.updatePaymentRequestStatus = async(req, res) => {
    try {
        const { paymentRequestId, status, rejectionReason } = req.body;

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

        if (status === "rejected" && !rejectionReason) {
            return res.status(400).json({
                message: "rejectionReason is required when rejecting payment",
            });
        }

        const paymentRequest = await PaymentRequest.findById(paymentRequestId)
            .populate("userId", "fullName mobileNumber")
            .populate("groupId", "groupName groupCode");

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

            const existingContribution = await Contribution.findOne({
                userId: paymentRequest.userId._id,
                groupId: paymentRequest.groupId._id,
                month: paymentRequest.month,
            });

            if (existingContribution) {
                return res.status(400).json({
                    message: "Contribution already exists for this month",
                });
            }

            await Contribution.create({
                userId: paymentRequest.userId._id,
                groupId: paymentRequest.groupId._id,
                amount: paymentRequest.amount,
                month: paymentRequest.month,
                status: "paid",
                paymentRequestId: paymentRequest._id,
            });

            await createNotification({
                userId: paymentRequest.userId._id,
                groupId: paymentRequest.groupId._id,
                title: "Payment accepted",
                message: `Your payment of ₹${paymentRequest.amount} for ${paymentRequest.month} has been accepted`,
                type: "payment_accepted",
            });
        }

        if (status === "rejected") {
            paymentRequest.rejectedAt = new Date();
            paymentRequest.rejectionReason = rejectionReason;

            await createNotification({
                userId: paymentRequest.userId._id,
                groupId: paymentRequest.groupId._id,
                title: "Payment rejected",
                message: `Your payment request of ₹${paymentRequest.amount} for ${paymentRequest.month} has been rejected. Reason: ${rejectionReason}`,
                type: "payment_rejected",
            });
        }

        await paymentRequest.save();

        res.status(200).json({
            message: `Payment request ${status} successfully`,
            paymentRequest,
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
exports.getMemberPaymentHistory = async (req, res) => {
     try {
        const userId = req.user._id;

        const payments = await PaymentRequest.find({ userId })
            .populate("groupId", "groupName groupCode")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Payment history fetched successfully",
            payments,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
exports.getAdminPaymentRequests = async (req, res) => {
  try {
    const adminId = req.user._id;

    const requests = await PaymentRequest.find({ adminId })
      .populate("userId", "fullName mobileNumber profilePicture")
      .populate("groupId", "groupName groupCode")
      .sort({ createdAt: -1 });

    const pending = requests.filter((r) => r.status === "pending");
    const approved = requests.filter((r) => r.status === "approved");
    const rejected = requests.filter((r) => r.status === "rejected");

    res.status(200).json({
      message: "Payment requests fetched successfully",
      counts: {
        all: requests.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
      requests,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.getPaymentRequestDetail = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { requestId } = req.params;

    const request = await PaymentRequest.findOne({
      _id: requestId,
      adminId,
    })
      .populate("userId", "fullName mobileNumber profilePicture")
      .populate("groupId", "groupName groupCode");

    if (!request) {
      return res.status(404).json({
        message: "Payment request not found",
      });
    }

    res.status(200).json({
      message: "Payment request detail fetched successfully",
      request: {
        ...request.toObject(),

        status: request.status,
        rejectionReason: request.rejectionReason || "",
        acceptedAt: request.acceptedAt,
        rejectedAt: request.rejectedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};