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
    getGroupsWithMembers,
    editMemberByAdmin,
    deleteGroupByAdmin,
    updateProfile
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
 *                     address:
 *                      type: string
 *                      example: "Pune, Maharashtra"
 * 
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       example: "2002-05-15"
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
 *                 example: "Shree Ganesh Bachat Gat"
 *
 *               groupCode:
 *                 type: string
 *                 example: "SBG-001"
 *
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-25"
 *
 *               description:
 *                 type: string
 *                 example: "Women self help savings group"
 *
 *               village:
 *                 type: string
 *                 example: "Khed"
 *
 *               taluka:
 *                 type: string
 *                 example: "Haveli"
 *
 *               district:
 *                 type: string
 *                 example: "Pune"
 *
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *
 *               formationDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *
 *               groupDurationInYears:
 *                 type: number
 *                 example: 5
 *
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group created successfully"
 *
 *                 groupId:
 *                   type: string
 *                   example: "6852ab12cd34ef5678901234"
 *
 *                 groupName:
 *                   type: string
 *                   example: "Shree Ganesh Bachat Gat"
 *
 *                 groupCode:
 *                   type: string
 *                   example: "SBG-001"
 *
 *       400:
 *         description: Validation error or duplicate group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group code already exists"
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
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
 *     summary: Add a member to a group
 *     description: |
 *       Admin can add a new or existing user into a group with pending status.
 *       If the user does not exist, a new account is created automatically.
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
 *
 *               fullName:
 *                 type: string
 *                 example: "Rahul Sharma"
 *
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2000-05-19"
 *
 *               address:
 *                 type: string
 *                 example: "Nashik, Maharashtra"
 *
 *               monthlyContributionAmount:
 *                 type: number
 *                 example: 500
 *
 *     responses:
 *       200:
 *         description: Member request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "New member created and group request sent successfully"
 *
 *                 status:
 *                   type: string
 *                   example: "pending"
 *
 *       400:
 *         description: Validation error or member already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     missingFields:
 *                       value: "groupCode, fullName, mobileNumber, dateOfBirth, address and monthlyContributionAmount are required"
 *
 *                     existingMember:
 *                       value: "User already exists in this group with status: pending"
 *
 *                     mismatchDetails:
 *                       value: "Existing user details do not match with provided fullName and dateOfBirth"
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: Forbidden - Only admin or authorized group admin can add members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     notAdmin:
 *                       value: "Only Admin can add member"
 *
 *                     notAllowed:
 *                       value: "You are not allowed to add members in this group"
 *
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group not found"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 *   patch:
 *     summary: Edit member information by admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "SBG-001"
 *
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Rahul Sharma"
 *
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *
 *               dateofBirth:
 *                 type: string
 *                 format: date
 *                 example: "2000-05-19"
 *
 *               address:
 *                 type: string
 *                 example: "Nashik, Maharashtra"
 *
 *     responses:
 *       200:
 *         description: Member information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Member information updated successfully"
 *
 *                 member:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "665c1f9a2b7d8f1234567890"
 *
 *                     fullName:
 *                       type: string
 *                       example: "Rahul Sharma"
 *
 *                     mobileNumber:
 *                       type: string
 *                       example: "9876543210"
 *
 *                     dateofBirth:
 *                       type: string
 *                       format: date
 *                       example: "2000-05-19"
 *
 *                     address:
 *                       type: string
 *                       example: "Nashik, Maharashtra"
 *
 *                     roleSelection:
 *                       type: string
 *                       example: "user"
 *
 *       400:
 *         description: No valid field provided for update
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: Access denied - Admin only
 *
 *       404:
 *         description: Group or member not found
 *
 *       500:
 *         description: Internal server error
 */
router.patch(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    editMemberByAdmin
);
/**
 * @swagger
 * /api/admin/groups-members:
 *   get:
 *     summary: Get all groups with active and pending members
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups with members fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Groups with members fetched successfully
 *
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                         example: 682ab72a92ab21f1f0f8d111
 *
 *                       groupName:
 *                         type: string
 *                         example: Shivneri Mahila Gat
 *
 *                       groupCode:
 *                         type: string
 *                         example: SHV-01
 *
 *                       totalMembers:
 *                         type: number
 *                         example: 18
 *
 *                       activeCount:
 *                         type: number
 *                         example: 15
 *
 *                       pendingCount:
 *                         type: number
 *                         example: 3
 *
 *                       activeMembers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             memberId:
 *                               type: string
 *                               example: 682ab72a92ab21f1f0f8d222
 *
 *                             fullName:
 *                               type: string
 *                               example: Anita Shinde
 *
 *                             mobileNumber:
 *                               type: string
 *                               example: "9876543210"
 *
 *                             profilePicture:
 *                               type: string
 *                               example: https://example.com/profile.jpg
 *
 *                             membershipId:
 *                               type: string
 *                               example: MBG0021
 *
 *                             status:
 *                               type: string
 *                               example: approved
 *
 *                       pendingMembers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             memberId:
 *                               type: string
 *                               example: 682ab72a92ab21f1f0f8d333
 *
 *                             fullName:
 *                               type: string
 *                               example: Sunita More
 *
 *                             mobileNumber:
 *                               type: string
 *                               example: "9876543211"
 *
 *                             profilePicture:
 *                               type: string
 *                               example: https://example.com/profile.jpg
 *
 *                             membershipId:
 *                               type: string
 *                               example: MBG0022
 *
 *                             status:
 *                               type: string
 *                               example: pending
 *
 *       401:
 *         description: Unauthorized or token missing
 *
 *       403:
 *         description: Admin access required
 *
 *       500:
 *         description: Server error
 */
