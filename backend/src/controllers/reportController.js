const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sales report
const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                status: 'completed'
            },
            include: {
                user: { select: { fullName: true } },
                items: {
                    include: {
                        product: { select: { name: true, buyPrice: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate totals
        let totalSales = 0;
        let totalCost = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        let transactionCount = 0;

        const salesByDate = {};

        transactions.forEach(t => {
            let key;
            if (groupBy === 'month') {
                key = `${t.createdAt.getFullYear()}-${(t.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
            } else {
                key = t.createdAt.toISOString().split('T')[0];
            }

            if (!salesByDate[key]) {
                salesByDate[key] = { date: key, sales: 0, cost: 0, profit: 0, count: 0 };
            }

            // Calculate cost of goods sold
            let itemsCost = 0;
            t.items.forEach(item => {
                itemsCost += item.product.buyPrice * item.quantity;
            });

            salesByDate[key].sales += t.total;
            salesByDate[key].cost += itemsCost;
            salesByDate[key].profit += t.total - itemsCost;
            salesByDate[key].count += 1;

            totalSales += t.total;
            totalCost += itemsCost;
            totalDiscount += t.discountAmount;
            totalTax += t.taxAmount;
            transactionCount += 1;
        });

        res.json({
            summary: {
                totalSales,
                totalCost,
                grossProfit: totalSales - totalCost,
                totalDiscount,
                totalTax,
                transactionCount,
                averageTransaction: transactionCount > 0 ? totalSales / transactionCount : 0
            },
            dailyData: Object.values(salesByDate),
            transactions
        });
    } catch (error) {
        next(error);
    }
};

// Stock report
const getStockReport = async (req, res, next) => {
    try {
        const { categoryId, sortBy = 'name', order = 'asc' } = req.query;

        const where = { isActive: true };
        if (categoryId) where.categoryId = parseInt(categoryId);

        const products = await prisma.product.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, color: true } }
            },
            orderBy: { [sortBy]: order }
        });

        // Calculate stock value
        let totalStockValue = 0;
        let totalRetailValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        const stockData = products.map(p => {
            const stockValue = p.buyPrice * p.stock;
            const retailValue = p.sellPrice * p.stock;

            totalStockValue += stockValue;
            totalRetailValue += retailValue;

            if (p.stock === 0) outOfStockCount++;
            else if (p.stock <= p.minStock) lowStockCount++;

            return {
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                category: p.category,
                stock: p.stock,
                minStock: p.minStock,
                unit: p.unit,
                buyPrice: p.buyPrice,
                sellPrice: p.sellPrice,
                stockValue,
                retailValue,
                status: p.stock === 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'ok'
            };
        });

        res.json({
            summary: {
                totalProducts: products.length,
                totalStockValue,
                totalRetailValue,
                potentialProfit: totalRetailValue - totalStockValue,
                lowStockCount,
                outOfStockCount
            },
            products: stockData
        });
    } catch (error) {
        next(error);
    }
};

// Cash report
const getCashReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Get transactions by payment method
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                status: 'completed'
            },
            select: {
                id: true,
                invoiceNo: true,
                total: true,
                paidAmount: true,
                changeAmount: true,
                paymentMethod: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by payment method
        const byMethod = {
            cash: { count: 0, total: 0 },
            qris: { count: 0, total: 0 },
            transfer: { count: 0, total: 0 }
        };

        transactions.forEach(t => {
            if (byMethod[t.paymentMethod]) {
                byMethod[t.paymentMethod].count++;
                byMethod[t.paymentMethod].total += t.total;
            }
        });

        // Daily breakdown
        const dailyData = {};
        transactions.forEach(t => {
            const key = t.createdAt.toISOString().split('T')[0];
            if (!dailyData[key]) {
                dailyData[key] = { date: key, cash: 0, qris: 0, transfer: 0, total: 0 };
            }
            dailyData[key][t.paymentMethod] += t.total;
            dailyData[key].total += t.total;
        });

        res.json({
            summary: {
                totalIncome: transactions.reduce((sum, t) => sum + t.total, 0),
                transactionCount: transactions.length,
                byMethod
            },
            dailyData: Object.values(dailyData),
            transactions
        });
    } catch (error) {
        next(error);
    }
};

// Export to CSV/Excel format
const exportReport = async (req, res, next) => {
    try {
        const { type, startDate, endDate } = req.query;

        if (!type || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Report type, start date, and end date are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let data = [];
        let headers = [];

        if (type === 'sales') {
            const transactions = await prisma.transaction.findMany({
                where: {
                    createdAt: { gte: start, lte: end },
                    status: 'completed'
                },
                include: {
                    user: { select: { fullName: true } }
                },
                orderBy: { createdAt: 'asc' }
            });

            headers = ['Invoice', 'Date', 'Cashier', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment'];
            data = transactions.map(t => ({
                Invoice: t.invoiceNo,
                Date: t.createdAt.toLocaleString(),
                Cashier: t.user.fullName,
                Subtotal: t.subtotal,
                Discount: t.discountAmount,
                Tax: t.taxAmount,
                Total: t.total,
                Payment: t.paymentMethod
            }));
        } else if (type === 'stock') {
            const products = await prisma.product.findMany({
                where: { isActive: true },
                include: {
                    category: { select: { name: true } }
                },
                orderBy: { name: 'asc' }
            });

            headers = ['Name', 'Barcode', 'Category', 'Stock', 'Min Stock', 'Unit', 'Buy Price', 'Sell Price', 'Stock Value'];
            data = products.map(p => ({
                Name: p.name,
                Barcode: p.barcode || '',
                Category: p.category.name,
                Stock: p.stock,
                'Min Stock': p.minStock,
                Unit: p.unit,
                'Buy Price': p.buyPrice,
                'Sell Price': p.sellPrice,
                'Stock Value': p.buyPrice * p.stock
            }));
        }

        res.json({
            headers,
            data,
            filename: `${type}_report_${startDate}_${endDate}.csv`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSalesReport,
    getStockReport,
    getCashReport,
    exportReport
};
