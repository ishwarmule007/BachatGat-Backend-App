const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
    createAnnouncement,
    getGroupAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
} = require("../controllers/announcementController");

router.post("/:groupId", authMiddleware, createAnnouncement);

router.get("/:groupId", authMiddleware, getGroupAnnouncements);

router.put("/update/:announcementId", authMiddleware, updateAnnouncement);

router.delete("/delete/:announcementId", authMiddleware, deleteAnnouncement);

module.exports = router;