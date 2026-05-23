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
            .populate("starredBy.userId", "fullName mobileNumber roleSelection")
            .sort({ createdAt: 1 });

        const formattedMessages = messages.map((msg) => ({
            ...msg.toObject(),
            isStarredByMe: msg.starredBy.some(
                (star) => star.userId._id.toString() === userId.toString()
            ),
        }));

        res.status(200).json({
            message: "Messages fetched successfully",
            groupCode: group.groupCode,
            clearedAt: clearData ? clearData.clearedAt : null,
            totalMessages: formattedMessages.length,
            messages: formattedMessages,
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

const uploadChatMedia = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "File is required",
            });
        }

        const file = req.file;

        const isImage =
            file.mimetype.startsWith("image");

        const isVideo =
            file.mimetype.startsWith("video");

        if (!isImage && !isVideo) {
            return res.status(400).json({
                message: "Only image and video files are allowed",
            });
        }

        if (
            isImage &&
            file.size > 1 * 1024 * 1024
        ) {
            return res.status(400).json({
                message: "Image size should be less than or equal to 1 MB",
            });
        }

        if (
            isVideo &&
            file.size > 10 * 1024 * 1024
        ) {
            return res.status(400).json({
                message: "Video size should be less than or equal to 10 MB",
            });
        }

        const uploadResult =
            await new Promise((resolve, reject) => {
                const uploadStream =
                    cloudinary.uploader.upload_stream({
                            folder: "chat-media",

                            resource_type: isVideo ?
                                "video" : "image",
                        },
                        (error, result) => {
                            if (error) {
                                return reject(error);
                            }

                            resolve(result);
                        }
                    );

                streamifier
                    .createReadStream(file.buffer)
                    .pipe(uploadStream);
            });

        return res.status(200).json({
            message: "Media uploaded successfully",

            mediaUrl: uploadResult.secure_url,

            cloudinaryPublicId: uploadResult.public_id,

            mediaSize: file.size,

            messageType: isVideo ?
                "video" : "image",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to upload media",

            error: error.message,
        });
    }
};
module.exports = {
    getGroupMessages,
    clearChatForMe,
    uploadChatMedia
};