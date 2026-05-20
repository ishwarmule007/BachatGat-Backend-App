const Group = require("../models/Group");
const Message = require("../models/Message");
const ChatClear = require("../models/ChatClear");

const getGroupMessages = async(req, res) => {
    try {
        const { groupCode } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        const isApprovedMember = group.members.some(
            (m) =>
            m.userId &&
            m.userId.toString() === userId.toString() &&
            m.status === "approved"
        );

        if (!isApprovedMember) {
            return res.status(403).json({
                message: "You are not approved member of this group",
            });
        }

        const clearData = await ChatClear.findOne({
            userId,
            groupId: group._id,
        });

        const messageFilter = {
            groupId: group._id,
            isDeleted: false,
        };

        if (clearData) {
            messageFilter.createdAt = {
                $gt: clearData.clearedAt,
            };
        }

        const messages = await Message.find(messageFilter)
            .populate("senderId", "fullName mobileNumber roleSelection")
            .populate("reactions.userId", "fullName mobileNumber roleSelection")
            .sort({ createdAt: 1 });

        res.status(200).json({
            message: "Messages fetched successfully",
            groupCode: group.groupCode,
            clearedAt: clearData ? clearData.clearedAt : null,
            totalMessages: messages.length,
            messages,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

const clearChatForMe = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupCode } = req.params;

        const group = await Group.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isApprovedMember = group.members.some(
            (m) =>
            m.userId &&
            m.userId.toString() === userId.toString() &&
            m.status === "approved"
        );

        if (!isApprovedMember) {
            return res.status(403).json({
                message: "You are not approved member of this group",
            });
        }

        const clearData = await ChatClear.findOneAndUpdate({ userId, groupId: group._id }, { clearedAt: new Date() }, { new: true, upsert: true });

        res.status(200).json({
            message: "Chat cleared for you successfully",
            groupCode: group.groupCode,
            groupId: group._id,
            clearedAt: clearData.clearedAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGroupMessages,
    clearChatForMe
};