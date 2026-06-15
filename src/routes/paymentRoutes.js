const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
    updatePaymentRequestStatus,
    getMemberPaymentHistory,
    getAdminPaymentRequests,
    getPaymentRequestDetail,
    generateContributionPaymentLink,
    resubmitPaymentRequest,
    createPaymentRequest,
    getRejectedPaymentRequestDetails,
    getMemberPaymentDashboard,
    getPaymentDetails
} = require("../controllers/paymentController");
const {
    getAdminPaymentDashboard
} = require("../controllers/adminController");

/**
 * @swagger
 * /api/payments/request_submit:
 *   post:
 *     summary: Create payment request for contribution and loan repayment
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *
 *             required:
 *               - groupCode
 *               - month
 *               - upiId
 *               - screenshot
 *
 *             properties:
 *
 *               groupCode:
 *                 type: string
 *                 example: SBG-001
 *
 *               month:
 *                 type: string
 *                 example: 2026-05-01
 *
 *               upiId:
 *                 type: string
 *                 example: atharv@upi
 *
 *               screenshot:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *
 *       201:
 *         description: Payment request submitted successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Payment request submitted successfully
 *
 *                 paymentBreakdown:
 *                   type: object
 *
 *                   properties:
 *
 *                     contributionAmount:
 *                       type: number
 *                       example: 500
 *
 *                     loanAmount:
 *                       type: number
 *                       example: 1200
 *
 *                     totalAmount:
 *                       type: number
 *                       example: 1700
 *
 *                     hasLoanPayment:
 *                       type: boolean
 *                       example: true
 *
 *                 paymentRequest:
 *                   type: object
 *
 *                   properties:
 *
 *                     _id:
 *                       type: string
 *                       example: 6850f4f2ab123456789abcd1
 *
 *                     userId:
 *                       type: string
 *                       example: 6850f4f2ab123456789abcd2
 *
 *                     groupId:
 *                       type: string
 *                       example: 6850f4f2ab123456789abcd3
 *
 *                     adminId:
 *                       type: string
 *                       example: 6850f4f2ab123456789abcd4
 *
 *                     contributionAmount:
 *                       type: number
 *                       example: 500
 *
 *                     loanAmount:
 *                       type: number
 *                       example: 1200
 *
 *                     amount:
 *                       type: number
 *                       example: 1700
 *
 *                     installmentIds:
 *                       type: array
 *
 *                       items:
 *                         type: string
 *
 *                     month:
 *                       type: string
 *                       example: 2026-05-01
 *
 *                     upiId:
 *                       type: string
 *                       example: atharv@upi
 *
 *                     screenshotUrl:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *
 *                     extractedInfo:
 *                       type: object
 *
 *                       properties:
 *
 *                         extractedAmount:
 *                           type: number
 *                           example: 1700
 *
 *                         transactionId:
 *                           type: string
 *                           example: TXN123456
 *
 *                         paidTo:
 *                           type: string
 *                           example: Atharv Saraf
 *
 *                         paidFrom:
 *                           type: string
 *                           nullable: true
 *
 *                         transactionDate:
 *                           type: string
 *                           format: date-time
 *
 *                     status:
 *                       type: string
 *                       example: pending
 *
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *
 *       400:
 *         description: Validation error, insufficient payment, or duplicate request
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: User is not an approved member of the group
 *
 *       404:
 *         description: Group not found
 *
 *       500:
 *         description: Internal server error
 */
