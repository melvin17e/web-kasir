const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate invoice number
const generateInvoiceNo = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0') +
        date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV${year}${month}${day}${time}${random}`;
};

// Get all transactions
const getTransactions = async (req, res, next) => {
    try {
        const {
            search, userId, paymentMethod, status,
            startDate, endDate, page = 1, limit = 50
        } = req.query;

        const where = {};

        if (search) {
            where.invoiceNo = { contains: search };
        }

        if (userId) {
            where.userId = parseInt(userId);
        }

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        if (status) {
            where.status = status;
        }

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

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    user: { select: { id: true, username: true, fullName: true } },
                    items: {
                        include: {
                            product: { select: { id: true, name: true, barcode: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.transaction.count({ where })
        ]);

        res.json({
            transactions,
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

// Get transaction by ID
const getTransactionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { id: true, username: true, fullName: true } },
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, barcode: true, image: true }
                        }
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ transaction });
    } catch (error) {
        next(error);
    }
};

// Create transaction
const createTransaction = async (req, res, next) => {
    try {
        const {
            items, discountPercent = 0, taxPercent = 0,
            paidAmount, paymentMethod = 'cash', notes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Transaction must have at least one item' });
        }

        // Calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) {
                return res.status(400).json({ error: `Product ID ${item.productId} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemDiscount = item.discount || product.discount || 0;
            const itemPrice = product.sellPrice * (1 - itemDiscount / 100);
            const itemSubtotal = itemPrice * item.quantity;

            subtotal += itemSubtotal;

            processedItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                price: product.sellPrice,
                discount: itemDiscount,
                subtotal: itemSubtotal
            });
        }

        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const total = afterDiscount + taxAmount;
        const changeAmount = paidAmount - total;

        if (paidAmount < total) {
            return res.status(400).json({ error: 'Paid amount is less than total' });
        }

        // Create transaction with items
        const transaction = await prisma.transaction.create({
            data: {
                invoiceNo: generateInvoiceNo(),
                userId: req.user.id,
                subtotal,
                discountPercent,
                discountAmount,
                taxPercent,
                taxAmount,
                total,
                paidAmount,
                changeAmount,
                paymentMethod,
                status: 'completed',
                notes,
                items: {
                    create: processedItems
                }
            },
            include: {
                user: { select: { id: true, username: true, fullName: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, barcode: true } }
                    }
                }
            }
        });

        // Update stock for each item
        for (const item of processedItems) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } }
            });

            // Create stock movement
            await prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    userId: req.user.id,
                    type: 'out',
                    quantity: item.quantity,
                    notes: `Sale: ${transaction.invoiceNo}`
                }
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_TRANSACTION',
                description: `Created transaction: ${transaction.invoiceNo}`,
                ipAddress: req.ip
            }
        });

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction
        });
    } catch (error) {
        next(error);
    }
};

// Cancel transaction
const cancelTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status === 'cancelled') {
            return res.status(400).json({ error: 'Transaction already cancelled' });
        }

        // Restore stock
        for (const item of transaction.items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
            });

            // Create stock movement
            await prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    userId: req.user.id,
                    type: 'in',
                    quantity: item.quantity,
                    notes: `Cancelled transaction: ${transaction.invoiceNo}`
                }
            });
        }

        // Update transaction status
        await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: { status: 'cancelled' }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CANCEL_TRANSACTION',
                description: `Cancelled transaction: ${transaction.invoiceNo}`,
                ipAddress: req.ip
            }
        });

        res.json({ message: 'Transaction cancelled successfully' });
    } catch (error) {
        next(error);
    }
};

// Get receipt data
const getReceipt = async (req, res, next) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { fullName: true } },
                items: {
                    include: {
                        product: { select: { name: true, barcode: true } }
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Format receipt data
        const receipt = {
            storeName: 'POS SYSTEM',
            storeAddress: 'Jl. Contoh No. 123',
            storePhone: '021-1234567',
            invoiceNo: transaction.invoiceNo,
            date: transaction.createdAt,
            cashier: transaction.user.fullName,
            items: transaction.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount,
                subtotal: item.subtotal
            })),
            subtotal: transaction.subtotal,
            discount: transaction.discountAmount,
            tax: transaction.taxAmount,
            total: transaction.total,
            paid: transaction.paidAmount,
            change: transaction.changeAmount,
            paymentMethod: transaction.paymentMethod
        };

        res.json({ receipt });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTransactions,
    getTransactionById,
    createTransaction,
    cancelTransaction,
    getReceipt
};
