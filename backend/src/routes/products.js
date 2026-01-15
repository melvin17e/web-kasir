const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getProductByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts
} = require('../controllers/productController');
const { auth, adminOnly } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// All routes require authentication
router.use(auth);

// Get routes (all authenticated users)
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/barcode/:code', getProductByBarcode);
router.get('/:id', getProductById);

// Admin only routes
router.post('/', adminOnly, upload.single('image'), createProduct);
router.put('/:id', adminOnly, upload.single('image'), updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

module.exports = router;
