const express = require("express");

const {
    getMemberGroupRequests,
    acceptGroupRequest,
    rejectGroupRequest,
    getMemberHomeDashboard,
    getMemberProfile
} = require("../controllers/memberController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/member/group-requests:
 *   get:
 *     summary: Get all pending group requests for member
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending group requests fetched successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Failed to fetch group requests
 */
router.get(
    "/group-requests",
    authMiddleware,
    getMemberGroupRequests
);

/**
 * @swagger
 * /api/member/home-dashboard:
 *   get:
 *     summary: Get member home dashboard details
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home dashboard fetched successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/home-dashboard",
    authMiddleware,
    getMemberHomeDashboard
);

/**
 * @swagger
 * /api/member/group-requests/accept:
 *   post:
 *     summary: Accept group invitation request
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupCode
 *             properties:
 *               groupCode:
 *                 type: string
 *                 example: "SBG-001"
 *     responses:
 *       200:
 *         description: Group request accepted successfully
 *       400:
 *         description: Request already processed or missing group code
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Group or request not found
 *       500:
 *         description: Failed to accept group request
 */
router.post(
    "/group-requests/accept",
    authMiddleware,
    acceptGroupRequest
);

/**
 * @swagger
 * /api/member/group-requests/reject:
 *   post:
 *     summary: Reject group invitation request
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupCode
 *             properties:
 *               groupCode:
 *                 type: string
 *                 example: "SBG-001"
 *     responses:
 *       200:
 *         description: Group request rejected successfully
 *       400:
 *         description: Request already processed or missing group code
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Group or request not found
 *       500:
 *         description: Failed to reject group request
 */
router.post(
    "/group-requests/reject",
    authMiddleware,
    rejectGroupRequest
);

/**
 * @swagger
 * /api/member/profile:
 *   get:
 *     summary: Get member profile details
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member profile fetched successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/profile",
    authMiddleware,
    getMemberProfile
);
module.exports = router;