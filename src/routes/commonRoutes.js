const express = require("express");
const router = express.Router();

const { updateLanguage, getGroupMembers, getGroupDetails, getMyGroups, logoutUser, archiveGroup, unarchiveGroup } = require("../controllers/commonController");

const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/common/update-language:
 *   put:
 *     summary: Update preferred language of user
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferredLanguage
 *             properties:
 *               preferredLanguage:
 *                 type: string
 *                 enum: [english, hindi, marathi]
 *                 example: "english"
 *     responses:
 *       200:
 *         description: Language updated successfully
 *       400:
 *         description: Invalid language
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Internal server error
 */
router.put(
    "/update-language",
    authMiddleware,
    updateLanguage
);

/**
 * @swagger
 * /api/common/groups/{groupCode}/members:
 *   get:
 *     summary: Get all members of a group
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "SBG-001"
 *     responses:
 *       200:
 *         description: Group members fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group members fetched successfully"
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       memberId:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       fullName:
 *                         type: string
 *                         example: "Rahul Sharma"
 *                       roleInGroup:
 *                         type: string
 *                         example: "member"
 *                       status:
 *                         type: string
 *                         example: "approved"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Group not found
 *       500:
 *         description: Failed to fetch group members
 */
router.get(
    "/groups/:groupCode/members",
    authMiddleware,
    getGroupMembers
);

/**
 * @swagger
 * /api/common/groups/{groupCode}/details:
 *   get:
 *     summary: Get detailed information of a group
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "SBG-001"
 *     responses:
 *       200:
 *         description: Group details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group details fetched successfully"
 *                 group:
 *                   type: object
 *                   properties:
 *                     groupId:
 *                       type: string
 *                       example: "665c1f9a2b7d8f1234567890"
 *                     groupName:
 *                       type: string
 *                       example: "Developer Group"
 *                     groupCode:
 *                       type: string
 *                       example: "SBG-001"
 *                     description:
 *                       type: string
 *                       example: "Developer Group"
 *                     formationDate:
 *                       type: string
 *                       format: date
 *                     totalSaving:
 *                       type: number
 *                       example: 50000
 *                     totalLoanGiven:
 *                       type: number
 *                       example: 20000
 *                     totalMembers:
 *                       type: number
 *                       example: 12
 *                     pendingMembers:
 *                       type: number
 *                       example: 2
 *                     rejectedMembers:
 *                       type: number
 *                       example: 1
 *                     village:
 *                       type: string
 *                       example: "hauz khas"
 *                     taluka:
 *                       type: string
 *                       example: "Hauz Khas"
 *                     district:
 *                       type: string
 *                       example: "South Delhi"
 *                     state:
 *                       type: string
 *                       example: "Delhi"
 *                     location:
 *                       type: object
 *                       properties:
 *                         address:
 *                           type: string
 *                           example: "hauz khas, Hauz Khas,south delhi, Delhi"
 *                         latitude:
 *                           type: number
 *                           example: 19.9975
 *                         longitude:
 *                           type: number
 *                           example: 73.7898
 *                     audioCall:
 *                       type: boolean
 *                       example: true
 *                     videoCall:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: You are not approved member of this group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Failed to fetch group details
 */
router.get(
    "/groups/:groupCode/details",
    authMiddleware,
    getGroupDetails
);

/**
 * @swagger
 * /api/common/my-groups:
 *   get:
 *     summary: Get all groups of logged in user
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Groups fetched successfully"
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       groupName:
 *                         type: string
 *                         example: "Developer Group"
 *                       groupCode:
 *                         type: string
 *                         example: "SBG-001"
 *                       totalMembers:
 *                         type: number
 *                         example: 12
 *                       totalSaving:
 *                         type: number
 *                         example: 50000
 *                       formationDate:
 *                         type: string
 *                         format: date
 *                       location:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                             example: "Ring road , hauz khas,south delhi, India"
 *                           latitude:
 *                             type: number
 *                             example: 19.9975
 *                           longitude:
 *                             type: number
 *                             example: 73.7898
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Failed to fetch groups
 */
router.get(
    "/my-groups",
    authMiddleware,
    getMyGroups
);


/**
 * @swagger
 * /api/common/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Logout failed
 */
router.post(
    "/logout",
    authMiddleware,
    logoutUser
);

/**
 * @swagger
 * /api/common/groups/{groupId}/archive:
 *   patch:
 *     summary: Archive a group
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group archived successfully
 *       500:
 *         description: Server error
 */
router.patch(
    "/groups/:groupId/archive",
    authMiddleware,
    archiveGroup
);

/**
 * @swagger
 * /api/common/groups/{groupId}/unarchive:
 *   patch:
 *     summary: Unarchive a group
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group unarchived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group unarchived successfully
 *       500:
 *         description: Server error
 */
router.patch(
    "/groups/:groupId/unarchive",
    authMiddleware,
    unarchiveGroup
);
module.exports = router;