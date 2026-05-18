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
    removeMemberFromGroup
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.post(
    "/register",
    registerAdmin
);
router.get(
    "/profile",
    authMiddleware,
    adminMiddleware,
    getAdminProfile);
router.put(
    "/payment-details",
    authMiddleware,
    adminMiddleware,
    updatePaymentDetails
);
router.get(
    "/dashboard-overview",
    authMiddleware,
    adminMiddleware,
    getAdminDashboardOverview
);
router.patch(
    "/upi-id",
    authMiddleware,
    adminMiddleware,
    updateUpiId);
router.post(
    "/create-group",
    authMiddleware,
    adminMiddleware,
    createGroup
);



router.post(
    "/add-member",
    authMiddleware,
    adminMiddleware,
    addMember
);

router.get(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    getAdminMemberProfile
);

router.delete(
    "/groups/:groupCode/members/:memberId",
    authMiddleware,
    adminMiddleware,
    removeMemberFromGroup
);

module.exports = router;