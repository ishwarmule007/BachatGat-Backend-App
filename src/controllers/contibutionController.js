const Group = require("../models/Group");
const Contribution = require("../models/contribution");
const PaymentRequest = require("../models/PaymentRequest");

const cloudinary = require("../config/cloud_for_photo");

const sharp = require("sharp");
const streamifier = require("streamifier");

const { createNotification } = require("../utils/createNotification");

exports.createPaymentRequest = async(req, res) => {
    try {
        const {
            groupCode,
            month,
            upiId,
            extractedInfo,
        } = req.body;

        if (!groupCode || !month || !upiId) {
            return res.status(400).json({
                message: "groupCode, month and upiId are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Screenshot is required",
            });
        }

        const group = await Group.findOne({ groupCode });

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

        // Compress image
        const compressedImageBuffer = await sharp(req.file.buffer)
            .resize({ width: 800 })
            .jpeg({ quality: 60 })
            .toBuffer();

        // Upload to cloudinary
        const uploadFromBuffer = () => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                        folder: "payment_screenshots",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                streamifier.createReadStream(compressedImageBuffer).pipe(uploadStream);
            });
        };

        const uploadedImage = await uploadFromBuffer();

        const amount = member.monthlyContributionAmount || 0;

        const paymentRequest = await PaymentRequest.create({
            userId: req.user._id,
            groupId: group._id,
            adminId: group.adminId,
            amount,
            month,
            upiId,
            screenshotUrl: uploadedImage.secure_url,
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