const express = require('express');
const router = express.Router();
const { passwordlogin, sendOTP, verifyOTP, forgetPassword, getMyProfile } = require('../controllers/authController');
const authMiddleware = require("../middlewares/authMiddleware");
const {
    isAdmin
} = require('../middlewares/adminMiddleware');
const {
    requestLoan,
    getLoanRequests,
    updateLoanStatus
} = require('../controllers/loanController');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/password-login', passwordlogin);
router.post('/forget-password', forgetPassword);
router.get('/my-profile', authMiddleware, getMyProfile);
router.post('/request-loan', authMiddleware, requestLoan);
router.get('/loan-requests', authMiddleware, getLoanRequests);
router.put('/update-loan-status', authMiddleware, updateLoanStatus);
module.exports = router;