const express = require('express');
const router = express.Router();
const {
    getStockMovements,
    stockIn,
    stockOut,
    stockAdjustment,
    getLowStock
} = require('../controllers/stockController');
const { auth, adminOnly } = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Get routes (all authenticated users)
router.get('/', getStockMovements);
router.get('/low', getLowStock);

// Admin only routes
router.post('/in', adminOnly, stockIn);
router.post('/out', adminOnly, stockOut);
router.post('/adjustment', adminOnly, stockAdjustment);

module.exports = router;
