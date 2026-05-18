const Group = require('../models/Group');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');
const Loan = require('../models/Loan');
const Contribution = require('../models/contribution');
const PaymentRequest = require('../models/PaymentRequest');
const geocodeAddress = require("../utils/geocodeAddress");
const sendSMS = require("../utils/sendSMS");

const registerAdmin = async(req, res) => {
    try {
        const {
            fullName,
            mobileNumber,
            password,
            gender,
            loginType
        } = req.body;
        if (!fullName || !mobileNumber || !gender || !loginType) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        if (!["password", "otp"].includes(loginType)) {
            return res.status(400).json({
                message: "Invalid loginType"
            });
        }
        if (loginType === "password" && !password) {
            return res.status(400).json({
                message: "Password is required for password login type"
            });
        }
        const existingUser = await User.findOne({
            mobileNumber
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        let hashedPassword = null;
        if (loginType === "password") {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const newUser = new User({
            fullName,
            userName: fullName,
            mobileNumber,
            password: hashedPassword,
            roleSelection: "admin",
            loginType,
            gender,
            groupIds: []
        });

        await newUser.save();

        const token = generateToken(newUser._id, newUser.roleSelection);

        res.status(201).json({
            message: "Admin registered successfully",
            token,
            loginType
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
const getAdminDashboardOverview = async(req, res) => {
    try {
        const adminId = req.user._id;

        const groups = await Group.find({
            $or: [
                { adminId: adminId },
                { "members.userId": adminId }
            ]
        });
        let totalMembers = 0;
        let pendingMembers = 0;
        let approvedMembers = 0;
        groups.forEach((group) => {
            group.members.forEach((member) => {
                totalMembers++;

                if (member.status === "pending") {
                    pendingMembers++;
                }

                if (member.status === "approved") {
                    approvedMembers++;
                }
            });
        });
        res.status(200).json({
            message: "Admin dashboard overview fetched successfully",
            totalGroups: groups.length,
            totalMembers,
            pendingMembers,
            approvedMembers
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch admin dashboard overview",
            error: error.message
        });
    }
};
const updatePaymentDetails = async(req, res) => {
    try {
        const {
            accountType,
            mobileNumberRegisteredWithBank,
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName,
        } = req.body;

        const admin = await User.findByIdAndUpdate(
            req.user._id, {
                $set: {
                    "bankAccountDetails.accountType": accountType,
                    "bankAccountDetails.mobileNumberRegisteredWithBank": mobileNumberRegisteredWithBank,
                    "bankAccountDetails.accountHolderName": accountHolderName,
                    "bankAccountDetails.accountNumber": accountNumber,
                    "bankAccountDetails.ifscCode": ifscCode,
                    "bankAccountDetails.bankName": bankName,
                },
            }, {
                new: true,
            }
        ).select("upiId bankAccountDetails");
        res.status(200).json({
            success: true,
            message: "Payment details updated successfully",
            paymentDetails: {
                "bankAccountDetails.accountType": accountType,
                "bankAccountDetails.mobileNumberRegisteredWithBank": mobileNumberRegisteredWithBank,
                "bankAccountDetails.accountHolderName": accountHolderName,
                "bankAccountDetails.accountNumber": accountNumber,
                "bankAccountDetails.ifscCode": ifscCode,
                "bankAccountDetails.bankName": bankName,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const updateUpiId = async(req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { upiId } = req.body;

        if (!upiId) {
            return res.status(400).json({
                message: "UPI ID is required"
            });
        }

        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

        if (!upiRegex.test(upiId)) {
            return res.status(400).json({
                message: "Invalid UPI ID format"
            });
        }

        const user = await User.findByIdAndUpdate(
            userId, { upiId }, { new: true }
        ).select("fullName mobileNumber upiId");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "UPI ID updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
const createGroup = async(req, res) => {
    try {
        const {
            groupName,
            groupCode,
            groupDuration,
            startDate,
            description,
            village,
            taluka,
            district,
            state,
            formationDate,
            groupDurationInYears
        } = req.body;
        if (!groupName || !groupCode) {
            return res.status(400).json({
                message: "groupName and groupCode are required"
            });
        }
        const existingName = await Group.findOne({ groupName });
        if (existingName) {
            return res.status(400).json({
                message: "Group name already exists"
            });
        }
        const existingCode = await Group.findOne({ groupCode });
        if (existingCode) {
            return res.status(400).json({
                message: "Group code already exists"
            });
        }
        if (!village || !taluka || !district || !state || !formationDate) {
            return res.status(400).json({
                message: "village, taluka, district, state and formationDate are required"
            });
        }
        const fullAddress =
            `${village}, ${taluka}, ${district}, ${state}, India`;

        const location = await geocodeAddress(fullAddress);
        const newGroup = new Group({
            groupName,
            groupCode,
            groupDuration,
            startDate,
            village,
            taluka,
            district,
            state,
            description,
            formationDate,
            location: {
                address: fullAddress,
                latitude: location.latitude,
                longitude: location.longitude
            },
            adminId: req.user._id,
            members: [{
                userId: req.user._id,
                roleInGroup: "admin",
                status: "approved"
            }],
            durationOfGroup: groupDurationInYears || 0
        });
        await newGroup.save();
        if (!req.user.groupIds.includes(newGroup._id)) {
            req.user.groupIds.push(newGroup._id);
            await req.user.save();
        }
        res.status(201).json({
            message: "Group created successfully",
            groupId: newGroup._id,

            groupName: newGroup.groupName,
            groupCode: newGroup.groupCode
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
const addMember = async(req, res) => {
    try {
        if (req.user.roleSelection !== "admin") {
            return res.status(403).json({
                message: "Only Admin can add member"
            });
        }
        const {
            groupCode,
            fullName,
            mobileNumber,
            dateOfBirth,
            address,
            monthlyContributionAmount
        } = req.body;
        if (!groupCode || !fullName || !mobileNumber || !dateOfBirth || !address || !monthlyContributionAmount) {
            return res.status(400).json({
                message: "groupCode, fullName, mobileNumber, dateOfBirth, address and monthlyContributionAmount are required"
            });
        }
        const group = await Group.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }
        if (!req.user.groupIds.some(id => id.toString() === group._id.toString())) {
            return res.status(403).json({
                message: "You are not allowed to add members in this group"
            });
        }
        const firstTwoLetters =
            fullName.trim().substring(0, 2).toLowerCase();

        const dob = new Date(dateOfBirth);
        const day =
            String(dob.getDate()).padStart(2, "0");
        const month =
            String(dob.getMonth() + 1).padStart(2, "0");
        const lastFourDigits =
            mobileNumber.slice(-4);
        const passkey =
            `${firstTwoLetters}${day}${lastFourDigits}`;

        let user = await User.findOne({ mobileNumber });
        let isNewUser = false;
        if (!user) {
            const hashedPassword = await bcrypt.hash(passkey, 10);
            user = new User({
                fullName,
                userName: fullName,
                mobileNumber,
                password: hashedPassword,
                roleSelection: "user",
                dateOfBirth,
                address,
                groupIds: []
            });
            await user.save();
            isNewUser = true;
        }
        const existingMember = group.members.find(
            m => m.userId.toString() === user._id.toString()
        );
        if (existingMember) {
            return res.status(400).json({
                message: `User already exists in this group with status: ${existingMember.status}`
            });
        }
        group.members.push({
            userId: user._id,
            monthlyContribution: monthlyContributionAmount,
            roleInGroup: "member",
            status: "pending"
        });
        await group.save();
        if (!user.groupIds.some(id => id.toString() === group._id.toString())) {
            user.groupIds.push(group._id);
            await user.save();
        }
        if (isNewUser) {
            const message = `Hello ${fullName}, you have been added to ${group.groupName}. Your username is your mobile number: ${mobileNumber}, and your password is : ${passkey}. Please login and accept or reject the group request.`;

            //await sendSMS(mobileNumber, message);
        }
        return res.status(200).json({
            message: isNewUser ?
                "New member created and group request sent successfully" : "Existing member group request sent successfully",
            status: "pending"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
const getAdminProfile = async(req, res) => {
    try {
        const adminId = req.user._id;
        const admin = await User.findById(adminId).select(
            "fullName mobileNumber roleSelection profilePicture upiId bankAccountDetails"
        );
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const groups = await Group.find({
            adminId,
        });
        const groupIds = groups.map(
            (group) => group._id
        );
        let totalMembers = 0;
        groups.forEach((group) => {
            totalMembers +=
                group.members ? group.members.length || 0 : 0;
        });
        const contributions =
            await Contribution.find({
                groupId: {
                    $in: groupIds,
                },
                status: "paid",
            });
        let totalCollection = 0;
        contributions.forEach((contribution) => {
            totalCollection += contribution.amount;
        });
        res.status(200).json({
            success: true,
            adminProfile: {
                fullName: admin.fullName,
                mobileNumber: admin.mobileNumber,
                role: admin.roleSelection,
                profilePicture: admin.profilePicture,
                upiId: admin.upiId || null,
                bankAccount: admin.bankAccountDetails || null,
                overview: {
                    totalGroups: groups.length,
                    totalMembers,
                    totalCollection,
                },
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const getAdminMemberProfile = async(req, res) => {
    try {
        const { groupCode, memberId } = req.params;
        const adminId = req.user._id;

        const group = await Group.findOne({
            groupCode,
            adminId,
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found or unauthorized",
            });
        }

        const memberExists = group.members.find(
            (member) => member.userId.toString() === memberId
        );

        if (!memberExists) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this group",
            });
        }

        const member = await User.findById(memberId).select(
            "fullName mobileNumber address dateofBirth profilePicture"
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found",
            });
        }

        const contributions = await Contribution.find({
            userId: memberId,
            groupId: group._id,
            status: "paid",
        });

        let totalContribution = 0;

        contributions.forEach((contribution) => {
            totalContribution += contribution.amount;
        });

        const loanSummaryData = await Loan.aggregate([{
                $match: {
                    userId: member._id,
                    groupId: group._id,
                    status: "approved",
                },
            },
            {
                $group: {
                    _id: null,
                    loanTaken: { $sum: "$amount" },
                    loanRemaining: { $sum: "$remainingAmount" },
                },
            },
        ]);

        const loanTaken =
            loanSummaryData.length > 0 ?
            loanSummaryData[0].loanTaken :
            0;

        const loanRemaining =
            loanSummaryData.length > 0 ?
            loanSummaryData[0].loanRemaining :
            0;

        res.status(200).json({
            success: true,
            memberProfile: {
                memberId: member._id,
                fullName: member.fullName,
                mobileNumber: member.mobileNumber,
                address: member.address || null,
                dateOfBirth: member.dateofBirth || null,
                profilePicture: member.profilePicture || null,

                memberSince: memberExists.joinedAt || null,

                contributionSummary: {
                    totalContribution,
                },

                loanSummary: {
                    loanTaken,
                    loanRemaining,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const getAdminPaymentDashboard = async(req, res) => {
    try {
        const adminId = req.user._id;

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

        const groups = await Group.find({ adminId });

        const groupIds = groups.map((g) => g._id);

        let totalReceivableThisMonth = 0;

        groups.forEach((group) => {
            group.members.forEach((member) => {
                if (member.status === "approved") {
                    totalReceivableThisMonth += member.monthlyContributionAmount || 0;
                }
            });
        });

        const receivedThisMonth = await Contribution.aggregate([{
                $match: {
                    groupId: { $in: groupIds },
                    month: currentMonth,
                    status: "paid",
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const pendingRequests = await PaymentRequest.find({
                adminId,
                status: "pending",
            })
            .populate("userId", "fullName mobileNumber profilePicture")
            .populate("groupId", "groupName groupCode")
            .sort({ createdAt: -1 });

        const formattedPendingRequests = pendingRequests.map((request) => ({
            requestId: request._id,

            memberId: request.userId ? request.userId._id : null,
            memberName: request.userId ? request.userId.fullName || "Unknown Member" : "Unknown Member",
            mobileNumber: request.userId ? request.userId.mobileNumber || "" : "",
            profilePicture: request.userId ? request.userId.profilePicture || "" : "",

            groupId: request.groupId ? request.groupId._id : null,
            groupName: request.groupId ? request.groupId.groupName || "" : "",
            groupCode: request.groupId ? request.groupId.groupCode || "" : "",

            amount: request.amount,
            month: request.month,
            upiId: request.upiId,
            screenshotUrl: request.screenshotUrl,
            extractedInfo: request.extractedInfo,
            status: request.status,
            createdAt: request.createdAt,
        }));

        const pendingAmount = formattedPendingRequests.reduce(
            (sum, request) => sum + (request.amount || 0),
            0
        );

        const receivedTotal = receivedThisMonth[0] ? receivedThisMonth[0].total || 0 : 0;
        const receivedCount = receivedThisMonth[0] ? receivedThisMonth[0].count || 0 : 0;

        res.status(200).json({
            message: "Admin payment dashboard fetched successfully",
            currentMonth,

            totalReceivableThisMonth,
            totalReceivedThisMonth: receivedTotal,
            remainingReceivableThisMonth: totalReceivableThisMonth - receivedTotal,
            totalTransactionsThisMonth: receivedCount,

            pendingPaymentRequests: formattedPendingRequests.length,
            pendingAmount,

            pendingRequests: formattedPendingRequests,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const removeMemberFromGroup = async(req, res) => {
    try {
        const adminId = req.user._id;
        const { groupId, memberId } = req.params;

        const group = await Group.findOne({
            _id: groupId,
            adminId,
        });

        if (!group) {
            return res.status(404).json({
                message: "Group not found or you are not admin of this group",
            });
        }

        const durationInYears = group.durationOfGroup;

        if (!durationInYears) {
            return res.status(400).json({
                message: "Group duration is not set for this group",
            });
        }

        const groupEndDate = new Date(group.createdAt);
        groupEndDate.setFullYear(groupEndDate.getFullYear() + durationInYears);

        if (new Date() < groupEndDate) {
            return res.status(400).json({
                message: "Group duration is not completed yet",
                groupEndDate,
            });
        }

        const member = group.members.find(
            (m) =>
            m.userId.toString() === memberId &&
            m.status === "approved"
        );

        if (!member) {
            return res.status(404).json({
                message: "Approved member not found in this group",
            });
        }

        const activeLoan = await Loan.findOne({
            groupId,
            userId: memberId,
            $or: [{
                    status: "pending",
                },
                {
                    status: "approved",
                    remainingAmount: { $gt: 0 },
                },
            ],
        });

        if (activeLoan) {
            return res.status(400).json({
                message: "Member cannot be removed because loan is pending or remaining loan amount is not zero",
            });
        }

        group.members = group.members.filter(
            (m) => m.userId.toString() !== memberId
        );

        await group.save();

        await User.findByIdAndUpdate(memberId, {
            $pull: { groupIds: group._id },
        });

        res.status(200).json({
            message: "Member removed from group successfully",
            groupId: group._id,
            removedMemberId: memberId,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
module.exports = {
    registerAdmin,
    addMember,
    getAdminDashboardOverview,
    createGroup,
    getAdminProfile,
    updatePaymentDetails,
    getAdminMemberProfile,
    getAdminPaymentDashboard,
    updateUpiId,
    removeMemberFromGroup
};