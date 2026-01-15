const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Get all users
const getUsers = async (req, res, next) => {
    try {
        const { search, role, isActive } = req.query;

        const where = {};

        if (search) {
            where.OR = [
                { username: { contains: search } },
                { email: { contains: search } },
                { fullName: { contains: search } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ users });
    } catch (error) {
        next(error);
    }
};

// Get user by ID
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        transactions: true,
                        activityLogs: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

// Update user
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, email, fullName, role, isActive } = req.body;

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                ...(username && { username }),
                ...(email && { email }),
                ...(fullName && { fullName }),
                ...(role && { role }),
                ...(isActive !== undefined && { isActive })
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                updatedAt: true
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_USER',
                description: `Updated user: ${user.username}`,
                ipAddress: req.ip
            }
        });

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        next(error);
    }
};

// Delete user
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'DELETE_USER',
                description: `Deleted user: ${user.username}`,
                ipAddress: req.ip
            }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Reset password
const resetPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { password: hashedPassword },
            select: { id: true, username: true }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'RESET_PASSWORD',
                description: `Reset password for user: ${user.username}`,
                ipAddress: req.ip
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
};

// Change own password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CHANGE_PASSWORD',
                description: 'Changed own password',
                ipAddress: req.ip
            }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

// Get activity logs
const getActivityLogs = async (req, res, next) => {
    try {
        const { userId, action, startDate, endDate, limit = 50 } = req.query;

        const where = {};

        if (userId) {
            where.userId = parseInt(userId);
        }

        if (action) {
            where.action = action;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const logs = await prisma.activityLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, username: true, fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({ logs });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
    changePassword,
    getActivityLogs
};
