const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Get all products
const getProducts = async (req, res, next) => {
    try {
        const { search, categoryId, isActive, lowStock, page = 1, limit = 50 } = req.query;

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { barcode: { contains: search } },
                { sku: { contains: search } }
            ];
        }

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (lowStock === 'true') {
            where.stock = { lte: prisma.product.fields.minStock };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: {
                        select: { id: true, name: true, color: true }
                    }
                },
                orderBy: { name: 'asc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            products,
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

// Get product by ID
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        user: { select: { id: true, username: true } }
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product });
    } catch (error) {
        next(error);
    }
};

// Get product by barcode
const getProductByBarcode = async (req, res, next) => {
    try {
        const { code } = req.params;

        const product = await prisma.product.findUnique({
            where: { barcode: code },
            include: {
                category: { select: { id: true, name: true, color: true } }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!product.isActive) {
            return res.status(400).json({ error: 'Product is not active' });
        }

        res.json({ product });
    } catch (error) {
        next(error);
    }
};

// Create product
const createProduct = async (req, res, next) => {
    try {
        const {
            name, barcode, sku, categoryId, buyPrice, sellPrice,
            discount, stock, minStock, unit, description
        } = req.body;

        if (!name || !categoryId) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        let image = null;
        if (req.file) {
            image = `/uploads/products/${req.file.filename}`;
        }

        const product = await prisma.product.create({
            data: {
                name,
                barcode: barcode || null,
                sku: sku || null,
                image,
                categoryId: parseInt(categoryId),
                buyPrice: parseFloat(buyPrice) || 0,
                sellPrice: parseFloat(sellPrice) || 0,
                discount: parseFloat(discount) || 0,
                stock: parseInt(stock) || 0,
                minStock: parseInt(minStock) || 5,
                unit: unit || 'pcs',
                description
            },
            include: {
                category: { select: { id: true, name: true } }
            }
        });

        // Log initial stock if any
        if (stock && parseInt(stock) > 0) {
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    userId: req.user.id,
                    type: 'in',
                    quantity: parseInt(stock),
                    notes: 'Initial stock'
                }
            });
        }

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        next(error);
    }
};

// Update product
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name, barcode, sku, categoryId, buyPrice, sellPrice,
            discount, minStock, unit, description, isActive
        } = req.body;

        const updateData = {};

        if (name) updateData.name = name;
        if (barcode !== undefined) updateData.barcode = barcode || null;
        if (sku !== undefined) updateData.sku = sku || null;
        if (categoryId) updateData.categoryId = parseInt(categoryId);
        if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
        if (sellPrice !== undefined) updateData.sellPrice = parseFloat(sellPrice);
        if (discount !== undefined) updateData.discount = parseFloat(discount);
        if (minStock !== undefined) updateData.minStock = parseInt(minStock);
        if (unit) updateData.unit = unit;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        if (req.file) {
            // Delete old image
            const oldProduct = await prisma.product.findUnique({
                where: { id: parseInt(id) },
                select: { image: true }
            });

            if (oldProduct?.image) {
                const oldImagePath = path.join(__dirname, '../../', oldProduct.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            updateData.image = `/uploads/products/${req.file.filename}`;
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                category: { select: { id: true, name: true } }
            }
        });

        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        next(error);
    }
};

// Delete product
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if product has transactions
        const transactionsCount = await prisma.transactionItem.count({
            where: { productId: parseInt(id) }
        });

        if (transactionsCount > 0) {
            // Soft delete
            await prisma.product.update({
                where: { id: parseInt(id) },
                data: { isActive: false }
            });
            return res.json({ message: 'Product deactivated (has transaction history)' });
        }

        // Delete image
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            select: { image: true }
        });

        if (product?.image) {
            const imagePath = path.join(__dirname, '../../', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Hard delete
        await prisma.stockMovement.deleteMany({
            where: { productId: parseInt(id) }
        });

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Get low stock products
const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await prisma.$queryRaw`
      SELECT p.*, c.name as categoryName, c.color as categoryColor
      FROM Product p
      LEFT JOIN Category c ON p.categoryId = c.id
      WHERE p.stock <= p.minStock AND p.isActive = 1
      ORDER BY p.stock ASC
    `;

        res.json({ products });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    getProductByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts
};
