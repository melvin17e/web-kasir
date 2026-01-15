const express = require('express');
const router = express.Router();
const {
    getSalesReport,
    getStockReport,
    getCashReport,
    exportReport
} = require('../controllers/reportController');
const { auth, adminOnly } = require('../middlewares/auth');

// All routes require authentication and admin access
router.use(auth, adminOnly);

router.get('/sales', getSalesReport);
router.get('/stock', getStockReport);
router.get('/cash', getCashReport);
router.get('/export', exportReport);

module.exports = router;
