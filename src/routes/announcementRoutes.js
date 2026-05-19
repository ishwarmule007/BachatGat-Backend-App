const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
    createAnnouncement,
    getGroupAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
} = require("../controllers/announcementController");
/**
 * @swagger
 * /api/announcement/{groupId}:
 *   post:
 *     summary: Create a new announcement in a group
 *     tags: [Announcement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Monthly Meeting"
 *               message:
 *                 type: string
 *                 example: "Meeting will be held on Sunday at 5 PM"
 *               type:
 *                 type: string
 *                 example: "meeting"
 *               meetingDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-25T17:00:00.000Z"
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-24T17:00:00.000Z"
 *               isPinned:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Group not found or unauthorized
 *       500:
 *         description: Failed to create announcement
 */
router.post("/:groupId", authMiddleware, createAnnouncement);
/**
 * @swagger
 * /api/announcement/get/{groupId}:
 *   get:
 *     summary: Get all announcements of a group
 *     tags: [Announcement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     responses:
 *       200:
 *         description: Announcements fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Announcements fetched successfully"
 *                 announcements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       title:
 *                         type: string
 *                         example: "Monthly Meeting"
 *                       message:
 *                         type: string
 *                         example: "Meeting will be held on Sunday at 5 PM"
 *                       type:
 *                         type: string
 *                         example: "meeting"
 *                       meetingDate:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       reminderDate:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       isPinned:
 *                         type: boolean
 *                         example: true
 *                       groupId:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       adminId:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567891"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: You are not part of this group
 *       500:
 *         description: Failed to fetch announcements
 */
router.get("/get/:groupId", authMiddleware, getGroupAnnouncements);
/**
 * @swagger
 * /api/announcement/update/{announcementId}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Meeting Notice"
 *               message:
 *                 type: string
 *                 example: "Meeting timing changed to 6 PM"
 *               type:
 *                 type: string
 *                 example: "meeting"
 *               meetingDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-25T18:00:00.000Z"
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-24T18:00:00.000Z"
 *               isPinned:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Announcement not found or unauthorized
 *       500:
 *         description: Failed to update announcement
 */
router.put("/update/:announcementId", authMiddleware, updateAnnouncement);
/**
 * @swagger
 * /api/announcement/delete/{announcementId}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Announcement not found or unauthorized
 *       500:
 *         description: Failed to delete announcement
 */
router.delete("/delete/:announcementId", authMiddleware, deleteAnnouncement);

module.exports = router;