router.get(
    "/groups-members",
    authMiddleware,
    adminMiddleware,
    getGroupsWithMembers
);
/**
 *@swagger
 * /api/admin/groups/{groupCode}/members/{memberId}:
 *   get:
 *     summary: Get all groups with active and pending members
 * components:
 *   schemas:
 *     EditMemberByAdminRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           example: Rahul Sharma
 *
 *         mobileNumber:
 *           type: string
 *           example: "9876543210"
 *
 *         dateofBirth:
 *           type: string
 *           format: date
 *           example: 2002-05-15
 *
 *         address:
 *           type: string
 *           example: Pune, Maharashtra
 *
 *     EditMemberByAdminResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Member information updated successfully
 *
 *         member:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 665f1a2b3c4d5e6f78901234
 *
 *             fullName:
 *               type: string
 *               example: Rahul Sharma
 *
 *             mobileNumber:
 *               type: string
 *               example: "9876543210"
 *
 *             dateofBirth:
 *               type: string
 *               format: date
 *               example: 2002-05-15
 *
 *             address:
 *               type: string
 *               example: Pune, Maharashtra
 *
 *             roleSelection:
 *               type: string
 *               example: user
 */
router.patch(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    editMemberByAdmin
);
/**
 * @swagger
 * /api/admin/groups/{groupId}:
 *   delete:
 *     summary: Close group by admin if no active loan remains
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB group ID
 *
 *     responses:
 *       200:
 *         description: Group closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Group closed successfully"
 *
 *                 groupId:
 *                   type: string
 *                   example: "665c1f9a2b7d8f1234567890"
 *
 *                 closedAt:
 *                   type: string
 *                   format: date-time
 *
 *       400:
 *         description: Group cannot be closed because active loan still exists or group is already closed
 *
 *       401:
 *         description: Unauthorized or token missing
 *
 *       403:
 *         description: Admin access required
 *
 *       404:
 *         description: Group not found or unauthorized
 *
 *       500:
 *         description: Server error
 */
router.delete(
    "/groups/:groupId",
    authMiddleware,
    adminMiddleware,
    deleteGroupByAdmin
);
/**
 * @swagger
 * /api/admin/groups/{groupCode}/members/{memberId}:
 *   delete:
 *     summary: Remove member from group
 *     description: Only group admin can remove approved or pending members from the group.
 *     tags: [Admin]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "ATHARV-011"
 *         description: Unique group code
 *
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         example: "6852b8f1f12c8a45a1234567"
 *         description: User ID of member to remove
 *
 *     responses:
 *
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Member removed successfully"
 *
 *       400:
 *         description: Invalid request or admin removal attempt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   examples:
 *                     missingMemberId:
 *                       value: "memberId is required"
 *
 *                     cannotRemoveAdmin:
 *                       value: "Admin cannot remove himself"
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *
 *       403:
 *         description: Only group admin can remove members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Only admin can remove members"
 *
 *       404:
 *         description: Group or member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   examples:
 *                     groupNotFound:
 *                       value: "Group not found"
 *
 *                     memberNotFound:
 *                       value: "Member not found in group"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    removeMemberFromGroup
);
/**
 * @swagger
 * /api/admin/profile/update_admin:
 *   patch:
 *     summary: Update admin profile
 *     description: Allows an authenticated admin to update their profile information such as name, mobile number, address, and date of birth.
 *     tags: [Admin]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *
 *               fullName:
 *                 type: string
 *                 example: "Priya Sharma"
 *
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *
 *               address:
 *                 type: string
 *                 example: "123, Gandhi Nagar, Pune, Maharashtra - 411001"
 *
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *
 *     responses:
 *
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *
 *                 data:
 *                   type: object
 *
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "At least one field is required"
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *
 *       403:
 *         description: Only admins can update this profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.patch(
    "/profile/update_admin",
    authMiddleware,
    adminMiddleware,
    updateProfile
);
module.exports = router;