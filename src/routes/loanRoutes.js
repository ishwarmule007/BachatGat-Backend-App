const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middlewares/authMiddleware");

const adminMiddleware =
    require("../middlewares/adminMiddleware");

const {

    requestLoan,

    sendLoanProposal,

    rejectLoanProposalByAdmin,

    getLoanRepaymentSchedule,

    getAllLoanRequests,

    getLoanRequestDetails,

    acceptLoanProposal,

    rejectLoanProposalbyMember,

    getAcceptedLoanProposals,

    createLoan,

    getLoanDetailsByAdmin,

    getLoanDetailsByMember,

    getMyLoans,

    getGroupLoans,

} = require(
    "../controllers/loanController"
);

router.post(
    "/request-loan",
    authMiddleware,
    requestLoan
);

router.post(
    "/send-loan-proposal",
    authMiddleware,
    adminMiddleware,
    sendLoanProposal
);

router.post(
    "/reject-loan-request",
    authMiddleware,
    adminMiddleware,
    rejectLoanProposalByAdmin
);

router.get(
    "/loan-requests",
    authMiddleware,
    adminMiddleware,
    getAllLoanRequests
);

router.get(
    "/loan-request/:loanRequestId",
    authMiddleware,
    adminMiddleware,
    getLoanRequestDetails
);

router.post(
    "/accept-loan-proposal",
    authMiddleware,
    acceptLoanProposal
);

router.post(
    "/reject-loan-proposal",
    authMiddleware,
    rejectLoanProposalbyMember
);

router.get(
    "/accepted-loan-proposals",
    authMiddleware,
    adminMiddleware,
    getAcceptedLoanProposals
);

router.post(
    "/create-loan",
    authMiddleware,
    adminMiddleware,
    createLoan
);

router.get(
    "/admin-loan/:loanId",
    authMiddleware,
    adminMiddleware,
    getLoanDetailsByAdmin
);

router.get(
    "/member-loan/:loanId",
    authMiddleware,
    getLoanDetailsByMember
);

router.get(
    "/my-loans",
    authMiddleware,
    getMyLoans
);

router.get(
    "/group-loans/:groupId",
    authMiddleware,
    getGroupLoans
);

router.get(
    "/loan-repayment-schedule/:loanId",
    authMiddleware,
    getLoanRepaymentSchedule
);

module.exports = router;