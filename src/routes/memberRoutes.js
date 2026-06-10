const express = require("express");

const {
    getMemberGroupRequests,
    acceptGroupRequest,
    rejectGroupRequest,
    getMemberHomeDashboard,
    getMemberProfile,
    leaveGroup
} = require("../controllers/memberController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();


/**
 * @swagger
 * /api/member/group-requests:
 *   get:
 *     summary: Get all pending group requests for logged in member
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending group requests fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pending group requests fetched successfully"
 *                 requests:
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
 *                       formationDate:
 *                         type: string
 *                         format: date
 *                       note:
 *                         type: string
 *                         example: "Please join before next meeting"
 *                       status:
 *                         type: string
 *                         example: "pending"
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
 *     summary: Get member home dashboard data
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Home dashboard fetched successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     fullName:
 *                       type: string
 *                       example: "Atharv Saraf"
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
 *                       totalMembers:
 *                         type: number
 *                         example: 12
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       monthlyContribution:
 *                         type: number
 *                         example: 500
 *                       nextCollectionDate:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       contributionDueToday:
 *                         type: boolean
 *                         example: false
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPaidThisMonth:
 *                       type: number
 *                       example: 1000
 *                     pendingAmountThisMonth:
 *                       type: number
 *                       example: 500
 *                     totalPaidAllTime:
 *                       type: number
 *                       example: 15000
 *                     upcomingCollectionsThisMonth:
 *                       type: number
 *                       example: 2
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "monthly_contribution"
 *                       title:
 *                         type: string
 *                         example: "Monthly Contribution"
 *                       groupName:
 *                         type: string
 *                         example: "Developer Group"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       amount:
 *                         type: number
 *                         example: 500
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
 * /api/member/profile:
 *   get:
 *     summary: Get member profile details
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Member profile fetched successfully"
 *
 *                 profile:
 *                   type: object
 *                   properties:
 *                     memberName:
 *                       type: string
 *                       example: "Rahul Sharma"
 *                     mobileNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     address:
 *                       type: string
 *                       nullable: true
 *                       example: "Delhi, India"
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                         example: "665f7d89b1234567890abcd1"
 *                       groupName:
 *                         type: string
 *                         example: "Shivneri Bachat Gat"
 *                       groupCode:
 *                         type: string
 *                         example: "SBG001"
 *                       monthlyContribution:
 *                         type: number
 *                         example: 500
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         example: "approved"
 *
 *                 paymentSummary:
 *                   type: object
 *                   properties:
 *                     totalPaidThisMonth:
 *                       type: number
 *                       example: 1500
 *                     pendingAmount:
 *                       type: number
 *                       example: 500
 *                     totalPaidAllTime:
 *                       type: number
 *                       example: 25000
 *                     totalMonthlyContribution:
 *                       type: number
 *                       example: 2000
 *
 *                 loanSummary:
 *                   type: object
 *                   properties:
 *                     loanTaken:
 *                       type: number
 *                       example: 10000
 *                     loanPaid:
 *                       type: number
 *                       example: 7000
 *                     remainingToPay:
 *                       type: number
 *                       example: 3000
 *                     status:
 *                       type: string
 *                       example: "Keep going! You're doing great."
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       404:
 *         description: User not found
 *
 *       500:
 *         description: Internal server error
 */
router.get(
    "/profile",
    authMiddleware,
    getMemberProfile
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
 * /api/member/leave-group:
 *   post:
 *     summary: Leave a group
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f1b2c3d4e5f6789012345"
 *     responses:
 *       200:
 *         description: Successfully left the group
 *       400:
 *         description: Cannot leave group due to existing loan application (pending, approved, or active)
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Group not found or user not a member
 *       500:
 *         description: Failed to leave group
 */
router.post(
    "/leave-group",
    authMiddleware,
    leaveGroup
);
module.exports = router;