const express = require("express");
const router = express.Router();
const { updateLanguage, getGroupMembers, getGroupDetails, getMyGroups, logoutUser } = require("../controllers/commonController");

const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/user/update-language:
 *   put:
 *     summary: Update preferred language of user
 *     tags: [User]
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
 * /api/user/groups/{groupCode}/members:
 *   get:
 *     summary: Get all members of a group
 *     tags: [User]
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
 * /api/user/groups/{groupCode}/details:
 *   get:
 *     summary: Get detailed information of a group
 *     tags: [User]
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
 * /api/user/my-groups:
 *   get:
 *     summary: Get all groups of logged in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups fetched successfully
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
 * /api/user/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [User]
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

module.exports = router;