router.post(
    "/request_submit",
    authMiddleware,
    upload.single("screenshot"),
    createPaymentRequest
);
/**
 * @swagger
 * /api/payments/request:
 *   post:
 *     summary: Get contribution payment details for next unpaid month
 *
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: groupCode
 *         required: true
 *         schema:
 *           type: string
 *         example: SBG-001
 *
 *     responses:
 *
 *       200:
 *         description: Payment details fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Payment details fetched successfully
 *
 *                 payment:
 *                   type: object
 *
 *                   properties:
 *
 *                     paymentMonth:
 *                       type: string
 *                       example: 2026-06
 *
 *                     contributionAmount:
 *                       type: number
 *                       example: 500
 *
 *                     totalAmount:
 *                       type: number
 *                       example: 500
 *
 *                 ownerPaymentDetails:
 *                   type: object
 *
 *                   properties:
 *
 *                     ownerId:
 *                       type: string
 *                       example: 6850f4f2ab123456789abcd1
 *
 *                     ownerName:
 *                       type: string
 *                       example: Atharv Saraf
 * 
 *                     bankDetails:
 *                       type: object
 *
 *                       properties:
 *
 *                         accountHolderName:
 *                           type: string
 *                           example: Atharv Saraf
 *
 *                         bankName:
 *                           type: string
 *                           example: State Bank of India
 *
 *                         accountNumber:
 *                           type: string
 *                           example: 123456789012
 *
 *                         ifscCode:
 *                           type: string
 *                           example: SBIN0001234
 *                     upiId:
 *                       type: string
 *                       example: atharv@upi
 *
 *                     mobileNumber:
 *                       type: string
 *                       example: 9876543210
 *
 *                     profilePicture:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/profile.jpg
 *
 *                 paymentLink:
 *                   type: string
 *                   example: upi://pay?pa=atharv@upi&pn=Atharv%20Saraf&am=500&cu=INR
 *
 *                 alreadyPaid:
 *                   type: boolean
 *                   example: false
 *
 *                 pendingRequest:
 *                   type: boolean
 *                   example: false
 *
 *       400:
 *         description: Validation error or payment already completed
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: User is not approved member
 *
 *       404:
 *         description: Group not found
 *
 *       500:
 *         description: Internal server error
 */
router.post(
    "/request",
    authMiddleware,
    getPaymentDetails
);

