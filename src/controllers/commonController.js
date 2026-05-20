const User = require('../models/User');
const Group = require('../models/Group');
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
        res.status(200).json({
            message: "Group members fetched successfully",
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
        const group = await Group.findOne({ groupCode }).populate(
            "members.userId",
            "fullName mobileNumber gender role"
        );
        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }
        const member = group.members.find((m) => m.userId && m.userId._id.toString() === req.user._id.toString());
        if (!member || member.status !== "approved") {
            return res.status(403).json({
                message: "You are not approved member of this group"
            });
        }
        const approvedMembers = group.members.filter(
            (member) => member.status === "approved"
        );
        const pendingMembers = group.members.filter(
            (member) => member.status === "pending"
        );
        const rejectedMembers = group.members.filter(
            (member) => member.status === "rejected"
        );
        res.status(200).json({
            message: "Group details fetched successfully",
            group: {
                groupId: group._id,
                groupName: group.groupName,
                groupCode: group.groupCode,
                description: group.description,
                formationDate: group.formationDate,
                totalSaving: group.totalSaving || 0,
                totalLoanGiven: group.totalLoanGiven || 0,
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
                videoCall: true
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch group details",
            error: error.message
        });
    }
};
const getMyGroups = async(req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({
            $or: [
                { adminId: userId },
                { "members.userId": userId }
            ]
        }).sort({ createdAt: -1 });

        const formattedGroups = groups.map((group) => {
            const approvedMembers = group.members.filter(
                (member) => member.status === "approved"
            );

            return {
                groupId: group._id,
                groupName: group.groupName,
                groupCode: group.groupCode,
                totalMembers: approvedMembers.length,
                totalSaving: group.totalSaving || 0,
                formationDate: group.formationDate,
                location: group.location
            };
        });

        res.status(200).json({
            message: "Groups fetched successfully",
            groups: formattedGroups
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch groups",
            error: error.message
        });
    }
};
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
const starGroup = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;

        await User.findByIdAndUpdate(userId, {
            $addToSet: { starredGroups: groupId },
        });

        res.status(200).json({
            message: "Group starred successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const unstarGroup = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;

        await User.findByIdAndUpdate(userId, {
            $pull: { starredGroups: groupId },
        });

        res.status(200).json({
            message: "Group unstarred successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
module.exports = { updateLanguage, getGroupMembers, getGroupDetails, getMyGroups, logoutUser, starGroup, unstarGroup, archiveGroup, unarchiveGroup };