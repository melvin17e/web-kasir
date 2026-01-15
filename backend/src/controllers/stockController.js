const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get stock movements
const getStockMovements = async (req, res, next) => {
    try {
        const { productId, userId, type, startDate, endDate, page = 1, limit = 50 } = req.query;

        const where = {};

        if (productId) where.productId = parseInt(productId);
        if (userId) where.userId = parseInt(userId);
        if (type) where.type = type;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                include: {
                    product: { select: { id: true, name: true, barcode: true } },
                    user: { select: { id: true, username: true, fullName: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.stockMovement.count({ where })
        ]);

        res.json({
            movements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// Stock in
const stockIn = async (req, res, next) => {
    try {
        const { productId, quantity, notes } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Product ID and positive quantity are required' });
        }

        // Update product stock
        const product = await prisma.product.update({
            where: { id: parseInt(productId) },
            data: { stock: { increment: parseInt(quantity) } }
        });

        // Create stock movement
        const movement = await prisma.stockMovement.create({
            data: {
                productId: parseInt(productId),
                userId: req.user.id,
                type: 'in',
                quantity: parseInt(quantity),
                notes
            },
            include: {
                product: { select: { id: true, name: true, stock: true } },
                user: { select: { id: true, username: true } }
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'STOCK_IN',
                description: `Added ${quantity} stock to ${product.name}`,
                ipAddress: req.ip
            }
        });

        res.status(201).json({
            message: 'Stock added successfully',
            movement,
            newStock: product.stock
        });
    } catch (error) {
        next(error);
    }
};

// Stock out
const stockOut = async (req, res, next) => {
    try {
        const { productId, quantity, notes } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Product ID and positive quantity are required' });
        }

        // Check current stock
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                error: `Insufficient stock. Available: ${product.stock}`
            });
        }

        // Update product stock
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(productId) },
            data: { stock: { decrement: parseInt(quantity) } }
        });

        // Create stock movement
        const movement = await prisma.stockMovement.create({
            data: {
                productId: parseInt(productId),
                userId: req.user.id,
                type: 'out',
                quantity: parseInt(quantity),
                notes
            },
            include: {
                product: { select: { id: true, name: true, stock: true } },
                user: { select: { id: true, username: true } }
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'STOCK_OUT',
                description: `Removed ${quantity} stock from ${product.name}`,
                ipAddress: req.ip
            }
        });

        res.status(201).json({
            message: 'Stock removed successfully',
            movement,
            newStock: updatedProduct.stock
        });
    } catch (error) {
        next(error);
    }
};

// Stock adjustment
const stockAdjustment = async (req, res, next) => {
    try {
        const { productId, newStock, notes } = req.body;

        if (!productId || newStock === undefined || newStock < 0) {
            return res.status(400).json({ error: 'Product ID and non-negative new stock are required' });
        }

        // Get current stock
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const difference = parseInt(newStock) - product.stock;

        // Update product stock
        await prisma.product.update({
            where: { id: parseInt(productId) },
            data: { stock: parseInt(newStock) }
        });

        // Create stock movement
        const movement = await prisma.stockMovement.create({
            data: {
                productId: parseInt(productId),
                userId: req.user.id,
                type: 'adjustment',
                quantity: difference,
                notes: notes || `Adjustment from ${product.stock} to ${newStock}`
            },
            include: {
                product: { select: { id: true, name: true, stock: true } },
                user: { select: { id: true, username: true } }
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'STOCK_ADJUSTMENT',
                description: `Adjusted stock for ${product.name}: ${product.stock} → ${newStock}`,
                ipAddress: req.ip
            }
        });

        res.status(201).json({
            message: 'Stock adjusted successfully',
            movement,
            previousStock: product.stock,
            newStock: parseInt(newStock)
        });
    } catch (error) {
        next(error);
    }
};

// Get low stock products
const getLowStock = async (req, res, next) => {
    try {
        const products = await prisma.$queryRaw`
      SELECT p.id, p.name, p.barcode, p.stock, p.minStock, p.unit,
             c.name as categoryName, c.color as categoryColor
      FROM Product p
      LEFT JOIN Category c ON p.categoryId = c.id
      WHERE p.stock <= p.minStock AND p.isActive = 1
      ORDER BY (p.minStock - p.stock) DESC, p.stock ASC
    `;

        res.json({ products, count: products.length });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStockMovements,
    stockIn,
    stockOut,
    stockAdjustment,
    getLowStock
};
