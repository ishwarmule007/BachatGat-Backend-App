const Loan = require("../models/Loan");
const Installment = require("../models/Installment");
const Group = require("../models/Group");
const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
const LoanRequest = require("../models/loanRequest");


//new code
const requestLoan = async(
    req,
    res
) => {

    try {

        const memberId =
            req.user._id;

        const {
            groupId,
            requestedAmount,
            requestedDurationMonths,
            purpose,
            repaymentType
        } = req.body;

        if (!groupId ||
            !requestedAmount ||
            !requestedDurationMonths ||
            !repaymentType
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        const group =
            await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const member =
            group.members.find(
                m =>
                m.userId.toString() ===
                memberId.toString() &&
                m.status === "approved"
            );

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You are not a member"
            });
        }

        const request =
            await LoanRequest.create({

                memberId,

                groupId,

                requestedAmount,

                requestedDurationMonths,

                purpose,

                repaymentType
            });

        return res.status(201).json({
            success: true,
            message: "Loan request submitted successfully",
            request
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getAllLoanRequests =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const groups =
                await Group.find({
                    adminId
                });

            const groupIds =
                groups.map(
                    group => group._id
                );

            const requests =
                await LoanRequest.find({

                    groupId: {
                        $in: groupIds
                    }

                })
                .populate(
                    "memberId",
                    "fullName mobileNumber"
                )
                .populate(
                    "groupId",
                    "groupName groupCode"
                )
                .sort({
                    createdAt: -1
                });

            return res.status(200).json({

                success: true,

                count: requests.length,

                requests

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };

const getLoanRequestDetails =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const { loanRequestId } =
            req.params;

            const request =
                await LoanRequest.findById(
                    loanRequestId
                )
                .populate(
                    "memberId",
                    `
                fullName
                mobileNumber
                bankAccountDetails
                address
                `
                )
                .populate(
                    "groupId",
                    `
                groupName
                groupCode
                adminId
                `
                );

            if (!request) {
                return res.status(404).json({

                    success: false,

                    message: "Loan request not found"
                });
            }

            if (
                request.groupId.adminId.toString() !==
                adminId.toString()
            ) {
                return res.status(403).json({

                    success: false,

                    message: "Unauthorized access"
                });
            }

            return res.status(200).json({

                success: true,

                request

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
const sendLoanProposal =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const {
                loanRequestId,
                approvedAmount,
                repaymentType,
                months,
                proposalMessage
            } = req.body;

            const request =
                await LoanRequest.findById(
                    loanRequestId
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Loan request not found"
                });
            }

            const group =
                await Group.findById(
                    request.groupId
                );

            if (
                group.adminId.toString() !==
                adminId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            if (
                request.requestStatus !==
                "PENDING"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Request already processed"
                });
            }

            request.adminProposal = {

                approvedAmount,

                repaymentType,

                months,

                proposalMessage,

                proposedAt: new Date()
            };

            request.requestStatus =
                "PROPOSAL_SENT";

            await request.save();

            return res.status(200).json({
                success: true,
                message: "Proposal sent successfully",
                request
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
const rejectLoanProposalByAdmin =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const {
                loanRequestId,
                rejectionReason
            } = req.body;

            if (!loanRequestId) {
                return res.status(400).json({
                    success: false,
                    message: "Loan request id is required"
                });
            }

            const request =
                await LoanRequest.findById(
                    loanRequestId
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Loan request not found"
                });
            }

            const group =
                await Group.findById(
                    request.groupId
                );

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: "Group not found"
                });
            }

            if (
                group.adminId.toString() !==
                adminId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }

            if (
                request.requestStatus !==
                "PENDING"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Request already processed"
                });
            }

            request.requestStatus =
                "REJECTED";

            request.rejectionReason =
                rejectionReason || "";

            await request.save();

            return res.status(200).json({
                success: true,
                message: "Loan request rejected successfully",
                request
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const acceptLoanProposal =
    async(req, res) => {

        try {

            const memberId =
                req.user._id;

            const { loanRequestId } =
            req.body;

            if (!loanRequestId) {
                return res.status(400).json({
                    success: false,
                    message: "Loan request id is required"
                });
            }

            const request =
                await LoanRequest.findById(
                    loanRequestId
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Loan request not found"
                });
            }

            if (
                request.memberId.toString() !==
                memberId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }

            if (
                request.requestStatus !==
                "PROPOSAL_SENT"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Proposal not available"
                });
            }

            request.requestStatus =
                "ACCEPTED";

            request.memberResponseAt =
                new Date();

            await request.save();

            return res.status(200).json({
                success: true,
                message: "Loan proposal accepted successfully",
                request
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const rejectLoanProposalbyMember =
    async(req, res) => {

        try {

            const memberId =
                req.user._id;

            const {
                loanRequestId,
                rejectionReason
            } = req.body;

            if (!loanRequestId) {
                return res.status(400).json({
                    success: false,
                    message: "Loan request id is required"
                });
            }

            const request =
                await LoanRequest.findById(
                    loanRequestId
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Loan request not found"
                });
            }

            if (
                request.memberId.toString() !==
                memberId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }

            if (
                request.requestStatus !==
                "PROPOSAL_SENT"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Proposal not available"
                });
            }

            request.requestStatus =
                "REJECTED";

            request.rejectionReason =
                rejectionReason || "";

            request.memberResponseAt =
                new Date();

            await request.save();

            return res.status(200).json({
                success: true,
                message: "Loan proposal rejected successfully",
                request
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
const getAcceptedLoanProposals =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const groups =
                await Group.find({
                    adminId
                });

            const groupIds =
                groups.map(
                    group => group._id
                );

            const requests =
                await LoanRequest.find({

                    groupId: {
                        $in: groupIds
                    },

                    requestStatus: "ACCEPTED"

                })
                .populate(
                    "memberId",
                    "fullName mobileNumber"
                )
                .populate(
                    "groupId",
                    "groupName groupCode"
                )
                .sort({
                    updatedAt: -1
                });

            return res.status(200).json({

                success: true,

                count: requests.length,

                requests

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
const createLoan =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const {
                loanRequestId,
                interestPercent,
                penaltyPerDay
            } = req.body;

            if (!loanRequestId ||
                interestPercent === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Required fields missing"
                });
            }

            const request =
                await LoanRequest.findById(
                    loanRequestId
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Loan request not found"
                });
            }

            if (
                request.requestStatus !==
                "ACCEPTED"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Proposal not accepted yet"
                });
            }

            const group =
                await Group.findById(
                    request.groupId
                );

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: "Group not found"
                });
            }

            if (
                group.adminId.toString() !==
                adminId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                });
            }

            const proposal =
                request.adminProposal;

            const approvedAmount =
                proposal.approvedAmount;

            const months =
                proposal.months;

            const repaymentType =
                proposal.repaymentType;

            const interestAmount =
                (approvedAmount *
                    interestPercent) / 100;

            const totalAmount =
                approvedAmount +
                interestAmount;

            const monthlyEMI =
                Number(
                    (
                        totalAmount / months
                    ).toFixed(2)
                );

            const loanStartDate =
                new Date();

            const loanEndDate =
                new Date(loanStartDate);

            loanEndDate.setMonth(
                loanEndDate.getMonth() +
                months
            );

            const loan =
                await Loan.create({

                    loanNumber: "LN" + Date.now(),

                    groupId: request.groupId,

                    memberId: request.memberId,

                    loanAmount: approvedAmount,

                    interestPercent,

                    interestAmount,

                    totalAmount,

                    months,

                    repaymentType,

                    monthlyEMI,

                    penaltyPerDay: penaltyPerDay || 0,

                    loanStartDate,

                    loanEndDate,

                    paidAmount: 0,

                    remainingAmount: totalAmount,

                    loanStatus: "ACTIVE",

                    approvedBy: adminId
                });

            const originalDay =
                loanStartDate.getDate();

            for (
                let i = 1; i <= months; i++
            ) {

                const dueDate =
                    new Date(
                        loanStartDate
                    );

                dueDate.setMonth(
                    dueDate.getMonth() +
                    (i - 1)
                );

                const lastDay =
                    new Date(
                        dueDate.getFullYear(),
                        dueDate.getMonth() + 1,
                        0
                    ).getDate();

                dueDate.setDate(
                    Math.min(
                        originalDay,
                        lastDay
                    )
                );

                await Installment.create({

                    loanId: loan._id,

                    installmentNumber: i,

                    amount: monthlyEMI,

                    dueDate
                });
            }

            request.requestStatus =
                "FINALIZED";

            await request.save();

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
const getLoanDetailsByAdmin =
    async(req, res) => {

        try {

            const adminId =
                req.user._id;

            const { loanId } =
            req.params;

            const loan =
                await Loan.findById(
                    loanId
                )
                .populate(
                    "memberId",
                    `
                fullName
                mobileNumber
                bankAccountDetails
                address
                `
                )
                .populate(
                    "groupId",
                    `
                groupName
                groupCode
                adminId
                `
                );

            if (!loan) {
                return res.status(404).json({

                    success: false,

                    message: "Loan not found"
                });
            }

            if (
                loan.groupId.adminId.toString() !==
                adminId.toString()
            ) {
                return res.status(403).json({

                    success: false,

                    message: "Unauthorized access"
                });
            }

            const installments =
                await Installment.find({

                    loanId: loan._id

                }).sort({
                    installmentNumber: 1
                });

            return res.status(200).json({

                success: true,

                loan,

                installments

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
const getLoanDetailsByMember =
    async(req, res) => {

        try {

            const memberId =
                req.user._id;

            const { loanId } =
            req.params;

            const loan =
                await Loan.findById(
                    loanId
                )
                .populate(
                    "groupId",
                    `
                groupName
                groupCode
                `
                );

            if (!loan) {
                return res.status(404).json({

                    success: false,

                    message: "Loan not found"
                });
            }

            if (
                loan.memberId.toString() !==
                memberId.toString()
            ) {
                return res.status(403).json({

                    success: false,

                    message: "Unauthorized access"
                });
            }

            const installments =
                await Installment.find({

                    loanId: loan._id

                }).sort({
                    installmentNumber: 1
                });

            return res.status(200).json({

                success: true,

                loan,

                installments

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
const getMyLoans =
    async(req, res) => {

        try {

            const memberId =
                req.user._id;

            const loans =
                await Loan.find({

                    memberId

                })
                .populate(
                    "groupId",
                    `
                groupName
                groupCode
                `
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

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
const getGroupLoans =
    async(req, res) => {

        try {

            const userId =
                req.user._id;

            const { groupId } =
            req.params;

            const group =
                await Group.findById(
                    groupId
                );

            if (!group) {
                return res.status(404).json({

                    success: false,

                    message: "Group not found"
                });
            }

            const isAdmin =
                group.adminId.toString() ===
                userId.toString();

            const isMember =
                group.members.some(
                    member =>
                    member.userId.toString() ===
                    userId.toString()
                );

            if (!isAdmin &&
                !isMember
            ) {
                return res.status(403).json({

                    success: false,

                    message: "Unauthorized access"
                });
            }

            const loans =
                await Loan.find({

                    groupId

                })
                .populate(
                    "memberId",
                    `
                fullName
                mobileNumber
                `
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

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
const getLoanRepaymentSchedule =
    async(req, res) => {

        try {

            const memberId =
                req.user._id;

            const { loanId } =
            req.params;

            const loan =
                await Loan.findById(
                    loanId
                );

            if (!loan) {
                return res.status(404).json({

                    success: false,

                    message: "Loan not found"
                });
            }

            if (
                loan.memberId.toString() !==
                memberId.toString()
            ) {
                return res.status(403).json({

                    success: false,

                    message: "Unauthorized access"
                });
            }

            const {
                loanAmount,
                interestPercent,
                months,
                repaymentType
            } = loan;

            const schedule = [];

            if (
                repaymentType ===
                "INSTALLMENT"
            ) {

                const principalPerMonth =
                    Number(
                        (
                            loanAmount /
                            months
                        ).toFixed(2)
                    );

                let remainingPrincipal =
                    loanAmount;

                for (
                    let i = 1; i <= months; i++
                ) {

                    const interest =
                        Number(
                            (
                                remainingPrincipal *
                                interestPercent
                            ) / 100
                        );

                    const total =
                        Number(
                            (
                                principalPerMonth +
                                interest
                            ).toFixed(2)
                        );

                    schedule.push({

                        month: i,

                        principal: principalPerMonth,

                        interest,

                        installment: total,

                        remainingPrincipal
                    });

                    remainingPrincipal -=
                        principalPerMonth;
                }

            } else {

                const monthlyInterest =
                    Number(
                        (
                            loanAmount *
                            interestPercent
                        ) / 100
                    );

                for (
                    let i = 1; i <= months; i++
                ) {

                    let principal = 0;

                    if (i === months) {
                        principal =
                            loanAmount;
                    }

                    const total =
                        principal +
                        monthlyInterest;

                    schedule.push({

                        month: i,

                        principal,

                        interest: monthlyInterest,

                        installment: total,

                        remainingPrincipal: loanAmount
                    });
                }
            }

            return res.status(200).json({

                success: true,

                loan: {

                    loanNumber: loan.loanNumber,

                    loanAmount: loan.loanAmount,

                    interestPercent: loan.interestPercent,

                    months: loan.months,

                    repaymentType: loan.repaymentType
                },

                schedule

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });
        }
    };
module.exports = {
    requestLoan,
    sendLoanProposal,
    rejectLoanProposalByAdmin,
    getLoanRepaymentSchedule,
    getAllLoanRequests,
    getLoanRequestDetails,
    acceptLoanProposal,
    rejectLoanProposalbyMember,
    getAcceptedLoanProposals,
    createLoan,
    getLoanDetailsByAdmin,
    getLoanDetailsByMember,
    getMyLoans,
    getGroupLoans,
}