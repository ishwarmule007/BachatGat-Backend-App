const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {
    createPaymentRequest,
    updatePaymentRequestStatus,
    getAdminPaymentDashboard,
} = require("../controllers/paymentController");

router.post(
    "/request",
    authMiddleware,
    createPaymentRequest
);

router.patch(
    "/admin/update-status",
    authMiddleware,
    adminMiddleware,
    updatePaymentRequestStatus
);

router.get(
    "/admin/dashboard",
    authMiddleware,
    adminMiddleware,
    getAdminPaymentDashboard
);

module.exports = router;