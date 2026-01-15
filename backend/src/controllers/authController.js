const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Login
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                description: 'User logged in',
                ipAddress: req.ip
            }
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// Register (Admin only)
const register = async (req, res, next) => {
    try {
        const { username, email, password, fullName, role } = req.body;

        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                fullName,
                role: role || 'cashier'
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        // Log activity
        if (req.user) {
            await prisma.activityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CREATE_USER',
                    description: `Created user: ${username}`,
                    ipAddress: req.ip
                }
            });
        }

        res.status(201).json({
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};

// Get current user
const me = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

// Logout
const logout = async (req, res, next) => {
    try {
        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'LOGOUT',
                description: 'User logged out',
                ipAddress: req.ip
            }
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { login, register, me, logout };
