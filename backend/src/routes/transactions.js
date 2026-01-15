const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionById,
    createTransaction,
    cancelTransaction,
    getReceipt
} = require('../controllers/transactionController');
const { auth, adminOnly, cashierOrAdmin } = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Cashier and admin routes
router.get('/', cashierOrAdmin, getTransactions);
router.get('/:id', cashierOrAdmin, getTransactionById);
router.get('/:id/receipt', cashierOrAdmin, getReceipt);
router.post('/', cashierOrAdmin, createTransaction);

// Admin only
router.post('/:id/cancel', adminOnly, cancelTransaction);

module.exports = router;