/**
 * @swagger
 * /api/payments/member/history:
 *   get:
 *     summary: Get payment history of logged in member
 *
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description: Payment history fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Payment history fetched successfully
 *
 *                 counts:
 *                   type: object
 *
 *                   properties:
 *
 *                     total:
 *                       type: number
 *                       example: 10
 *
 *                     accepted:
 *                       type: number
 *                       example: 7
 *
 *                     pending:
 *                       type: number
 *                       example: 2
 *
 *                     rejected:
 *                       type: number
 *                       example: 1
 *
 *                 payments:
 *                   type: array
 *
 *                   items:
 *                     type: object
 *
 *                     properties:
 *
 *                       paymentRequestId:
 *                         type: string
 *                         example: 665c1f9a2b7d8f1234567890
 *
 *                       group:
 *                         type: object
 *
 *                         properties:
 *
 *                           groupId:
 *                             type: string
 *                             example: 665c1f9a2b7d8f1234567891
 *
 *                           groupName:
 *                             type: string
 *                             example: Developer Group
 *
 *                           groupCode:
 *                             type: string
 *                             example: SBG-001
 *
 *                       contributionAmount:
 *                         type: number
 *                         example: 500
 *
 *                       loanAmount:
 *                         type: number
 *                         example: 1200
 *
 *                       totalAmount:
 *                         type: number
 *                         example: 1700
 *
 *                       installmentCount:
 *                         type: number
 *                         example: 2
 *
 *                       installments:
 *                         type: array
 *
 *                         items:
 *                           type: object
 *
 *                       month:
 *                         type: string
 *                         example: 2026-05-01
 *
 *                       upiId:
 *                         type: string
 *                         example: atharv@upi
 *
 *                       screenshotUrl:
 *                         type: string
 *                         example: https://res.cloudinary.com/demo/image.jpg
 *
 *                       extractedInfo:
 *                         type: object
 *
 *                         properties:
 *
 *                           extractedAmount:
 *                             type: number
 *                             example: 1700
 *
 *                           transactionId:
 *                             type: string
 *                             example: TXN123456
 *
 *                           paidTo:
 *                             type: string
 *                             example: Atharv Saraf
 *
 *                           paidFrom:
 *                             type: string
 *                             nullable: true
 *
 *                           transactionDate:
 *                             type: string
 *                             format: date-time
 *
 *                       status:
 *                         type: string
 *                         example: accepted
 *
 *                       rejectionReason:
 *                         type: string
 *                         example: Screenshot amount mismatch
 *
 *                       acceptedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *
 *                       rejectedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *
 *                       resubmittedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *
 *                       resubmissionCount:
 *                         type: number
 *                         example: 1
 *
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
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
 * /api/payments/admin/requests:
 *   get:
 *     summary: Get all payment requests for admin
 *
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description: Payment requests fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Payment requests fetched successfully
 *
 *                 counts:
 *                   type: object
 *
 *                   properties:
 *
 *                     all:
 *                       type: number
 *                       example: 10
 *
 *                     pending:
 *                       type: number
 *                       example: 2
 *
 *                     accepted:
 *                       type: number
 *                       example: 6
 *
 *                     rejected:
 *                       type: number
 *                       example: 2
 *
 *                 requests:
 *                   type: array
 *
 *                   items:
 *                     type: object
 *
 *                     properties:
 *
 *                       requestId:
 *                         type: string
 *                         example: 665c1f9a2b7d8f1234567890
 *
 *                       memberId:
 *                         type: string
 *                         example: 665c1f9a2b7d8f1234567891
 *
 *                       memberName:
 *                         type: string
 *                         example: Rahul Sharma
 *
 *                       mobileNumber:
 *                         type: string
 *                         example: 9876543210
 *
 *                       profilePicture:
 *                         type: string
 *                         example: https://res.cloudinary.com/demo/image.jpg
 *
 *                       groupId:
 *                         type: string
 *                         example: 665c1f9a2b7d8f1234567892
 *
 *                       groupName:
 *                         type: string
 *                         example: Developer Group
 *
 *                       groupCode:
 *                         type: string
 *                         example: SBG-001
 *
 *                       contributionAmount:
 *                         type: number
 *                         example: 500
 *
 *                       loanAmount:
 *                         type: number
 *                         example: 1200
 *
 *                       totalAmount:
 *                         type: number
 *                         example: 1700
 *
 *                       installmentCount:
 *                         type: number
 *                         example: 2
 *
 *                       installments:
 *                         type: array
 *
 *                         items:
 *                           type: object
 *
 *                       month:
 *                         type: string
 *                         example: 2026-05-01
 *
 *                       upiId:
 *                         type: string
 *                         example: atharv@upi
 *
 *                       screenshotUrl:
 *                         type: string
 *                         example: https://res.cloudinary.com/demo/image.jpg
 *
 *                       extractedInfo:
 *                         type: object
 *
 *                         properties:
 *
 *                           extractedAmount:
 *                             type: number
 *                             example: 1700
 *
 *                           transactionId:
 *                             type: string
 *                             example: TXN123456
 *
 *                           paidTo:
 *                             type: string
 *                             example: Atharv Saraf
 *
 *                           paidFrom:
 *                             type: string
 *                             nullable: true
 *
 *                           transactionDate:
 *                             type: string
 *                             format: date-time
 *
 *                       status:
 *                         type: string
 *                         example: pending
 *
 *                       rejectionReason:
 *                         type: string
 *                         example: Amount mismatch
 *
 *                       acceptedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *
 *                       rejectedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: Access denied - Admin only
 *
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
 * /api/payments/member/dashboard:
 *   get:
 *     summary: Get member payment dashboard overview
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Member payment dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 message:
 *                   type: string
 *                   example: "Dashboard fetched successfully"
 *
 *                 profile:
 *                   type: object
 *                   properties:
 *
 *                     fullName:
 *                       type: string
 *                       example: "Rahul Sharma"
 *
 *                     profilePhoto:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/profile.jpg"
 *
 *                 activeGroup:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *
 *                     groupId:
 *                       type: string
 *                       example: "665c1f9a2b7d8f1234567890"
 *
 *                     groupName:
 *                       type: string
 *                       example: "Shivneri Bachat Gat"
 *
 *                     monthlyContribution:
 *                       type: number
 *                       example: 500
 *
 *                     dueDate:
 *                       type: string
 *                       example: "10 May 2025"
 *
 *                 paymentSummary:
 *                   type: object
 *                   properties:
 *
 *                     totalPaidThisMonth:
 *                       type: number
 *                       example: 1500
 *
 *                     pendingAmount:
 *                       type: number
 *                       example: 500
 *
 *                     totalPaidAllTime:
 *                       type: number
 *                       example: 25000
 *
 *                 loanSummary:
 *                   type: object
 *                   properties:
 *
 *                     totalLoanTaken:
 *                       type: number
 *                       example: 10000
 *
 *                     totalLoanPaid:
 *                       type: number
 *                       example: 7000
 *
 *                     remainingLoanAmount:
 *                       type: number
 *                       example: 3000
 *
 *                 recentTransactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *
 *                       transactionId:
 *                         type: string
 *                         example: "665f7d89b1234567890abcd1"
 *
 *                       type:
 *                         type: string
 *                         example: "Monthly Contribution"
 *
 *                       amount:
 *                         type: number
 *                         example: 500
 *
 *                       status:
 *                         type: string
 *                         example: "paid"
 *
 *                       groupName:
 *                         type: string
 *                         example: "Shivneri Bachat Gat"
 *
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       500:
 *         description: Internal server error
 */
