const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
    updatePaymentRequestStatus,
    getMemberPaymentPage,
    getMemberPaymentHistory,
    getAdminPaymentRequests,
    getPaymentRequestDetail,
    generateContributionPaymentLink,
    resubmitPaymentRequest,
    createPaymentRequest,
    getRejectedPaymentRequestDetails
} = require("../controllers/paymentController");
const {
    getAdminPaymentDashboard
} = require("../controllers/adminController");
/**
 * @swagger
 * /api/payments/request:
 *   post:
 *     summary: Create payment request with screenshot upload
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - groupCode
 *               - month
 *               - upiId
 *               - screenshot
 *             properties:
 *               groupCode:
 *                 type: string
 *                 example: "SBG-001"
 *               month:
 *                 type: string
 *                 example: "2026-05"
 *               upiId:
 *                 type: string
 *                 example: "atharv@upi"
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Payment request submitted successfully
 *       400:
 *         description: Missing fields or request already exists
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: You are not approved member of this group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.post(
    "/request",
    authMiddleware,
    upload.single("screenshot"),
    createPaymentRequest
);

/**
 * @swagger
 * /api/payments/member/history:
 *   get:
 *     summary: Get payment history of logged in member
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment history fetched successfully"
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665c1f9a2b7d8f1234567890"
 *                       amount:
 *                         type: number
 *                         example: 500
 *                       month:
 *                         type: string
 *                         example: "2026-05"
 *                       status:
 *                         type: string
 *                         example: "accepted"
 *                       screenshotUrl:
 *                         type: string
 *                         example: "https://res.cloudinary.com/demo/image.jpg"
 *                       groupId:
 *                         type: object
 *                         properties:
 *                           groupName:
 *                             type: string
 *                             example: "Developer Group"
 *                           groupCode:
 *                             type: string
 *                             example: "SBG-001"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get(
    "/member/history",
    authMiddleware,
    getMemberPaymentHistory
);
/**
 * @swagger
 * /api/payments/member/{groupCode}:
 *   get:
 *     summary: Get member payment page details
 *     tags: [Payment]
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
 *         description: Member payment page fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Member payment page fetched successfully"
 *                 paymentPage:
 *                   type: object
 *                   properties:
 *                     group:
 *                       type: object
 *                       properties:
 *                         groupId:
 *                           type: string
 *                           example: "665c1f9a2b7d8f1234567890"
 *                         groupName:
 *                           type: string
 *                           example: "Developer Group"
 *                         groupCode:
 *                           type: string
 *                           example: "SBG-001"
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     ownerAccount:
 *                       type: object
 *                       properties:
 *                         adminName:
 *                           type: string
 *                           example: "Atharv Saraf"
 *                         mobileNumber:
 *                           type: string
 *                           example: "9876543210"
 *                         upiId:
 *                           type: string
 *                           example: "atharv@upi"
 *                     upiLink:
 *                       type: string
 *                       example: "upi://pay?pa=atharv@upi"
 *       400:
 *         description: Admin has not added UPI ID yet
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: User is not approved member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/member/:groupCode",
    authMiddleware,
    getMemberPaymentPage
);



/**
 * @swagger
 * /api/payments/admin/requests:
 *   get:
 *     summary: Get all payment requests for admin
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment requests fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment requests fetched successfully"
 *                 counts:
 *                   type: object
 *                   properties:
 *                     all:
 *                       type: number
 *                       example: 10
 *                     pending:
 *                       type: number
 *                       example: 2
 *                     accepted:
 *                       type: number
 *                       example: 6
 *                     rejected:
 *                       type: number
 *                       example: 2
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: string
 *                       memberName:
 *                         type: string
 *                         example: "Rahul Sharma"
 *                       groupName:
 *                         type: string
 *                         example: "Developer Group"
 *                       amount:
 *                         type: number
 *                         example: 500
 *                       month:
 *                         type: string
 *                         example: "2026-05"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       screenshotUrl:
 *                         type: string
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Internal server error
 */
router.get(
    "/admin/requests",
    authMiddleware,
    adminMiddleware,
    getAdminPaymentRequests
);

/**
 * @swagger
 * /api/payments/admin/dashboard:
 *   get:
 *     summary: Get admin payment dashboard overview
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin payment dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReceivableThisMonth:
 *                   type: number
 *                   example: 25000
 *                 receivedThisMonth:
 *                   type: number
 *                   example: 18000
 *                 pendingPayments:
 *                   type: number
 *                   example: 7
 *                 completedPayments:
 *                   type: number
 *                   example: 20
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Internal server error
 */
