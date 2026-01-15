const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesChart,
    getPaymentStats,
    getCategorySales
} = require('../controllers/dashboardController');
const { auth } = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

router.get('/stats', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/payment-stats', getPaymentStats);
router.get('/category-sales', getCategorySales);

module.exports = router;
