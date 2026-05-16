const PaymentRequest = require("../models/PaymentRequest");
const Contribution = require("../models/contribution");
const Group = require("../models/Group");
const User = require("../models/User");
const { createNotification } = require("../utils/createNotification");
exports.createPaymentRequest = async(req, res) => {
    try {
        const {
            groupCode,
            month,
            upiId,
            screenshotUrl,
            extractedInfo,
        } = req.body;

        if (!groupCode || !month || !upiId || !screenshotUrl) {
            return res.status(400).json({
                message: "groupCode, month, upiId and screenshotUrl are required",
            });
        }

        const group = await Group.findOne({ groupCode: groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        const member = group.members.find(
            (m) =>
            m.userId.toString() === req.user._id.toString() &&
            m.status === "approved"
        );

        if (!member) {
            return res.status(403).json({
                message: "You are not an approved member of this group",
            });
        }

        const existingContribution = await Contribution.findOne({
            userId: req.user._id,
            groupId: group._id,
            month,
            status: "paid",
        });

        if (existingContribution) {
            return res.status(400).json({
                message: "Contribution already paid for this month",
            });
        }

        const existingPendingRequest = await PaymentRequest.findOne({
            userId: req.user._id,
            groupId: group._id,
            month,
            status: "pending",
        });

        if (existingPendingRequest) {
            return res.status(400).json({
                message: "Payment request already pending for this month",
            });
        }

        const amount = member.monthlyContributionAmount || 0;

        const paymentRequest = await PaymentRequest.create({
            userId: req.user._id,
            groupId: group._id,
            adminId: group.adminId,
            amount,
            month,
            upiId,
            screenshotUrl,
            extractedInfo,
            status: "pending",
        });

        await createNotification({
            userId: group.adminId,
            groupId: group._id,
            title: "Payment request received",
            message: `${req.user.fullName} has sent payment request of ₹${amount}`,
            type: "payment_request_received",
        });

        await createNotification({
            userId: req.user._id,
            groupId: group._id,
            title: "Payment request sent",
            message: `Your payment request of ₹${amount} has been sent`,
            type: "payment_request_sent",
        });

        res.status(201).json({
            message: "Payment request submitted successfully",
            paymentRequest,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};