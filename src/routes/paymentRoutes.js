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
    generateContributionPaymentLink
} = require("../controllers/paymentController");
const {
    createPaymentRequest
} = require("../controllers/contibutionController");
const {
    getAdminPaymentDashboard
} = require("../controllers/adminController");
/**
 * @swagger
 * /api/payment/request:
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
 * /api/payment/member/{groupCode}:
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
 *       400:
 *         description: Admin UPI ID missing
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
 * /api/payment/member/history:
 *   get:
 *     summary: Get payment history of logged in member
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history fetched successfully
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
 * /api/payment/admin/requests:
 *   get:
 *     summary: Get all payment requests for admin
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment requests fetched successfully
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
 * /api/payment/admin/dashboard:
 *   get:
 *     summary: Get admin payment dashboard overview
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin payment dashboard fetched successfully
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
 * /api/payment/admin/requests/{requestId}:
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
 * /api/payment/update-payment-request-status:
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
 * /api/payment/generate-payment-link/{groupId}:
 *   get:
 *     summary: Generate UPI payment deep link
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
 *         description: Payment link generated successfully
 *       400:
 *         description: Admin UPI ID missing
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: User is not member of this group
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
module.exports = router;