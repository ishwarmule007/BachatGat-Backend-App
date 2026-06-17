const PaymentRequest = require("../models/PaymentRequest");
const Contribution = require("../models/contribution");
const Group = require("../models/Group");
const User = require("../models/User");
const { createNotification } = require("../utils/createNotification");
const cloudinary = require("../config/cloudinary");
const sharp = require("sharp");
const streamifier = require("streamifier");
const Tesseract = require("tesseract.js");
const Installment = require("../models/Installment");
const createPaymentRequest = async(req, res) => {
    try {
        const {
            groupCode,
            month,
            upiId,
        } = req.body;
        if (!groupCode ||
            !month ||
            !upiId
        ) {
            return res.status(400).json({
                success: false,
                message: "groupCode, month and upiId are required",
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Screenshot is required",
            });
        }

        const paymentMonth =
            new Date(month);
        if (
            isNaN(paymentMonth.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid month format",
            });
        }
        const group =
            await Group.findOne({
                groupCode
            });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found",
            });
        }
        const member =
            group.members.find(
                (member) =>
                member.userId.toString() ===
                req.user._id.toString() &&
                member.status ===
                "approved"
            );
        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You are not an approved member of this group",
            });
        }
        const existingContribution =
            await Contribution.findOne({
                userId: req.user._id,
                groupId: group._id,
                month
            });
        if (
            existingContribution &&
            existingContribution.status ===
            "paid"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment already completed for this month",
            });
        }

        const existingPendingRequest =
            await PaymentRequest.findOne({
                userId: req.user._id,
                groupId: group._id,
                month,
                status: "pending",
            });

        if (existingPendingRequest) {
            return res.status(400).json({
                success: false,
                message: "Payment request already pending for this month",
            });
        }
        const compressedImageBuffer =
            await sharp(req.file.buffer)

        .resize({
            width: 800
        })

        .jpeg({
            quality: 60
        })

        .toBuffer();
        const ocrResult =
            await Tesseract.recognize(

                compressedImageBuffer,

                "eng"
            );

        const extractedText =
            ocrResult.data.text;

        const amountMatch =
            extractedText.match(
                /₹\s*([\d,]+(?:\.\d+)?)/i
            );
        const transactionIdMatch =
            extractedText.match(
                /Transaction\s*ID\s*([A-Z0-9]+)/i
            );
        const utrMatch =
            extractedText.match(
                /UTR[:\s]*([A-Z0-9]+)/i
            );
        const paidToMatch =
            extractedText.match(
                /Paid\s*to\s*([\w\s]+)/i
            );
        const dateMatch =
            extractedText.match(
                /\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/
            );
        const extractedInfo = {
            extractedAmount: amountMatch ?
                Number(
                    amountMatch[1]
                    .replace(/,/g, "")
                ) : null,
            transactionId: transactionIdMatch ?
                transactionIdMatch[1] :
                (
                    utrMatch ?
                    utrMatch[1] :
                    null
                ),
            paidTo: paidToMatch ?
                paidToMatch[1].trim() : null,
            paidFrom: null,
            transactionDate: dateMatch ?
                new Date(dateMatch[0]) : null,
        };
        const contributionAmount =
            Number(
                (
                    member.monthlyContributionAmount || 0
                ).toFixed(2)
            );
        const monthEndDate =
            new Date(

                paymentMonth.getFullYear(),

                paymentMonth.getMonth() + 1,

                0,

                23,
                59,
                59
            );
        const unpaidInstallments =
            await Installment.find({
                memberId: req.user._id,
                groupId: group._id,
                status: {
                    $ne: "PAID"
                }
            });
        const currentMonthLoanInstallments =
            unpaidInstallments.filter(
                installment => {
                    const dueDate =
                        new Date(
                            installment.dueDate
                        );
                    return (
                        dueDate <=
                        monthEndDate
                    );
                }
            );
        const loanAmount =
            Number(
                currentMonthLoanInstallments
                .reduce(

                    (sum, installment) =>
                    sum +
                    installment.totalAmount,
                    0
                )
                .toFixed(2)
            );
        const amount =
            Number(
                (
                    contributionAmount +
                    loanAmount
                ).toFixed(2)
            );
        const uploadFromBuffer = () => {

            return new Promise(
                (resolve, reject) => {

                    const uploadStream =
                        cloudinary.uploader.upload_stream({
                                folder: "payment_screenshots",
                            },
                            (
                                error,
                                result
                            ) => {

                                if (error)
                                    reject(error);

                                else
                                    resolve(result);
                            }
                        );
                    streamifier
                        .createReadStream(
                            compressedImageBuffer
                        )
                        .pipe(uploadStream);
                }
            );
        };

        const uploadedImage =
            await uploadFromBuffer();
        const paymentRequest =
            await PaymentRequest.create({
                userId: req.user._id,
                groupId: group._id,
                adminId: group.adminId,
                contributionAmount,
                loanAmount,
                amount,
                installmentIds: currentMonthLoanInstallments
                    .map(
                        installment =>
                        installment._id
                    ),
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
            message: `${req.user.fullName} sent payment request. Contribution: ₹${contributionAmount}, Loan: ₹${loanAmount}, Total: ₹${amount}`,
            type: "payment_request_received",
        });
        await createNotification({
            userId: req.user._id,
            groupId: group._id,
            title: "Payment request sent",
            message: `Your payment request of ₹${amount} has been sent`,
            type: "payment_request_sent",
        });
        return res.status(201).json({
            success: true,
            message: "Payment request submitted successfully",

            paymentBreakdown: {
                contributionAmount,
                loanAmount,
                totalAmount: amount,
                hasLoanPayment: loanAmount > 0
            },

            transactionSummary: {
                groupName: group.groupName,
                memberName: req.user.fullName,
                adminName: group.adminName,
                transactionId: extractedInfo.transactionId ||
                    paymentRequest._id
            },

            paymentRequest
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const getPaymentDetails = async(req, res) => {

    try {

        const { groupCode } = req.body;

        if (!groupCode) {
            return res.status(400).json({
                success: false,
                message: "groupCode is required",
            });
        }

        const group = await Group.findOne({
            groupCode
        }).populate(
            "adminId",
            `
            fullName
            mobileNumber
            upiId
            profilePicture
            bankDetails
            `
        );

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found",
            });
        }

        const member = group.members.find(
            (member) =>
            member.userId.toString() ===
            req.user._id.toString() &&
            member.status === "approved"
        );

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You are not an approved member of this group",
            });
        }

        const contributionAmount = Number(
            (
                member.monthlyContribution || 0
            ).toFixed(2)
        );

        if (contributionAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Monthly contribution amount is not configured",
            });
        }

        const currentDate = new Date();

        const currentMonth =
            `${currentDate.getFullYear()}-${String(
                currentDate.getMonth() + 1
            ).padStart(2, "0")}`;

        const existingContribution =
            await Contribution.findOne({
                userId: req.user._id,
                groupId: group._id,
                month: currentMonth,
                status: "paid",
            });

        if (existingContribution) {
            return res.status(400).json({
                success: false,
                message: "Contribution already paid for current month",
            });
        }

        const existingPendingRequest =
            await PaymentRequest.findOne({
                userId: req.user._id,
                groupId: group._id,
                month: currentMonth,
                status: "pending",
            });

        const ownerName =
            group.adminId.fullName;

        const ownerUpiId =
            group.adminId.upiId;

        const paymentLink =
            `upi://pay?pa=${encodeURIComponent(ownerUpiId)}` +
            `&pn=${encodeURIComponent(ownerName)}` +
            `&am=${contributionAmount.toFixed(2)}` +
            `&cu=INR`;

        return res.status(200).json({

            success: true,

            message: "Payment details fetched successfully",

            payment: {

                paymentMonth: currentMonth,

                contributionAmount,

                totalAmount: contributionAmount,
            },

            ownerPaymentDetails: {

                ownerId: group.adminId._id,

                ownerName,

                upiId: ownerUpiId,

                mobileNumber: group.adminId.mobileNumber,

                profilePicture: group.adminId.profilePicture,

                bankDetails: {

                    accountHolderName: group.adminId.bankDetails ? group.adminId.bankDetails.
                    accountHolderName || null: null,

                    bankName: group.adminId.bankDetails ? group.adminId.bankDetails.
                    bankName || null: null,

                    accountNumber: group.adminId.bankDetails ? group.adminId.bankDetails.
                    accountNumber || null: null,

                    ifscCode: group.adminId.bankDetails ? group.adminId.bankDetails.
                    ifscCode || null: null,
                }
            },

            paymentLink,

            alreadyPaid: false,

            pendingRequest:
                !!existingPendingRequest,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const updatePaymentRequestStatus =
    async(req, res) => {
        try {
            const {
                paymentRequestId,
                status,
                rejectionReason
            } = req.body;
            if (!paymentRequestId ||
                !status
            ) {
                return res.status(400).json({

                    success: false,

                    message: "paymentRequestId and status are required",
                });
            }
            if (![
                    "accepted",
                    "rejected"
                ].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be accepted or rejected",
                });
            }
            if (
                status === "rejected" &&
                !rejectionReason
            ) {
                return res.status(400).json({
                    success: false,
                    message: "rejectionReason is required when rejecting payment",
                });
            }

            const paymentRequest =
                await PaymentRequest.findById(
                    paymentRequestId
                )
                .populate(
                    "userId",
                    `
                    fullName
                    mobileNumber
                    `
                )
                .populate(
                    "groupId",
                    `
                    groupName
                    groupCode
                    `
                )
                .populate(
                    "installmentIds"
                );

            if (!paymentRequest) {
                return res.status(404).json({
                    success: false,
                    message: "Payment request not found",
                });
            }

            if (
                paymentRequest.adminId.toString() !==
                req.user._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to manage this payment request",
                });
            }

            if (
                paymentRequest.status !==
                "pending"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Payment request is already processed",
                });
            }

            paymentRequest.status =
                status;
            if (status === "accepted") {
                paymentRequest.acceptedAt =
                    new Date();
                const existingContribution =
                    await Contribution.findOne({

                        userId: paymentRequest.userId._id,

                        groupId: paymentRequest.groupId._id,

                        month: paymentRequest.month,
                    });

                if (existingContribution) {
                    return res.status(400).json({
                        success: false,
                        message: "Contribution already exists for this month",
                    });
                }
                await Contribution.create({

                    userId: paymentRequest.userId._id,
                    groupId: paymentRequest.groupId._id,
                    contributionAmount: paymentRequest.contributionAmount || 0,

                    loanAmount: paymentRequest.loanAmount || 0,
                    amount: paymentRequest.amount,

                    month: paymentRequest.month,
                    status: "paid",
                    paymentRequestId: paymentRequest._id,
                });
                if (
                    paymentRequest.installmentIds &&
                    paymentRequest.installmentIds.length > 0
                ) {
                    await Installment.updateMany({
                        _id: {
                            $in: paymentRequest.installmentIds.map(
                                installment =>
                                installment._id
                            )
                        }

                    }, {

                        $set: {

                            status: "PAID",
                            paidAt: new Date()
                        }
                    });
                }
                await createNotification({
                    userId: paymentRequest.userId._id,
                    groupId: paymentRequest.groupId._id,
                    title: "Payment accepted",
                    message: `Your payment of ₹${paymentRequest.amount} for ${paymentRequest.month} has been accepted`,
                    type: "payment_accepted",
                });
            }
            if (status === "rejected") {
                paymentRequest.rejectedAt =
                    new Date();
                paymentRequest.rejectionReason =
                    rejectionReason;
                await createNotification({
                    userId: paymentRequest.userId._id,
                    groupId: paymentRequest.groupId._id,
                    title: "Payment rejected",
                    message: `Your payment request of ₹${paymentRequest.amount} for ${paymentRequest.month} has been rejected. Reason: ${rejectionReason}`,
                    type: "payment_rejected",
                });
            }
            await paymentRequest.save();
            return res.status(200).json({
                success: true,
                message: `Payment request ${status} successfully`,
                paymentRequest,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };
const getMemberPaymentHistory =
    async(req, res) => {

        try {
            const userId =
                req.user._id;
            const payments =
                await PaymentRequest.find({
                    userId

                })
                .populate(
                    "groupId",
                    `
                    groupName
                    groupCode
                `
                )
                .populate(
                    "installmentIds"
                )

            .sort({
                createdAt: -1
            });

            const formattedPayments =
                payments.map(payment => ({

                    paymentRequestId: payment._id,
                    group: {
                        groupId: payment.groupId ? payment.groupId._id || null : null,

                        groupName: payment.groupId ? payment.groupId.groupName || "" : "",

                        groupCode: payment.groupId ? payment.groupId.groupCode || "" : "",
                    },

                    contributionAmount: payment.contributionAmount || 0,
                    //loanAmount: payment.loanAmount || 0,
                    //totalAmount: payment.amount || 0,
                    //installmentCount: payment.installmentIds ? payment.installmentIds.length || 0 : 0,
                    //installments: payment.installmentIds || [],
                    month: payment.month,
                    upiId: payment.upiId,
                    screenshotUrl: payment.screenshotUrl,

                    extractedInfo: payment.extractedInfo,
                    status: payment.status,

                    rejectionReason: payment.rejectionReason || "",
                    acceptedAt: payment.acceptedAt || null,
                    rejectedAt: payment.rejectedAt || null,

                    resubmittedAt: payment.resubmittedAt || null,
                    resubmissionCount: payment.resubmissionCount || 0,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                }));

            return res.status(200).json({

                success: true,
                message: "Payment history fetched successfully",

                counts: {

                    total: formattedPayments.length,
                    accepted: formattedPayments.filter(
                        payment =>
                        payment.status === "accepted"
                    ).length,
                    pending: formattedPayments.filter(
                        payment =>
                        payment.status === "pending"
                    ).length,
                    rejected: formattedPayments.filter(
                        payment =>
                        payment.status === "rejected"
                    ).length,
                },

                payments: formattedPayments,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };
const getAdminPaymentRequests =
    async(req, res) => {

        try {
            const adminId =
                req.user._id;

            const requests =
                await PaymentRequest.find({

                    adminId
                })
                .populate(
                    "userId",
                    `
                    fullName
                    mobileNumber
                    profilePicture
                    `
                )
                .populate(
                    "groupId",
                    `
                    groupName
                    groupCode
                    `
                )

            .populate(
                    "installmentIds",
                    `
                    installmentNumber
                    dueDate
                    principalAmount
                    interestAmount
                    totalAmount
                    status
                    `
                )
                .sort({
                    createdAt: -1
                });

            const formattedRequests =
                requests.map(
                    (request) => ({

                        requestId: request._id,
                        memberId: request.userId ? request.userId._id || null : null,
                        memberName: request.userId ? request.userId.fullName ||
                            "Unknown Member" : "Unknown Member",
                        mobileNumber: request.userId ? request.userId.mobileNumber || "" : "",
                        profilePicture: request.userId ? request.userId.profilePicture || "" : "",
                        groupId: request.groupId ? request.groupId._id || null : null,
                        groupName: request.groupId ? request.groupId.groupName || "" : "",
                        groupCode: request.groupId ? request.groupId.groupCode || "" : "",
                        contributionAmount: request.contributionAmount || 0,
                        loanAmount: request.loanAmount || 0,
                        totalAmount: request.amount || 0,
                        installmentCount: request.installmentIds ? request.installmentIds.length || 0 : 0,
                        installments: request.installmentIds || [],
                        month: request.month,
                        upiId: request.upiId,
                        screenshotUrl: request.screenshotUrl,
                        extractedInfo: request.extractedInfo,
                        status: request.status,
                        rejectionReason: request.rejectionReason || "",
                        acceptedAt: request.acceptedAt || null,
                        rejectedAt: request.rejectedAt || null,
                        // Timestamps
                        createdAt: request.createdAt,
                        updatedAt: request.updatedAt,
                    })
                );

            const pending =
                formattedRequests.filter(
                    (request) =>
                    request.status ===
                    "pending"
                );

            const accepted =
                formattedRequests.filter(
                    (request) =>
                    request.status ===
                    "accepted"
                );

            const rejected =
                formattedRequests.filter(
                    (request) =>
                    request.status ===
                    "rejected"
                );

            return res.status(200).json({

                success: true,

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
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };
const getPaymentRequestDetail =
    async(req, res) => {
        try {
            const adminId =
                req.user._id;

            const { requestId } =
            req.params;
            const request =
                await PaymentRequest.findOne({

                    _id: requestId,

                    adminId
                })
                .populate(
                    "userId",
                    `
                    fullName
                    mobileNumber
                    profilePicture
                    `
                )
                .populate(
                    "groupId",
                    `
                    groupName
                    groupCode
                    `
                )
                .populate(
                    "installmentIds",
                    `
                    installmentNumber
                    dueDate
                    principalAmount
                    interestAmount
                    totalAmount
                    status
                    paidAt
                    `
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Payment request not found",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Payment request detail fetched successfully",
                request: {
                    requestId: request._id,
                    member: {
                        memberId: request.userId ?
                            request.userId._id : null,
                        fullName: request.userId ?
                            request.userId.fullName : "Unknown Member",
                        mobileNumber: request.userId ?
                            request.userId.mobileNumber : "",
                        profilePicture: request.userId ?
                            request.userId.profilePicture : "",
                    },

                    group: {
                        groupId: request.groupId ?
                            request.groupId._id : null,
                        groupName: request.groupId ?
                            request.groupId.groupName : "",
                        groupCode: request.groupId ?
                            request.groupId.groupCode : "",
                    },

                    paymentBreakdown: {
                        contributionAmount: request.contributionAmount || 0,
                        //loanAmount: request.loanAmount || 0,
                        totalAmount: request.amount || 0,
                        installmentCount: request.installmentIds ?
                            request.installmentIds.length || 0 : 0,
                        hasLoanPayment: request.loanAmount > 0
                    },
                    /*installments: request.installmentIds || [],
                    paymentDetails: {
                        month: request.month,
                        upiId: request.upiId,
                        screenshotUrl: request.screenshotUrl,
                        extractedInfo: request.extractedInfo,
                    },*/
                    status: request.status,
                    rejectionReason: request.rejectionReason || "",
                    acceptedAt: request.acceptedAt || null,
                    rejectedAt: request.rejectedAt || null,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                },
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

const generateContributionPaymentLink =
    async(req, res) => {
        try {
            const userId =
                req.user._id;

            const { groupId } =
            req.params;
            const group =
                await Group.findById(groupId)
                .populate(
                    "adminId",
                    `
                    fullName
                    upiId
                    bankAccountDetails
                    `
                );
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: "Group not found",
                });
            }
            const member =
                group.members.find(
                    (member) =>
                    member.userId.toString() ===
                    userId.toString()
                );
            if (!member) {
                return res.status(403).json({

                    success: false,
                    message: "You are not a member of this group",
                });
            }
            const now =
                new Date();

            const month =
                `${now.getFullYear()}-${String(
                    now.getMonth() + 1
                ).padStart(2, "0")}`;
            const existingContribution =
                await Contribution.findOne({
                    userId,
                    groupId,
                    month,
                    status: "paid"
                });
            if (existingContribution) {
                return res.status(400).json({
                    success: false,
                    message: "Payment already completed for this month"
                });
            }
            const contributionAmount =
                Number(
                    (
                        member.monthlyContributionAmount || 0
                    ).toFixed(2)
                );
            const monthEndDate =
                new Date(

                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59
                );
            const unpaidInstallments =
                await Installment.find({
                    memberId: userId,
                    groupId: group._id,
                    status: {
                        $ne: "PAID"
                    }
                });
            const dueInstallments =
                unpaidInstallments.filter(
                    installment => {
                        const dueDate =
                            new Date(
                                installment.dueDate
                            );
                        return (
                            dueDate <=
                            monthEndDate
                        );
                    }
                );
            const loanAmount =
                Number(
                    dueInstallments.reduce(

                        (sum, installment) =>

                        sum +
                        installment.totalAmount,

                        0
                    ).toFixed(2)
                );
            const amount =
                Number(
                    (
                        contributionAmount +
                        loanAmount
                    ).toFixed(2)
                );
            if (!group.adminId.upiId) {
                return res.status(400).json({
                    success: false,
                    message: "Admin UPI ID not found",
                });
            }
            const transactionNote =
                `${group.groupName} Contribution ${month}`;

            const upiDeepLink =

                `upi://pay?pa=${encodeURIComponent(group.adminId.upiId)}` +

                `&pn=${encodeURIComponent(group.adminId.fullName)}` +

                `&am=${amount}` +

                `&cu=INR` +

                `&tn=${encodeURIComponent(transactionNote)}`;

            return res.status(200).json({

                success: true,

                message: "Payment page data fetched successfully",

                group: {

                    groupId: group._id,

                    groupName: group.groupName,
                },

                amountDetails: {
                    contributionAmount,
                    //loanAmount,
                    totalAmount: amount,
                    month,
                    hasLoanPayment: loanAmount > 0,
                    installmentCount: dueInstallments.length
                },

                /*loanInstallments: dueInstallments.map(
                    installment => ({

                        installmentId: installment._id,
                        installmentNumber: installment.installmentNumber,
                        dueDate: installment.dueDate,
                        principalAmount: installment.principalAmount,
                        interestAmount: installment.interestAmount,
                        totalAmount: installment.totalAmount
                    })
                ),*/

                ownerAccount: {
                    adminId: group.adminId._id,
                    adminName: group.adminId.fullName,
                    upiId: group.adminId.upiId,
                    bankAccountDetails: {
                        bankAccountDetails: {
                            accountHolderName: group.adminId
                                .bankAccountDetails ?
                                group.adminId.bankAccountDetails.accountHolderName || "" : "",
                            bankName: group.adminId
                                .bankAccountDetails ?
                                group.adminId.bankAccountDetails.bankName || "" : "",
                            accountNumber: group.adminId
                                .bankAccountDetails ?
                                group.adminId.bankAccountDetails.accountNumber || "" : "",
                            ifscCode: group.adminId
                                .bankAccountDetails ?
                                group.adminId.bankAccountDetails.ifscCode || "" : "",
                        },
                    },
                },
                paymentDetails: {
                    upiDeepLink,
                },
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

const resubmitPaymentRequest =
    async(req, res) => {
        try {
            const {
                paymentRequestId
            } = req.params;
            const {
                additionalComments
            } = req.body;
            const screenshotUrl =
                req.file ? req.file.path : null;
            if (!screenshotUrl) {

                return res.status(400).json({
                    success: false,
                    message: "Screenshot is required"
                });
            }

            const paymentRequest =
                await PaymentRequest.findById(
                    paymentRequestId
                );

            if (!paymentRequest) {
                return res.status(404).json({
                    success: false,
                    message: "Payment request not found"
                });
            }
            if (
                paymentRequest.userId.toString() !==
                req.user._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }
            if (
                paymentRequest.status !==
                "rejected"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Only rejected payment requests can be resubmitted"
                });
            }
            paymentRequest.screenshotUrl =
                screenshotUrl;
            paymentRequest.additionalComments =
                additionalComments || "";
            paymentRequest.status =
                "pending";
            paymentRequest.rejectionReason =
                "";
            paymentRequest.rejectedAt =
                null;
            paymentRequest.resubmittedAt =
                new Date();
            paymentRequest.resubmissionCount =
                (paymentRequest.resubmissionCount || 0) + 1;
            await paymentRequest.save();
            await createNotification({
                userId: paymentRequest.adminId,
                groupId: paymentRequest.groupId,
                title: "Payment Resubmitted",
                message: `${req.user.fullName} has resubmitted payment proof for ${paymentRequest.month}`,
                type: "payment_resubmitted"
            });

            return res.status(200).json({
                success: true,
                message: "Payment resubmitted successfully",
                paymentRequest
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const getRejectedPaymentRequestDetails =
    async(req, res) => {
        try {
            const {
                paymentRequestId
            } = req.params;
            const paymentRequest =
                await PaymentRequest.findById(
                    paymentRequestId
                )
                .populate(
                    "adminId",
                    "fullName mobileNumber"
                )
                .populate(
                    "groupId",
                    `
                        groupName
                    groupCode
                    `
                )
                .populate(
                    "userId",
                    `
                    fullName
                    mobileNumber
                    profilePicture
                    `
                )
                .populate(
                    "installmentIds"
                );

            if (!paymentRequest) {

                return res.status(404).json({

                    success: false,
                    message: "Payment request not found"
                });
            }
            if (
                paymentRequest.userId._id.toString() !==
                req.user._id.toString()

            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Payment request fetched successfully",
                paymentRequest: {
                    paymentRequestId: paymentRequest._id,
                    status: paymentRequest.status,
                    month: paymentRequest.month,
                    contributionAmount: paymentRequest.contributionAmount || 0,
                    loanAmount: paymentRequest.loanAmount || 0,
                    totalAmount: paymentRequest.amount || 0,
                    installmentCount: paymentRequest.installmentIds ? paymentRequest.installmentIds.length || 0 : 0,
                    installments: paymentRequest.installmentIds || [],
                    screenshotUrl: paymentRequest.screenshotUrl,
                    extractedInfo: paymentRequest.extractedInfo,
                    submittedAt: paymentRequest.createdAt,
                    rejectedAt: paymentRequest.rejectedAt,
                    acceptedAt: paymentRequest.acceptedAt,
                    resubmittedAt: paymentRequest.resubmittedAt,
                    rejectionReason: paymentRequest.rejectionReason || "",
                    additionalComments: paymentRequest.additionalComments || "",
                    resubmissionCount: paymentRequest.resubmissionCount || 0,
                    group: {
                        groupId: paymentRequest.groupId ? paymentRequest.groupId._id || null : null,
                        groupName: paymentRequest.groupId ? paymentRequest.groupId.groupName || "" : "",
                        groupCode: paymentRequest.groupId ? paymentRequest.groupId.groupCode || "" : "",
                    },
                    admin: {
                        adminId: paymentRequest.adminId ? paymentRequest.adminId._id || null : null,
                        fullName: paymentRequest.adminId ? paymentRequest.adminId.fullName || "" : "",
                        mobileNumber: paymentRequest.adminId ? paymentRequest.adminId.mobileNumber || "" : "",
                    },
                    member: {

                        memberId: paymentRequest.userId ? paymentRequest.userId._id || null : null,
                        fullName: paymentRequest.userId ? paymentRequest.userId.fullName || "Unknown Member" : "Unknown Member",
                        mobileNumber: paymentRequest.userId ? paymentRequest.userId.mobileNumber || "" : "",
                        profilePicture: paymentRequest.userId ? paymentRequest.userId.profilePicture || "" : "",
                    }
                }
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const getMemberPaymentDashboard = async(req, res) => {

    try {
        const userId =
            req.user._id || req.user.id;
        const user = await User.findById(userId)
            .select(
                "fullName profilePhoto"
            );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        const group = await Group.findOne({
            members: {
                $elemMatch: {
                    userId,
                    status: "approved"
                }
            }
        });

        let activeGroup = null;

        if (group) {

            const member =
                group.members.find(
                    (m) =>
                    m.userId.toString() ===
                    userId.toString()
                );

            activeGroup = {
                groupId: group._id,

                groupName: group.groupName,

                monthlyContribution: member ? member.monthlyContribution || 0 : 0,

                dueDate: "10 May 2025"
            };
        }
        const currentDate = new Date();

        const currentMonthStart =
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
            );
        const paidThisMonthResult =
            await Contribution.aggregate([{
                    $match: {
                        userId,
                        status: "paid",
                        createdAt: {
                            $gte: currentMonthStart
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount"
                        }
                    }
                }
            ]);

        const totalPaidThisMonth =
            paidThisMonthResult[0] ? paidThisMonthResult[0].total || 0 : 0;

        const totalPaidAllTimeResult =
            await Contribution.aggregate([{
                    $match: {
                        userId,
                        status: "paid"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount"
                        }
                    }
                }
            ]);

        const totalPaidAllTime =
            totalPaidAllTimeResult[0] ? totalPaidAllTimeResult[0].total || 0 : 0;

        const totalMonthlyContribution =
            activeGroup ? activeGroup.monthlyContribution || 0 : 0;

        const pendingAmount =
            Math.max(
                totalMonthlyContribution -
                totalPaidThisMonth,
                0
            );
        const loanSummaryResult =
            await Loan.aggregate([{
                    $match: {
                        userId
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalLoanTaken: {
                            $sum: "$loanAmount"
                        },

                        totalLoanPaid: {
                            $sum: "$paidAmount"
                        }
                    }
                }
            ]);

        const totalLoanTaken =
            loanSummaryResult[0] ?
            loanSummaryResult[0].totalLoanTaken || 0 : 0;

        const totalLoanPaid =
            loanSummaryResult[0] ?
            loanSummaryResult[0].totalLoanPaid || 0 : 0;

        const remainingLoanAmount =
            totalLoanTaken -
            totalLoanPaid;
        const recentTransactions =
            await Contribution.find({
                userId,
                createdAt: {
                    $gte: currentMonthStart
                }
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate(
                "groupId",
                "groupName"
            );

        const formattedTransactions =
            recentTransactions.map(
                (transaction) => ({
                    transactionId: transaction._id,

                    type: transaction.paymentType ||
                        "Monthly Contribution",

                    amount: transaction.amount,

                    status: transaction.status,

                    createdAt: transaction.createdAt,

                    groupName: transaction.groupId ?
                        transaction.groupId.groupName || null : null
                })
            );
        return res.status(200).json({

            message: "Dashboard fetched successfully",

            profile: {
                fullName: user.fullName,
                profilePhoto: user.profilePhoto || null
            },

            activeGroup,

            paymentSummary: {
                totalPaidThisMonth,
                pendingAmount,
                totalPaidAllTime
            },

            /*loanSummary: {
                totalLoanTaken,
                totalLoanPaid,
                remainingLoanAmount
            },*/

            recentTransactions: formattedTransactions
        });

    } catch (error) {

        return res.status(500).json({
            message: error.message
        });
    }
};
module.exports = {
    createPaymentRequest,
    updatePaymentRequestStatus,
    getMemberPaymentHistory,
    getAdminPaymentRequests,
    getPaymentRequestDetail,
    generateContributionPaymentLink,
    resubmitPaymentRequest,
    getRejectedPaymentRequestDetails,
    getMemberPaymentDashboard,
    getPaymentDetails
};