router.get(
    "/member/dashboard",
    authMiddleware,
    getMemberPaymentDashboard
);
/**
 * @swagger
 * /api/payments/admin/requests/{requestId}:
 *   get:
 *     summary: Get detailed payment request information
 *
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         example: 665c1f9a2b7d8f1234567890
 *
 *     responses:
 *
 *       200:
 *         description: Payment request detail fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Payment request detail fetched successfully
 *
 *                 request:
 *                   type: object
 *
 *                   properties:
 *
 *                     requestId:
 *                       type: string
 *                       example: 665c1f9a2b7d8f1234567890
 *
 *                     member:
 *                       type: object
 *
 *                       properties:
 *
 *                         memberId:
 *                           type: string
 *                           example: 665c1f9a2b7d8f1234567891
 *
 *                         fullName:
 *                           type: string
 *                           example: Rahul Sharma
 *
 *                         mobileNumber:
 *                           type: string
 *                           example: 9876543210
 *
 *                         profilePicture:
 *                           type: string
 *                           example: https://res.cloudinary.com/demo/profile.jpg
 *
 *                     group:
 *                       type: object
 *
 *                       properties:
 *
 *                         groupId:
 *                           type: string
 *                           example: 665c1f9a2b7d8f1234567892
 *
 *                         groupName:
 *                           type: string
 *                           example: Developer Group
 *
 *                         groupCode:
 *                           type: string
 *                           example: SBG-001
 *
 *                     payment:
 *                       type: object
 *
 *                       properties:
 *
 *                         contributionAmount:
 *                           type: number
 *                           example: 500
 *
 *                         loanAmount:
 *                           type: number
 *                           example: 1200
 *
 *                         totalAmount:
 *                           type: number
 *                           example: 1700
 *
 *                         installmentCount:
 *                           type: number
 *                           example: 2
 *
 *                         installments:
 *                           type: array
 *
 *                           items:
 *                             type: object
 *
 *                         month:
 *                           type: string
 *                           example: 2026-05-01
 *
 *                         upiId:
 *                           type: string
 *                           example: atharv@upi
 *
 *                         screenshotUrl:
 *                           type: string
 *                           example: https://res.cloudinary.com/demo/payment.jpg
 *
 *                         extractedInfo:
 *                           type: object
 *
 *                           properties:
 *
 *                             extractedAmount:
 *                               type: number
 *                               example: 1700
 *
 *                             transactionId:
 *                               type: string
 *                               example: TXN123456
 *
 *                             paidTo:
 *                               type: string
 *                               example: Atharv Saraf
 *
 *                             paidFrom:
 *                               type: string
 *                               nullable: true
 *
 *                             transactionDate:
 *                               type: string
 *                               format: date-time
 *
 *                     status:
 *                       type: string
 *                       example: accepted
 *
 *                     rejectionReason:
 *                       type: string
 *                       nullable: true
 *                       example: Amount mismatch
 *
 *                     acceptedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *
 *                     rejectedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: Access denied - Admin only
 *
 *       404:
 *         description: Payment request not found
 *
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
 * /api/payments/member/{groupId}:
 *   get:
 *     summary: Get member payment page details with contribution, loan amount and UPI payment link
 *
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         example: 665c1f9a2b7d8f1234567890
 *
 *     responses:
 *
 *       200:
 *         description: Member payment page fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Member payment page fetched successfully
 *
 *                 paymentPage:
 *                   type: object
 *
 *                   properties:
 *
 *                     group:
 *                       type: object
 *
 *                       properties:
 *
 *                         groupId:
 *                           type: string
 *                           example: 665c1f9a2b7d8f1234567890
 *
 *                         groupName:
 *                           type: string
 *                           example: Developer Group
 *
 *                         groupCode:
 *                           type: string
 *                           example: SBG-001
 *
 *                     paymentBreakdown:
 *                       type: object
 *
 *                       properties:
 *
 *                         contributionAmount:
 *                           type: number
 *                           example: 500
 *
 *                         loanAmount:
 *                           type: number
 *                           example: 1200
 *
 *                         totalAmount:
 *                           type: number
 *                           example: 1700
 *
 *                         installmentCount:
 *                           type: number
 *                           example: 2
 *
 *                         hasLoanPayment:
 *                           type: boolean
 *                           example: true
 *
 *                         month:
 *                           type: string
 *                           example: 2026-06
 *
 *                     installments:
 *                       type: array
 *
 *                       items:
 *                         type: object
 *
 *                         properties:
 *
 *                           installmentId:
 *                             type: string
 *                             example: 665c1f9a2b7d8f1234567811
 *
 *                           loanId:
 *                             type: string
 *                             example: 665c1f9a2b7d8f1234567812
 *
 *                           installmentNumber:
 *                             type: number
 *                             example: 3
 *
 *                           principalAmount:
 *                             type: number
 *                             example: 1000
 *
 *                           interestAmount:
 *                             type: number
 *                             example: 200
 *
 *                           totalAmount:
 *                             type: number
 *                             example: 1200
 *
 *                           dueDate:
 *                             type: string
 *                             format: date-time
 *
 *                     ownerAccount:
 *                       type: object
 *
 *                       properties:
 *
 *                         adminId:
 *                           type: string
 *                           example: 665c1f9a2b7d8f1234567822
 *
 *                         adminName:
 *                           type: string
 *                           example: Atharv Saraf
 *
 *                         mobileNumber:
 *                           type: string
 *                           example: 9876543210
 *
 *                         upiId:
 *                           type: string
 *                           example: atharv@upi
 *
 *                         bankAccountDetails:
 *                           type: object
 *
 *                           properties:
 *
 *                             accountHolderName:
 *                               type: string
 *                               example: Atharv Saraf
 *
 *                             bankName:
 *                               type: string
 *                               example: State Bank of India
 *
 *                             accountNumber:
 *                               type: string
 *                               example: 123456789012
 *
 *                             ifscCode:
 *                               type: string
 *                               example: SBIN0001234
 *
 *                     paymentDetails:
 *                       type: object
 *
 *                       properties:
 *
 *                         upiDeepLink:
 *                           type: string
 *                           example: upi://pay?pa=atharv@upi&pn=Atharv%20Saraf
 *
 *       400:
 *         description: Admin UPI ID not found
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: User is not approved member of this group
 *
 *       404:
 *         description: Group not found
 *
 *       500:
 *         description: Internal server error
 */
