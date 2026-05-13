const express = require("express");

const {
    getMemberGroupRequests,
    acceptGroupRequest,
    rejectGroupRequest,
    getMemberHomeDashboard,
    getMemberProfile
} = require("../controllers/memberController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/group-requests",
    authMiddleware,
    getMemberGroupRequests
);
router.get(
    "/home-dashboard",
    authMiddleware,
    getMemberHomeDashboard
);
router.post(
    "/group-requests/accept",
    authMiddleware,
    acceptGroupRequest
);

router.post(
    "/group-requests/reject",
    authMiddleware,
    rejectGroupRequest
);
router.get(
    "/profile",
    authMiddleware,
    getMemberProfile
);
module.exports = router;