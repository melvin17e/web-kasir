const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
    changePassword,
    getActivityLogs
} = require('../controllers/userController');
const { auth, adminOnly } = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// User can change own password
router.post('/change-password', changePassword);

// Admin only routes
router.get('/', adminOnly, getUsers);
router.get('/activity-logs', adminOnly, getActivityLogs);
router.get('/:id', adminOnly, getUserById);
router.put('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);
router.post('/:id/reset-password', adminOnly, resetPassword);

module.exports = router;
