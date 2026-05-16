const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
    updatePaymentRequestStatus,
    getMemberPaymentPage,
    getMemberPaymentHistory,
    getAdminPaymentRequests
} = require("../controllers/paymentController");
const {
    createPaymentRequest
} = require("../controllers/contibutionController");
const {
    getAdminPaymentDashboard
} = require("../controllers/adminController");
router.post(
    "/request",
    authMiddleware,
    createPaymentRequest
);
router.get(
    "/member/:groupCode",
    authMiddleware,
    getMemberPaymentPage
);
router.get(
    "/member/history",
    authMiddleware,
    getMemberPaymentHistory
);

router.get(
    "/admin/requests",
    authMiddleware,
    adminMiddleware,
    getAdminPaymentRequests
);
router.get(
    "/admin/dashboard",
    authMiddleware,
    adminMiddleware,
    getAdminPaymentDashboard
);

module.exports = router;