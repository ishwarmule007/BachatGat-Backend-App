const Loan = require("../models/Loan");
const Installment = require("../models/Installment");
const Group = require("../models/Group");
const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
exports.createLoan = async(req, res) => {
    try {
        const adminId = req.user._id;

        const {
            groupCode,
            memberId,
            loanAmount,
            interestPercent,
            months,
            penaltyPerDay,
            loanStartDate
        } = req.body;

        if (!groupCode ||
            !memberId ||
            !loanAmount ||
            !interestPercent ||
            !months ||
            !loanStartDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields are mandatory"
            });
        }

        const group = await Group.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        if (group.adminId.toString() !== adminId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only group admin can create loan"
            });
        }

        const memberExists = group.members.find(
            m =>
            m.userId.toString() === memberId &&
            m.status === "approved"
        );

        if (!memberExists) {
            return res.status(400).json({
                success: false,
                message: "Member not found in group"
            });
        }

        const interestAmount =
            (loanAmount * interestPercent) / 100;

        const totalAmount =
            loanAmount + interestAmount;

        const monthlyEMI = Number(
            (totalAmount / months).toFixed(2)
        );

        const startDate = new Date(loanStartDate);

        const endDate = new Date(startDate);
        endDate.setMonth(
            endDate.getMonth() + months
        );

        const loanNumber =
            "LN" + Date.now();

        const loan = await Loan.create({
            loanNumber,
            groupId: group._id,
            memberId,
            loanAmount,
            interestPercent,
            interestAmount,
            totalAmount,
            months,
            monthlyEMI,
            penaltyPerDay,
            loanStartDate: startDate,
            loanEndDate: endDate,
            remainingAmount: totalAmount,
            remainingInstallments: months,
            approvedBy: adminId
        });

        const originalDay =
            startDate.getDate();

        for (let i = 1; i <= months; i++) {

            const dueDate = new Date(startDate);

            dueDate.setMonth(
                dueDate.getMonth() + (i - 1)
            );

            const lastDay =
                new Date(
                    dueDate.getFullYear(),
                    dueDate.getMonth() + 1,
                    0
                ).getDate();

            dueDate.setDate(
                Math.min(originalDay, lastDay)
            );

            await Installment.create({
                loanId: loan._id,
                installmentNumber: i,
                amount: monthlyEMI,
                dueDate
            });
        }

        return res.status(201).json({
            success: true,
            message: "Loan created successfully",
            loan
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getLoanDetails = async(req, res) => {
    try {

        const { loanId } = req.params;

        const loan = await Loan.findById(loanId)
            .populate("memberId", "fullName mobileNumber")
            .populate("groupId", "groupName groupCode");

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            });
        }

        const installments =
            await Installment.find({
                loanId
            }).sort({
                installmentNumber: 1
            });

        return res.status(200).json({
            success: true,
            loan,
            installments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getGroupLoans = async(req, res) => {
    try {

        const { groupCode } = req.params;

        const group =
            await Group.findOne({
                groupCode
            });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const loans =
            await Loan.find({
                groupId: group._id
            })
            .populate(
                "memberId",
                "fullName mobileNumber"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: loans.length,
            loans
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getOverdueLoans = async(req, res) => {
    try {

        const overdueLoans =
            await Loan.find({
                loanStatus: "OVERDUE"
            })
            .populate(
                "memberId",
                "fullName mobileNumber"
            )
            .populate(
                "groupId",
                "groupName groupCode"
            );

        return res.status(200).json({
            success: true,
            count: overdueLoans.length,
            overdueLoans
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.approveLoanPayment = async(req, res) => {
    try {

        const { paymentRequestId } =
        req.body;

        const payment =
            await PaymentRequest.findById(
                paymentRequestId
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment request not found"
            });
        }

        const installment =
            await Installment.findById(
                payment.installmentId
            );

        const loan =
            await Loan.findById(
                payment.loanId
            );

        payment.status = "accepted";
        payment.acceptedAt = new Date();

        installment.status = "PAID";
        installment.paidDate = new Date();
        installment.paymentRequestId =
            payment._id;

        loan.paidAmount +=
            installment.amount;

        loan.remainingAmount -=
            installment.amount;

        loan.paidInstallments += 1;

        loan.remainingInstallments -= 1;

        if (
            loan.remainingAmount <= 0
        ) {
            loan.loanStatus = "PAID";
        }

        await payment.save();
        await installment.save();
        await loan.save();

        return res.status(200).json({
            success: true,
            message: "Loan installment approved successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.rejectLoanPayment = async(req, res) => {
    try {

        const {
            paymentRequestId,
            rejectionReason
        } = req.body;

        const payment =
            await PaymentRequest.findById(
                paymentRequestId
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment request not found"
            });
        }

        payment.status = "rejected";
        payment.rejectedAt = new Date();
        payment.rejectionReason =
            rejectionReason;

        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Loan payment rejected successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMyLoans = async(req, res) => {
    try {

        const memberId = req.user._id;

        const loans = await Loan.find({
                memberId
            })
            .populate(
                "groupId",
                "groupName groupCode"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: loans.length,
            loans
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getLoanDetails = async(req, res) => {
    try {

        const memberId = req.user._id;
        const { loanId } = req.params;

        const loan = await Loan.findOne({
                _id: loanId,
                memberId
            })
            .populate(
                "groupId",
                "groupName groupCode"
            );

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            });
        }

        return res.status(200).json({
            success: true,
            loan
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getLoanInstallments = async(
    req,
    res
) => {
    try {

        const memberId = req.user._id;
        const { loanId } = req.params;

        const loan = await Loan.findOne({
            _id: loanId,
            memberId
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            });
        }

        const installments =
            await Installment.find({
                loanId
            })
            .sort({
                installmentNumber: 1
            });

        return res.status(200).json({
            success: true,
            installments
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.payLoanInstallment = async(
    req,
    res
) => {
    try {

        const memberId = req.user._id;

        const {
            installmentId,
            screenshotUrl,
            upiId,
            additionalComments
        } = req.body;

        const installment =
            await Installment.findById(
                installmentId
            );

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Installment not found"
            });
        }

        const loan =
            await Loan.findById(
                installment.loanId
            );

        if (
            loan.memberId.toString() !==
            memberId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        if (
            installment.status ===
            "PAID"
        ) {
            return res.status(400).json({
                success: false,
                message: "Installment already paid"
            });
        }

        const existingRequest =
            await PaymentRequest.findOne({
                installmentId,
                status: "pending"
            });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "Payment request already pending"
            });
        }

        const paymentRequest =
            await PaymentRequest.create({
                userId: memberId,

                groupId: loan.groupId,

                adminId: loan.approvedBy,

                amount: installment.amount,

                month: `Loan EMI ${installment.installmentNumber}`,

                upiId,

                screenshotUrl,

                additionalComments,

                paymentType: "LOAN_INSTALLMENT",

                loanId: loan._id,

                installmentId: installment._id
            });

        return res.status(201).json({
            success: true,
            message: "Payment request submitted successfully",
            paymentRequest
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getPendingInstallments =
    async(req, res) => {

        try {

            const memberId =
                req.user._id;

            const loans =
                await Loan.find({
                    memberId
                });

            const loanIds =
                loans.map(
                    loan => loan._id
                );

            const installments =
                await Installment.find({
                    loanId: {
                        $in: loanIds
                    },
                    status: {
                        $ne: "PAID"
                    }
                })
                .populate(
                    "loanId",
                    "loanNumber"
                );

            return res.status(200).json({
                success: true,
                installments
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
exports.generateLoanInstallmentPaymentLink = async(req, res) => {
    try {
        const userId = req.user._id;

        const { installmentId } = req.params;

        const installment = await Installment.findById(
            installmentId
        );

        if (!installment) {
            return res.status(404).json({
                message: "Installment not found",
            });
        }

        const loan = await Loan.findById(
                installment.loanId
            )
            .populate(
                "memberId",
                "fullName mobileNumber"
            )
            .populate(
                "groupId",
                "groupName groupCode adminId"
            );

        if (!loan) {
            return res.status(404).json({
                message: "Loan not found",
            });
        }

        if (
            loan.memberId._id.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message: "You are not authorized to access this loan",
            });
        }

        if (installment.status === "PAID") {
            return res.status(400).json({
                message: "Installment already paid",
            });
        }

        const admin = await User.findById(
            loan.groupId.adminId
        );

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found",
            });
        }

        if (!admin.upiId) {
            return res.status(400).json({
                message: "Admin UPI ID not found",
            });
        }

        const amount = installment.amount;

        const transactionNote =
            `Loan ${loan.loanNumber} EMI ${installment.installmentNumber}`;

        const upiDeepLink =
            `upi://pay?pa=${encodeURIComponent(admin.upiId)}` +
            `&pn=${encodeURIComponent(admin.fullName)}` +
            `&am=${amount}` +
            `&cu=INR` +
            `&tn=${encodeURIComponent(transactionNote)}`;

        return res.status(200).json({
            message: "Loan payment page data fetched successfully",

            loan: {
                loanId: loan._id,
                loanNumber: loan.loanNumber,
                groupName: loan.groupId.groupName,
                groupCode: loan.groupId.groupCode,
            },

            installmentDetails: {
                installmentId: installment._id,
                installmentNumber: installment.installmentNumber,
                amount,
                dueDate: installment.dueDate,
                status: installment.status,
            },

            ownerAccount: {
                adminId: admin._id,
                adminName: admin.fullName,

                upiId: admin.upiId,

                bankAccountDetails: {
                    accountHolderName: admin.bankAccountDetails ?
                        admin.bankAccountDetails.accountHolderName : null,

                    bankName: admin.bankAccountDetails ?
                        admin.bankAccountDetails.bankName : null,

                    accountNumber: admin.bankAccountDetails ?
                        admin.bankAccountDetails.accountNumber : null,

                    ifscCode: admin.bankAccountDetails ?
                        admin.bankAccountDetails.ifscCode : null,
                },
            },

            paymentDetails: {
                upiDeepLink,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};