router.get(
    "/member/:groupId",
    authMiddleware,
    generateContributionPaymentLink
);

/**
 * @swagger
 * /api/payments/update-payment-request-status:
 *   patch:
 *     summary: Accept or reject member payment request
 *
 *     tags:
 *       - Payment
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - paymentRequestId
 *               - status
 *
 *             properties:
 *
 *               paymentRequestId:
 *                 type: string
 *                 example: 665c1f9a2b7d8f1234567890
 *
 *               status:
 *                 type: string
 *                 enum:
 *                   - accepted
 *                   - rejected
 *                 example: accepted
 *
 *               rejectionReason:
 *                 type: string
 *                 example: Screenshot amount mismatch
 *
 *     responses:
 *
 *       200:
 *         description: Payment request updated successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Payment request accepted successfully
 *
 *                 paymentRequest:
 *                   type: object
 *
 *                   properties:
 *
 *                     requestId:
 *                       type: string
 *                       example: 665c1f9a2b7d8f1234567890
 *
 *                     status:
 *                       type: string
 *                       example: accepted
 *
 *                     contributionAmount:
 *                       type: number
 *                       example: 500
 *
 *                     loanAmount:
 *                       type: number
 *                       example: 1200
 *
 *                     totalAmount:
 *                       type: number
 *                       example: 1700
 *
 *                     month:
 *                       type: string
 *                       example: 2026-06
 *
 *                     acceptedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *
 *                     rejectedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *
 *                     rejectionReason:
 *                       type: string
 *                       nullable: true
 *                       example: Screenshot amount mismatch
 *
 *       400:
 *         description: Invalid status, missing fields or request already processed
 *
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *       403:
 *         description: Access denied - Admin only
 *
 *       404:
 *         description: Payment request not found
 *
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
 *     summary: Resubmit a rejected payment request with updated screenshot and comments
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
 *         description: Payment request ID to be resubmitted
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
 *                 description: New screenshot file for payment proof
 *               additionalComments:
 *                 type: string
 *                 example: "Updated screenshot due to previous blur issue"
 *                 description: Optional comments for resubmission
 *     responses:
 *       200:
 *         description: Payment resubmitted successfully
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
 *                   example: "Payment resubmitted successfully"
 *                 paymentRequest:
 *                   type: object
 *       400:
 *         description: Bad request - missing screenshot or invalid payment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Only rejected payment requests can be resubmitted"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - User not authorized to access this payment request
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
 *         description: Payment request ID
 *     responses:
 *       200:
 *         description: Payment request fetched successfully
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
 *                   example: "Payment request fetched successfully"
 *                 paymentRequest:
 *                   type: object
 *                   properties:
 *                     paymentRequestId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: rejected
 *                     month:
 *                       type: string
 *                     contributionAmount:
 *                       type: number
 *                     loanAmount:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     installmentCount:
 *                       type: number
 *                     installments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     screenshotUrl:
 *                       type: string
 *                     extractedInfo:
 *                       type: object
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     rejectedAt:
 *                       type: string
 *                       format: date-time
 *                     acceptedAt:
 *                       type: string
 *                       format: date-time
 *                     resubmittedAt:
 *                       type: string
 *                       format: date-time
 *                     rejectionReason:
 *                       type: string
 *                     additionalComments:
 *                       type: string
 *                     resubmissionCount:
 *                       type: number
 *                     group:
 *                       type: object
 *                       properties:
 *                         groupId:
 *                           type: string
 *                         groupName:
 *                           type: string
 *                         groupCode:
 *                           type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         adminId:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         mobileNumber:
 *                           type: string
 *                     member:
 *                       type: object
 *                       properties:
 *                         memberId:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         mobileNumber:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - User not authorized to access this payment request
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