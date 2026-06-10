const Group = require("../models/Group");
const User = require("../models/User");
const Contribution = require("../models/contribution");
const Loan = require("../models/Loan");
const PaymentRequest = require("../models/PaymentRequest");
const { createManyNotifications } = require("../utils/createNotification");
const getMemberGroupRequests = async(req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({
            members: {
                $elemMatch: {
                    userId: userId,
                    roleInGroup: "member",
                    status: "pending"
                }
            }
        });

        const requests = groups.map((group) => {
            const memberData = group.members.find(
                (member) => member.userId.toString() === userId.toString()
            );

            return {
                groupId: group._id,
                groupName: group.groupName,
                groupCode: group.groupCode,
                formationDate: group.formationDate,
                note: memberData.note || "",
                status: memberData.status
            };
        });

        res.status(200).json({
            message: "Pending group requests fetched successfully",
            requests
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch group requests",
            error: error.message
        });
    }
};
const getRejectedPaymentDetail = async(req, res) => {
    try {
        const userId = req.user._id;
        const { requestId } = req.params;

        const request = await PaymentRequest.findOne({
                _id: requestId,
                userId,
                status: "rejected",
            })
            .populate("groupId", "groupName groupCode")
            .populate("adminId", "fullName");

        if (!request) {
            return res.status(404).json({
                message: "Rejected payment request not found",
            });
        }

        res.status(200).json({
            message: "Rejected payment detail fetched successfully",
            data: {
                requestId: request._id,
                rejectedOn: request.rejectedAt || request.updatedAt,
                rejectedBy: request.adminId ? request.adminId.fullName || "Admin" : "Admin",
                groupName: request.groupId ? request.groupId.groupName || "" : "",
                amount: request.amount,
                month: request.month,
                upiId: request.upiId,
                reason: request.rejectionReason,
                additionalComments: request.additionalComments,
                oldScreenshotUrl: request.screenshotUrl,
                status: request.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const acceptGroupRequest = async(req, res) => {
    try {
        const { groupCode } = req.body;
        const userId = req.user._id;

        if (!groupCode) {
            return res.status(400).json({
                message: "Group code is required"
            });
        }

        const group = await Group.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const member = group.members.find(
            (member) => member.userId.toString() === userId.toString()
        );

        if (!member) {
            return res.status(404).json({
                message: "No request found for this group"
            });
        }

        if (member.status !== "pending") {
            return res.status(400).json({
                message: `Request is already ${member.status}`
            });
        }

        member.status = "approved";
        member.joinedAt = new Date();

        await group.save();
        const user = await User.findById(userId);

        const approvedMembers = group.members.filter(
            member => member.status === "approved"
        );

        const notifications = approvedMembers.map(member => ({
            userId: member.userId,
            groupId: group._id,
            title: "New member added",
            message: `${user.fullName} has joined ${group.groupName}`,
            type: "member_joined"
        }));

        await createManyNotifications(notifications);

        res.status(200).json({
            message: "Group request accepted successfully",
            groupCode,
            status: "approved"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to accept group request",
            error: error.message
        });
    }
};

const rejectGroupRequest = async(req, res) => {
    try {
        const { groupCode } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId).select("fullName");
        if (!groupCode) {
            return res.status(400).json({
                message: "Group code is required"
            });
        }

        const group = await Group.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const member = group.members.find(
            (member) => member.userId.toString() === userId.toString()
        );

        if (!member) {
            return res.status(404).json({
                message: "No request found for this group"
            });
        }

        if (member.status !== "pending") {
            return res.status(400).json({
                message: `Request is already ${member.status}`
            });
        }

        member.status = "rejected";

        await group.save();
        await createManyNotifications([{
            userId: group.adminId,
            groupId: group._id,
            title: "Invitation rejected",
            message: `${user.fullName} rejected the invitation for ${group.groupName}`,
            type: "invite_rejected"
        }]);
        res.status(200).json({
            message: "Group request rejected successfully",
            groupCode,
            status: "rejected"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to reject group request",
            error: error.message
        });
    }
};
const User = require("../../models/User");
const Group = require("../../models/Group");
const Contribution = require("../../models/Contribution");

const getMemberHomeDashboard = async(req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const user = await User.findById(userId).select(
            "fullName groupIds"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        const groups = await Group.find({
            members: {
                $elemMatch: {
                    userId,
                    status: "approved"
                }
            }
        });

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;
        const lastDateOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        );

        let totalPaidThisMonth = 0;
        let pendingAmountThisMonth = 0;
        let totalPaidAllTime = 0;
        let upcomingCollectionsThisMonth = 0;

        const groupData = [];
        const allContributions = await Contribution.find({
            userId
        });

        for (const group of groups) {
            const member = group.members.find(
                (m) =>
                m.userId.toString() ===
                userId.toString()
            );
            const monthlyContribution =
                member ? member.monthlyContribution || 0 : 0;
            const paidThisMonth = allContributions.find(
                (c) =>
                c.groupId.toString() ===
                group._id.toString() &&
                c.month === currentMonth &&
                c.status === "paid"
            );
            const allTimePaid = allContributions
                .filter(
                    (c) =>
                    c.groupId.toString() ===
                    group._id.toString() &&
                    c.status === "paid"
                )
                .reduce(
                    (sum, item) => sum + item.amount,
                    0
                );
            if (paidThisMonth) {
                totalPaidThisMonth +=
                    paidThisMonth.amount;
            } else {
                pendingAmountThisMonth +=
                    monthlyContribution;

                upcomingCollectionsThisMonth += 1;
            }
            totalPaidAllTime += allTimePaid;
            const contributionDueToday =
                now.getDate() ===
                lastDateOfMonth.getDate();

            groupData.push({
                groupId: group._id,

                groupName: group.groupName,

                totalMembers: group.members.filter(
                    (m) => m.status === "approved"
                ).length,

                joinedAt: member ? member.joinedAt || null : null,

                monthlyContribution,

                nextCollectionDate: lastDateOfMonth,

                contributionDueToday
            });
        }
        const recentActivity = await Contribution.find({
                userId,
                status: "paid"
            })
            .populate("groupId", "groupName")
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            message: "Home dashboard fetched successfully",

            user: {
                fullName: user.fullName
            },

            groups: groupData,

            summary: {
                totalPaidThisMonth,
                pendingAmountThisMonth,
                totalPaidAllTime,
                upcomingCollectionsThisMonth
            },

            recentActivity: recentActivity.map(
                (item) => ({
                    type: "monthly_contribution",

                    title: "Monthly Contribution",

                    groupName: item.groupId ?
                        item.groupId.groupName : null,

                    date: item.createdAt,

                    amount: item.amount
                })
            )
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
const getMemberProfile = async(req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const user = await User.findById(userId).select(
            "fullName mobileNumber address dateofBirth  groupIds"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const activeGroup = await Group.findOne({
            "members.userId": userId,
            "members.status": "approved"
        }).select("groupName members");

        const memberData = activeGroup ? activeGroup.members ? activeGroup.members.find(
            (member) => member.userId.toString() === userId.toString()
        ) : null : null;

        const loanSummary = await Loan.aggregate([{
                $match: {
                    userId: user._id
                }
            },
            {
                $group: {
                    _id: null,
                    loanTaken: { $sum: "$loanAmount" },
                    loanPaid: { $sum: "$paidAmount" }
                }
            }
        ]);

        const loanTaken = loanSummary[0] ? loanSummary[0].loanTaken || 0 : 0;
        const loanPaid = loanSummary[0] ? loanSummary[0].loanPaid || 0 : 0;
        const remainingToPay = loanTaken - loanPaid;

        res.status(200).json({
            message: "Member profile fetched successfully",
            profile: {
                name: user.fullName,
                status: memberData ? memberData.status : null,
                memberId: memberData ? memberData.membershipId || null : null
            },


            personalInformation: {
                memberName: user.fullName,
                mobileNumber: user.mobileNumber,
                address: user.address || null,
                dateOfBirth: user.dateOfBirth
            },

            loanSummary: {
                loanTaken,
                loanPaid,
                remainingToPay,
                status: remainingToPay > 0 ?
                    "Keep going! You're doing great." : "No pending loan"
            },

            memberSince: memberData ? memberData.joinedAt || user.createdAt : null

        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
const leaveGroup = async(req, res) => {
    try {
        const { groupId } = req.body;
        const userId = req.user._id;

        if (!groupId) {
            return res.status(400).json({
                message: "Group ID is required"
            });
        }
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const member = group.members.find(
            m =>
            m.userId.toString() === userId.toString() &&
            m.status === "approved"
        );

        if (!member) {
            return res.status(404).json({
                message: "You are not an approved member of this group"
            });
        }
        const existingLoanApplication = await Loan.findOne({
            groupId,
            userId,
            status: {
                $in: [
                    "pending",
                    "approved",
                    "active"
                ]
            }
        });

        if (existingLoanApplication) {
            return res.status(400).json({
                message: "You cannot leave the group while having an active loan application"
            });
        }
        group.members = group.members.filter(
            (member) =>
            member.userId.toString() !== userId.toString()
        );

        await group.save();

        return res.status(200).json({
            message: "Left group successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
module.exports = {
    getMemberGroupRequests,
    acceptGroupRequest,
    rejectGroupRequest,
    getMemberHomeDashboard,
    getMemberProfile,
    getRejectedPaymentDetail,
    leaveGroup
};