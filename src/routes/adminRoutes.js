const express = require("express");

const {
    registerAdmin,
    addMember,
    getAdminDashboardOverview,
    createGroup,
    getAdminProfile,
    updatePaymentDetails,
    getAdminMemberProfile,
    updateUpiId,
    removeMemberFromGroup,
    getGroupsWithMembers
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();
/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - mobileNumber
 *               - gender
 *               - loginType
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Atharv Saraf"
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "atharv123"
 *               gender:
 *                 type: string
 *                 example: "male"
 *               loginType:
 *                 type: string
 *                 enum: [password, otp]
 *                 example: "password"
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Missing required fields or user already exists
 *       500:
 *         description: Internal server error
 */
router.post(
    "/register",
    registerAdmin
);
/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile and dashboard overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 adminProfile:
 *                   type: object
 *                   properties:
 *                     fullName:
 *                       type: string
 *                       example: "Atharv Saraf"
 *                     mobileNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/profile.jpg"
 *                     upiId:
 *                       type: string
 *                       nullable: true
 *                       example: "atharv@upi"
 *                     bankAccount:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         accountHolderName:
 *                           type: string
 *                           example: "Atharv Saraf"
 *                         bankName:
 *                           type: string
 *                           example: "State Bank of India"
 *                         accountNumber:
 *                           type: string
 *                           example: "1234567890"
 *                         ifscCode:
 *                           type: string
 *                           example: "SBIN0001234"
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalGroups:
 *                           type: number
 *                           example: 5
 *                         totalMembers:
 *                           type: number
 *                           example: 42
 *                         totalCollection:
 *                           type: number
 *                           example: 150000
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/profile",
    authMiddleware,
    adminMiddleware,
    getAdminProfile);
/**
 * @swagger
 * /api/admin/payment-details:
 *   put:
 *     summary: Update admin bank account payment details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType:
 *                 type: string
 *                 example: "Savings"
 *               mobileNumberRegisteredWithBank:
 *                 type: string
 *                 example: "9876543210"
 *               accountHolderName:
 *                 type: string
 *                 example: "Atharv Saraf"
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               ifscCode:
 *                 type: string
 *                 example: "SBIN0001234"
 *               bankName:
 *                 type: string
 *                 example: "State Bank of India"
 *     responses:
 *       200:
 *         description: Payment details updated successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Internal server error
 */
router.put(
    "/payment-details",
    authMiddleware,
    adminMiddleware,
    updatePaymentDetails
);
/**
 * @swagger
 * /api/admin/dashboard-overview:
 *   get:
 *     summary: Get admin dashboard overview statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin dashboard overview fetched successfully"
 *                 totalGroups:
 *                   type: number
 *                   example: 5
 *                 totalMembers:
 *                   type: number
 *                   example: 42
 *                 pendingMembers:
 *                   type: number
 *                   example: 6
 *                 approvedMembers:
 *                   type: number
 *                   example: 36
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Failed to fetch admin dashboard overview
 */
router.get(
    "/dashboard-overview",
    authMiddleware,
    adminMiddleware,
    getAdminDashboardOverview
);
/**
 * @swagger
 * /api/admin/upi-id:
 *   patch:
 *     summary: Update admin UPI ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - upiId
 *             properties:
 *               upiId:
 *                 type: string
 *                 example: "atharv@upi"
 *     responses:
 *       200:
 *         description: UPI ID updated successfully
 *       400:
 *         description: Invalid or missing UPI ID
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch(
    "/upi-id",
    authMiddleware,
    adminMiddleware,
    updateUpiId);
/**
 * @swagger
 * /api/admin/create-group:
 *   post:
 *     summary: Create a new group
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *               - groupCode
 *               - village
 *               - taluka
 *               - district
 *               - state
 *               - formationDate
 *             properties:
 *               groupName:
 *                 type: string
 *                 example: "Shivaji Bachat Gat"
 *               groupCode:
 *                 type: string
 *                 example: "SBG-001"
 *               groupDuration:
 *                 type: string
 *                 example: "12 Months"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-19"
 *               description:
 *                 type: string
 *                 example: "Women self-help savings group"
 *               village:
 *                 type: string
 *                 example: "Shiamgir"
 *               taluka:
 *                 type: string
 *                 example: "Nashik"
 *               district:
 *                 type: string
 *                 example: "Nashik"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               formationDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-19"
 *               groupDurationInYears:
 *                 type: number
 *                 example: 2
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Missing required fields or group already exists
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Internal server error
 */
router.post(
    "/create-group",
    authMiddleware,
    adminMiddleware,
    createGroup
);
/**
 * @swagger
 * /api/admin/add-member:
 *   post:
 *     summary: Add member to a group
 *     tags: [Admin]
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
 *               - fullName
 *               - mobileNumber
 *               - dateOfBirth
 *               - address
 *               - monthlyContributionAmount
 *             properties:
 *               groupCode:
 *                 type: string
 *                 example: "SBG-001"
 *               fullName:
 *                 type: string
 *                 example: "Rahul Sharma"
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2000-05-19"
 *               address:
 *                 type: string
 *                 example: "Nashik, Maharashtra"
 *               monthlyContributionAmount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Member added successfully and request sent
 *       400:
 *         description: Missing required fields or member already exists
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.post(
    "/add-member",
    authMiddleware,
    adminMiddleware,
    addMember
);
/**
 * @swagger
 * /api/admin/groups/{groupCode}/members/{memberId}:
 *   get:
 *     summary: Get detailed profile of a member in a group
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "SBG-001"
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     responses:
 *       200:
 *         description: Member profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 memberProfile:
 *                   type: object
 *                   properties:
 *                     memberId:
 *                       type: string
 *                       example: "665c1f9a2b7d8f1234567890"
 *                     fullName:
 *                       type: string
 *                       example: "Rahul Sharma"
 *                     mobileNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     address:
 *                       type: string
 *                       nullable: true
 *                       example: "Nashik, Maharashtra"
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                       example: "2000-05-19"
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/profile.jpg"
 *                     memberSince:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     contributionSummary:
 *                       type: object
 *                       properties:
 *                         totalContribution:
 *                           type: number
 *                           example: 15000
 *                     loanSummary:
 *                       type: object
 *                       properties:
 *                         loanTaken:
 *                           type: number
 *                           example: 5000
 *                         loanRemaining:
 *                           type: number
 *                           example: 2000
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Group or member not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    getAdminMemberProfile
);
/**
 * @swagger
 * /api/admin/groups/{groupCode}/members/{memberId}:
 *   delete:
 *     summary: Remove member from group
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "SBG-001"
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     responses:
 *       200:
 *         description: Member removed from group successfully
 *       400:
 *         description: Group duration not completed or active loan exists
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Group or member not found
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    removeMemberFromGroup
);
router.get(
    "/groups-members",
    authMiddleware,
    adminMiddleware,
    getGroupsWithMembers
);
module.exports = router;