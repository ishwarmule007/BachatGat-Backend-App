const User = require('../models/User');
const Group = require('../models/Group');
const Notification = require('../models/notification')
const updateLanguage = async(req, res) => {

    try {
        const { preferredLanguage } = req.body;
        if (![
                "english",
                "hindi",
                "marathi"
            ].includes(preferredLanguage)) {
            return res.status(400).json({
                success: false,
                message: "Invalid language"
            });
        }
        const user =
            await User.findByIdAndUpdate(
                req.user._id, {
                    preferredLanguage
                }, {
                    new: true
                }
            ).select(
                "fullName preferredLanguage"
            );
        res.status(200).json({
            success: true,
            message: "Language updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }

};
const getGroupMembers = async(req, res) => {
    try {
        const { groupCode } = req.params;
        const group = await Group.findOne({
            groupCode
        }).populate(
            "members.userId",
            "fullName"
        );
        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }
        const members = group.members.map(
            (member) => ({
                memberId: member.userId ? member.userId._id : null,
                fullName: member.userId ? member.userId.fullName : null,
                roleInGroup: member.roleInGroup,
                status: member.status === "rejected" ?
                    "failed" : member.status || "pending",
            })
        );
        const adminUser = await User.findById(group.adminId);

        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: "Group admin not found"
            });
        }

        const admin = {
            adminId: group.adminId,
            fullName: adminUser.fullName,
            roleInGroup: "admin"
        };
        res.status(200).json({
            message: "Group members fetched successfully",
            admin,
            members
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch group members",
            error: error.message
        });

    }

};
const getGroupDetails = async(req, res) => {
    try {
        const { groupCode } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);

        const group = await Group.findOne({ groupCode })
            .populate("members.userId", "fullName mobileNumber gender role");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        let isAdmin = false;

        if (user.roleSelection === "admin") {
            isAdmin = group.adminId && group.adminId.toString() === userId.toString();
        }
        const member = group.members.find(
            (m) =>
            m.userId &&
            m.userId._id.toString() === userId.toString()
        );
        if (!isAdmin) {
            if (!member || member.status !== "approved") {
                return res.status(403).json({
                    message: "You are not approved member of this group"
                });
            }
        }

        const approvedMembers = group.members.filter(
            (m) => m.status === "approved"
        );

        const pendingMembers = group.members.filter(
            (m) => m.status === "pending"
        );

        const rejectedMembers = group.members.filter(
            (m) => m.status === "rejected"
        );

        return res.status(200).json({
            message: "Group details fetched successfully",
            group: {
                groupId: group._id,
                groupName: group.groupName,
                groupCode: group.groupCode,
                description: group.description,
                formationDate: group.formationDate,
                totalSaving: group.totalSaving || 0,
                //totalLoanGiven: group.totalLoanGiven || 0,
                totalMembers: approvedMembers.length,
                pendingMembers: pendingMembers.length,
                rejectedMembers: rejectedMembers.length,
                village: group.village,
                taluka: group.taluka,
                district: group.district,
                state: group.state,
                location: {
                    address: group.location ? group.location.address : null,
                    latitude: group.location ? group.location.latitude : null,
                    longitude: group.location ? group.location.longitude : null
                },
                audioCall: true,
                videoCall: true,

            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch group details",
            error: error.message
        });
    }
};
const getMyGroups = async(req, res) => {
    try {

        const userId = req.user._id;

        const user = await User.findById(userId);

        let groups = [];

        if (user.roleSelection === "admin") {

            groups = await Group.find({
                adminId: userId
            });

        } else {

            groups = await Group.find({
                members: {
                    $elemMatch: {
                        userId: userId,
                        status: "approved"
                    }
                }
            });
        }

        const formattedGroups = groups.map((group) => {

            const myMember = group.members.find(
                (member) =>
                member.userId.toString() ===
                userId.toString()
            );

            return {
                groupId: group._id,
                groupName: group.groupName,
                groupCode: group.groupCode,

                unreadCount: myMember ? myMember.unreadCount || 0 : 0,

                lastSeenMessageId: myMember ? myMember.lastSeenMessageId || null : null,

                isArchived: user.archivedGroups.some(
                    (id) =>
                    id.toString() ===
                    group._id.toString()
                ),

                formationDate: group.formationDate,

                totalSaving: group.totalSaving || 0,

                totalMembers: group.members.filter(
                    (member) =>
                    member.status === "approved"
                ).length,

                groupStatus: group.groupStatus || "active",

                memberStatus: myMember ? myMember.status || "approved" : "approved",
            };
        });

        return res.status(200).json({
            message: "Groups fetched successfully",
            groups: formattedGroups
        });

    } catch (error) {

        return res.status(500).json({
            message: error.message
        });
    }
};
// currenlty not using to be used in refreshed token , right now by frontend 
const logoutUser = async(req, res) => {
    try {

        res.clearCookie("token");

        res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Logout failed",
            error: error.message
        });
    }
};
const archiveGroup = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;

        await User.findByIdAndUpdate(userId, {
            $addToSet: { archivedGroups: groupId },
        });

        res.status(200).json({
            message: "Group archived successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const unarchiveGroup = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;

        await User.findByIdAndUpdate(userId, {
            $pull: { archivedGroups: groupId },
        });

        res.status(200).json({
            message: "Group unarchived successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getRecentActivity = async(req, res) => {
    try {
        const userId = req.user._id;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const notifications = await Notification.find({
                userId,
                createdAt: { $gte: startOfToday }
            })
            .populate("groupId", "groupName groupCode")
            .sort({ createdAt: -1 })
            .limit(10);

        const recentActivity = notifications.map((notification) => ({
            notificationId: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,

            group: notification.groupId ? {
                groupId: notification.groupId._id,
                groupName: notification.groupId.groupName,
                groupCode: notification.groupId.groupCode
            } : null,

            createdAt: notification.createdAt
        }));

        return res.status(200).json({
            message: "Recent activity fetched successfully",
            totalActivities: recentActivity.length,
            recentActivity
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
module.exports = { updateLanguage, getGroupMembers, getGroupDetails, getMyGroups, logoutUser, archiveGroup, unarchiveGroup, getRecentActivity };