const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get dashboard stats
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's transactions
        const todayTransactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                status: 'completed'
            }
        });

        const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
        const todayCount = todayTransactions.length;

        // Total products
        const totalProducts = await prisma.product.count({
            where: { isActive: true }
        });

        // Low stock count
        const lowStockCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Product 
      WHERE stock <= minStock AND isActive = 1
    `;

        // Top selling products today
        const topProducts = await prisma.transactionItem.groupBy({
            by: ['productId'],
            where: {
                transaction: {
                    createdAt: { gte: today, lt: tomorrow },
                    status: 'completed'
                }
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        // Get product details for top products
        const topProductsWithDetails = await Promise.all(
            topProducts.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, name: true, image: true, sellPrice: true }
                });
                return {
                    ...product,
                    totalSold: item._sum.quantity
                };
            })
        );

        // Recent transactions
        const recentTransactions = await prisma.transaction.findMany({
            where: { status: 'completed' },
            include: {
                user: { select: { fullName: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        res.json({
            todaySales,
            todayTransactions: todayCount,
            totalProducts,
            lowStockCount: Number(lowStockCount[0]?.count || 0),
            topProducts: topProductsWithDetails,
            recentTransactions
        });
    } catch (error) {
        next(error);
    }
};

// Get sales chart data
const getSalesChart = async (req, res, next) => {
    try {
        const { period = 'week' } = req.query;

        let startDate = new Date();
        let groupBy = 'day';

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
            groupBy = 'month';
        }

        startDate.setHours(0, 0, 0, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: startDate },
                status: 'completed'
            },
            select: {
                total: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date
        const salesByDate = {};
        transactions.forEach(t => {
            let key;
            if (groupBy === 'month') {
                key = `${t.createdAt.getFullYear()}-${(t.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
            } else {
                key = t.createdAt.toISOString().split('T')[0];
            }

            if (!salesByDate[key]) {
                salesByDate[key] = { date: key, sales: 0, count: 0 };
            }
            salesByDate[key].sales += t.total;
            salesByDate[key].count += 1;
        });

        const chartData = Object.values(salesByDate);

        res.json({ chartData, period });
    } catch (error) {
        next(error);
    }
};

// Get payment method stats
const getPaymentStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await prisma.transaction.groupBy({
            by: ['paymentMethod'],
            where: {
                createdAt: { gte: today },
                status: 'completed'
            },
            _sum: { total: true },
            _count: true
        });

        const paymentStats = stats.map(s => ({
            method: s.paymentMethod,
            total: s._sum.total || 0,
            count: s._count
        }));

        res.json({ paymentStats });
    } catch (error) {
        next(error);
    }
};

// Get category sales
const getCategorySales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = end;
            }
        }

        const items = await prisma.transactionItem.findMany({
            where: {
                transaction: {
                    status: 'completed',
                    ...dateFilter
                }
            },
            include: {
                product: {
                    include: { category: true }
                }
            }
        });

        // Group by category
        const categorySales = {};
        items.forEach(item => {
            const category = item.product.category;
            if (!categorySales[category.id]) {
                categorySales[category.id] = {
                    id: category.id,
                    name: category.name,
                    color: category.color,
                    total: 0,
                    quantity: 0
                };
            }
            categorySales[category.id].total += item.subtotal;
            categorySales[category.id].quantity += item.quantity;
        });

        res.json({ categorySales: Object.values(categorySales) });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getSalesChart,
    getPaymentStats,
    getCategorySales
};
