const express = require('express');
const router = express.Router();
const {
    createLoan,
    getLoanDetailsByAdmin,
    getLoanDetailsByMember,
    getGroupLoans,
    getOverdueLoans,
    approveLoanPayment,
    rejectLoanPayment,
    getMyLoans,
    getLoanInstallments,
    payLoanInstallment,
    getPendingInstallments,
    generateLoanInstallmentPaymentLink
} = require('../controllers/loanController');
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post('/loans', authMiddleware, adminMiddleware, createLoan);
router.get('/loans/:loanId', authMiddleware, getLoanDetailsByAdmin);
router.get('/loans/member/:loanId', authMiddleware, getLoanDetailsByMember);
router.get('/groups/:groupId/loans', authMiddleware, getGroupLoans);
router.get('/loans/overdue', authMiddleware, adminMiddleware, getOverdueLoans);
router.post('/loans/:loanId/approve', authMiddleware, adminMiddleware, approveLoanPayment);
router.post('/loans/:loanId/reject', authMiddleware, adminMiddleware, rejectLoanPayment);
router.get('/my-loans', authMiddleware, getMyLoans);
router.get('/loans/:loanId/installments', authMiddleware, getLoanInstallments);
router.post('/installments/:installmentId/pay', authMiddleware, payLoanInstallment);
router.get('/loans/:loanId/pending-installments', authMiddleware, getPendingInstallments);
router.get('/installments/:installmentId/payment-link', authMiddleware, generateLoanInstallmentPaymentLink);

module.exports = router;