const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {
    updatePaymentRequestStatus,
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

router.put(
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