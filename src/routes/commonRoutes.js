const express = require("express");
const router = express.Router();
const { updateLanguage, getGroupMembers, getGroupDetails, getMyGroups, logoutUser } = require("../controllers/commonController");

const authMiddleware = require("../middlewares/authMiddleware");

router.put(
    "/update-language",
    authMiddleware,
    updateLanguage
);
router.get(
    "/groups/:groupCode/members",
    authMiddleware,
    getGroupMembers
);
router.get(
    "/groups/:groupCode/details",
    authMiddleware,
    getGroupDetails
);
router.get(
    "/my-groups",
    authMiddleware,
    getMyGroups
);
router.post(
    "/logout",
    authMiddleware,
    logoutUser
);

module.exports = router;