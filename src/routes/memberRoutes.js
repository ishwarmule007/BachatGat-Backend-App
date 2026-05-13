const express = require("express");

const {
    getMemberGroupRequests,
    acceptGroupRequest,
    rejectGroupRequest,
    getMemberHomeDashboard
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

module.exports = router;