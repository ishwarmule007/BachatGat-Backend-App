const PaymentRequest = require("../models/PaymentRequest");
const Contribution = require("../models/contribution");
const Group = require("../models/Group");
const User = require("../models/User");
const { createNotification } = require("../utils/createNotification");
const cloudinary = require("../config/cloudinary");
const sharp = require("sharp");
const streamifier = require("streamifier");
const Tesseract = require("tesseract.js");

const createPaymentRequest = async(req, res) => {
    try {
        const {
            groupCode,
            month,
            upiId,
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

        // OCR
        const ocrResult = await Tesseract.recognize(
            compressedImageBuffer,
            "eng"
        );

        const extractedText = ocrResult.data.text;

        console.log("=================================");
        console.log("OCR TEXT");
        console.log(extractedText);
        console.log("=================================");

        // Extract Amount
        const amountMatch = extractedText.match(
            /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i
        );

        // Extract Transaction ID / UTR
        const transactionMatch = extractedText.match(
            /(UTR|Transaction ID|Ref No\.?|Reference No\.?)\s*:?\s*([A-Z0-9]+)/i
        );

        const extractedInfo = {
            extractedAmount: amountMatch ?
                Number(amountMatch[1].replace(/,/g, "")) :
                null,

            transactionId: transactionMatch ?
                transactionMatch[2] :
                null,

            paidTo: null,
            paidFrom: null,
            transactionDate: null,
        };

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

                streamifier
                    .createReadStream(compressedImageBuffer)
                    .pipe(uploadStream);
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
const updatePaymentRequestStatus = async(req, res) => {
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
const getMemberPaymentPage = async(req, res) => {
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
const getMemberPaymentHistory = async (req, res) => {
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
const getAdminPaymentRequests = async (req, res) => {
  try {
    const adminId = req.user._id;

    const requests = await PaymentRequest.find({ adminId })
      .populate("userId", "fullName mobileNumber profilePicture")
      .populate("groupId", "groupName groupCode")
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map((request) => ({
      requestId: request._id,

      memberId: request.userId?._id,
      memberName: request.userId?.fullName || "Unknown Member",
      mobileNumber: request.userId?.mobileNumber || "",
      profilePicture: request.userId?.profilePicture || "",

      groupId: request.groupId?._id,
      groupName: request.groupId?.groupName || "",
      groupCode: request.groupId?.groupCode || "",

      amount: request.amount,
      month: request.month,
      upiId: request.upiId,
      screenshotUrl: request.screenshotUrl,
      extractedInfo: request.extractedInfo,

      status: request.status,

      rejectionReason: request.rejectionReason || "",

      acceptedAt: request.acceptedAt || null,
      rejectedAt: request.rejectedAt || null,

      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    const pending = formattedRequests.filter(
      (r) => r.status === "pending"
    );

    const accepted = formattedRequests.filter(
      (r) => r.status === "accepted"
    );

    const rejected = formattedRequests.filter(
      (r) => r.status === "rejected"
    );

    res.status(200).json({
      message: "Payment requests fetched successfully",

      counts: {
        all: formattedRequests.length,
        pending: pending.length,
        accepted: accepted.length,
        rejected: rejected.length,
      },

      requests: formattedRequests,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const getPaymentRequestDetail = async (req, res) => {
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

const generateContributionPaymentLink = async (req, res) => {
  try {
    const userId = req.user._id;

    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
      "adminId",
      "fullName upiId"
    );

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const member = group.members.find(
      (m) => m.userId.toString() === userId.toString()
    );

    if (!member) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    const amount =
      member.monthlyContributionAmount || 500;

    const now = new Date();

    const month = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!group.adminId.upiId) {
      return res.status(400).json({
        message: "Admin UPI ID not found",
      });
    }

    const transactionNote = `${group.groupName} Contribution ${month}`;

    const upiDeepLink =
      `upi://pay?pa=${encodeURIComponent(group.adminId.upiId)}` +
      `&pn=${encodeURIComponent(group.adminId.fullName)}` +
      `&am=${amount}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(transactionNote)}`;

    res.status(200).json({
  message: "Payment page data fetched successfully",

  group: {
    groupId: group._id,
    groupName: group.groupName,
  },

  amountDetails: {
    amount,
    month,
  },

  ownerAccount: {
    adminId: group.adminId._id,
    adminName: group.adminId.fullName,

    upiId: group.adminId.upiId,

    bankAccountDetails: {
      accountHolderName:
        group.adminId.bankAccountDetails?.accountHolderName,

      bankName:
        group.adminId.bankAccountDetails?.bankName,

      accountNumber:
        group.adminId.bankAccountDetails?.accountNumber,

      ifscCode:
        group.adminId.bankAccountDetails?.ifscCode,
    },
  },

  paymentDetails: {
    upiDeepLink,
  },
});
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
    }
};

const resubmitPaymentRequest = async (req, res) => {
    try {

        const { paymentRequestId } = req.params;

        const { additionalComments } = req.body;

        const screenshotUrl = req.file?.path;

        if (!screenshotUrl) {
            return res.status(400).json({
                message: "Screenshot is required"
            });
        }

        const paymentRequest = await PaymentRequest.findById(paymentRequestId);

        if (!paymentRequest) {
            return res.status(404).json({
                message: "Payment request not found"
            });
        }

        if (paymentRequest.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        if (paymentRequest.status !== "rejected") {
            return res.status(400).json({
                message: "Only rejected payment requests can be resubmitted"
            });
        }

        paymentRequest.screenshotUrl = screenshotUrl;

        paymentRequest.additionalComments =
            additionalComments || "";

        paymentRequest.status = "pending";

        paymentRequest.rejectionReason = null;

        paymentRequest.rejectedAt = null;

        paymentRequest.resubmittedAt = new Date();

        paymentRequest.resubmissionCount += 1;

        await paymentRequest.save();

        await createNotification({
            userId: paymentRequest.adminId,
            groupId: paymentRequest.groupId,
            title: "Payment Resubmitted",
            message: `A new payment screenshot has been uploaded for ${paymentRequest.month}`,
            type: "payment_resubmitted"
        });

        res.status(200).json({
            message: "Payment resubmitted successfully",
            paymentRequest
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
const getRejectedPaymentRequestDetails = async (req, res) => {
    try {

        const { paymentRequestId } = req.params;

        const paymentRequest = await PaymentRequest.findById(paymentRequestId)
            .populate("adminId", "fullName")
            .populate("groupId", "groupName groupCode")
            .populate("userId", "fullName");

        if (!paymentRequest) {
            return res.status(404).json({
                message: "Payment request not found"
            });
        }

        // only owner can view
        if (
            paymentRequest.userId._id.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        res.status(200).json({
            message: "Payment request fetched successfully",

            paymentRequest: {

                paymentRequestId: paymentRequest._id,

                status: paymentRequest.status,

                amount: paymentRequest.amount,

                month: paymentRequest.month,

                screenshotUrl: paymentRequest.screenshotUrl,

                submittedAt: paymentRequest.createdAt,

                rejectedAt: paymentRequest.rejectedAt,

                acceptedAt: paymentRequest.acceptedAt,

                rejectionReason:
                    paymentRequest.rejectionReason,

                additionalComments:
                    paymentRequest.additionalComments,

                resubmittedAt:
                    paymentRequest.resubmittedAt,

                resubmissionCount:
                    paymentRequest.resubmissionCount,

                group: {
                    groupId: paymentRequest.groupId._id,
                    groupName: paymentRequest.groupId.groupName,
                    groupCode: paymentRequest.groupId.groupCode,
                },

                admin: {
                    adminId: paymentRequest.adminId._id,
                    fullName: paymentRequest.adminId.fullName,
                }
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

module.exports = {
    createPaymentRequest,
    updatePaymentRequestStatus,
    getMemberPaymentPage,
    getMemberPaymentHistory,
    getAdminPaymentRequests,
    getPaymentRequestDetail,
    generateContributionPaymentLink,
    resubmitPaymentRequest,
    getRejectedPaymentRequestDetails
};