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
    getPaymentRequestDetail
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
    upload.single("screenshot"),
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
router.get(
    "/admin/requests/:requestId",
    authMiddleware,
    adminMiddleware,
    getPaymentRequestDetail
);
router.patch(
    "/admin/requests/:requestId/status",
    authMiddleware,
    adminMiddleware,
    updatePaymentRequestStatus
);

module.exports = router;