const Announcement = require("../models/announcement");
const Group = require("../models/Group");

const createAnnouncement = async(req, res) => {
    try {
        const adminId = req.user._id;
        const { groupId } = req.params;

        const {
            title,
            message,
            type,
            meetingDate,
            reminderDate,
            isPinned
        } = req.body;

        const group = await Group.findOne({
            _id: groupId,
            adminId
        });

        if (!group) {
            return res.status(404).json({
                message: "Group not found or unauthorized"
            });
        }

        const announcement = await Announcement.create({
            groupId,
            adminId,
            title,
            message,
            type,
            meetingDate,
            reminderDate,
            isPinned
        });

        res.status(201).json({
            message: "Announcement created successfully",
            announcement
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create announcement",
            error: error.message
        });
    }
};

const getGroupAnnouncements = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;

        const group = await Group.findOne({
            _id: groupId,
            $or: [
                { adminId: userId },
                { "members.userId": userId }
            ]
        });

        if (!group) {
            return res.status(403).json({
                message: "You are not part of this group"
            });
        }

        const announcements = await Announcement.find({ groupId })
            .sort({ isPinned: -1, createdAt: -1 });

        res.status(200).json({
            message: "Announcements fetched successfully",
            announcements
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch announcements",
            error: error.message
        });
    }
};

const updateAnnouncement = async(req, res) => {
    try {
        const adminId = req.user._id;
        const { announcementId } = req.params;

        const announcement = await Announcement.findOneAndUpdate({
                _id: announcementId,
                adminId
            },
            req.body, { new: true }
        );

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found or unauthorized"
            });
        }

        res.status(200).json({
            message: "Announcement updated successfully",
            announcement
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update announcement",
            error: error.message
        });
    }
};

const deleteAnnouncement = async(req, res) => {
    try {
        const adminId = req.user._id;
        const { announcementId } = req.params;

        const announcement = await Announcement.findOneAndDelete({
            _id: announcementId,
            adminId
        });

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found or unauthorized"
            });
        }

        res.status(200).json({
            message: "Announcement deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete announcement",
            error: error.message
        });
    }
};

module.exports = {
    createAnnouncement,
    getGroupAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
};