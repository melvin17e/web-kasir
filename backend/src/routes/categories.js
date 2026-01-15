const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { auth, adminOnly } = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Get routes (all authenticated users)
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin only routes
router.post('/', adminOnly, createCategory);
router.put('/:id', adminOnly, updateCategory);
router.delete('/:id', adminOnly, deleteCategory);

module.exports = router;
