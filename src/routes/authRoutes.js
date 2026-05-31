const express = require('express');
const router = express.Router();
const { passwordlogin, sendOTP, verifyOTP, forgetPassword, getMyProfile } = require('../controllers/authController');
const authMiddleware = require("../middlewares/authMiddleware");
const {
    isAdmin
} = require('../middlewares/adminMiddleware');


/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to registered mobile number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Internal server error
 */
router.post('/send-otp', sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for login or forgot password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - otp
 *               - purpose
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [login, forgotPassword]
 *                 example: "login"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', verifyOTP);

/**
 * @swagger
 * /api/auth/password-login:
 *   post:
 *     summary: Login using mobile number and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - password
 *               - roleSelection
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "atharv123"
 *               roleSelection:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid password or role mismatch
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/password-login', passwordlogin);

/**
 * @swagger
 * /api/auth/forget-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or passwords do not match
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/forget-password', forgetPassword);

/**
 * @swagger
 * /api/auth/my-profile:
 *   get:
 *     summary: Get logged in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile fetched successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "665c1f9a2b7d8f1234567890"
 *                     fullName:
 *                       type: string
 *                       example: "Atharv Saraf"
 *                     mobileNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     roleSelection:
 *                       type: string
 *                       example: "admin"
 *                     preferredLanguage:
 *                       type: string
 *                       example: "english"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/my-profile', authMiddleware, getMyProfile);

module.exports = router;