router.get(
    "/admin/dashboard",
    authMiddleware,
    adminMiddleware,
    getAdminPaymentDashboard
);

/**
 * @swagger
 * /api/payments/admin/requests/{requestId}:
 *   get:
 *     summary: Get detailed payment request information
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *     responses:
 *       200:
 *         description: Payment request detail fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment request detail fetched successfully"
 *                 request:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     month:
 *                       type: string
 *                       example: "2026-05"
 *                     status:
 *                       type: string
 *                       example: "accepted"
 *                     rejectionReason:
 *                       type: string
 *                       nullable: true
 *                     screenshotUrl:
 *                       type: string
 *                     acceptedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     rejectedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Payment request not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/admin/requests/:requestId",
    authMiddleware,
    adminMiddleware,
    getPaymentRequestDetail
);

/**
 * @swagger
 * /api/payments/generate-payment-link/{groupId}:
 *   get:
 *     summary: Generate contribution payment deep link
 *     tags: [Payment]
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
 *         description: Payment page data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment page data fetched successfully"
 *                 group:
 *                   type: object
 *                   properties:
 *                     groupId:
 *                       type: string
 *                     groupName:
 *                       type: string
 *                 amountDetails:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     month:
 *                       type: string
 *                       example: "2026-05"
 *                 ownerAccount:
 *                   type: object
 *                   properties:
 *                     adminName:
 *                       type: string
 *                       example: "Atharv Saraf"
 *                     upiId:
 *                       type: string
 *                       example: "atharv@upi"
 *                 paymentDetails:
 *                   type: object
 *                   properties:
 *                     upiDeepLink:
 *                       type: string
 *                       example: "upi://pay?pa=atharv@upi"
 *       400:
 *         description: Admin UPI ID not found
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: User is not a member of this group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/generate-payment-link/:groupId",
    authMiddleware,
    generateContributionPaymentLink
);
/**
 * @swagger
 * /api/payments/update-payment-request-status:
 *   patch:
 *     summary: Accept or reject payment request
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentRequestId
 *               - status
 *             properties:
 *               paymentRequestId:
 *                 type: string
 *                 example: "665c1f9a2b7d8f1234567890"
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: "accepted"
 *               rejectionReason:
 *                 type: string
 *                 example: "Screenshot not clear"
 *     responses:
 *       200:
 *         description: Payment request updated successfully
 *       400:
 *         description: Invalid status or missing fields
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Payment request not found
 *       500:
 *         description: Internal server error
 */
router.patch(
    "/update-payment-request-status",
    authMiddleware,
    adminMiddleware,
    updatePaymentRequestStatus
);
/**
 * @swagger
 * /api/payments/resubmit/{paymentRequestId}:
 *   post:
 *     summary: Resubmit a rejected payment request with a new screenshot
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentRequestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *         description: Payment request ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - screenshot
 *             properties:
 *               screenshot:
 *                 type: string
 *                 format: binary
 *               additionalComments:
 *                 type: string
 *                 example: "Uploaded a clearer screenshot"
 *     responses:
 *       200:
 *         description: Payment request resubmitted successfully
 *       400:
 *         description: Payment request is not eligible for resubmission
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: User is not authorized to resubmit this payment request
 *       404:
 *         description: Payment request not found
 *       500:
 *         description: Internal server error
 */
router.post(
    "/resubmit/:paymentRequestId",
    authMiddleware,
    upload.single("screenshot"),
    resubmitPaymentRequest
);
/**
 * @swagger
 * /api/payments/rejected/{paymentRequestId}:
 *   get:
 *     summary: Get rejected payment request details
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentRequestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "665c1f9a2b7d8f1234567890"
 *         description: Rejected payment request ID
 *     responses:
 *       200:
 *         description: Rejected payment request details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentRequestId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                   example: rejected
 *                 rejectionReason:
 *                   type: string
 *                   example: Screenshot not clear
 *                 rejectedAt:
 *                   type: string
 *                   format: date-time
 *                 screenshotUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: User is not authorized to view this payment request
 *       404:
 *         description: Payment request not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/rejected/:paymentRequestId",
    authMiddleware,
    getRejectedPaymentRequestDetails
);
module.exports = router;