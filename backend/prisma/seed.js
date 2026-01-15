const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@pos.com',
            password: adminPassword,
            fullName: 'Administrator',
            role: 'admin'
        }
    });
    console.log('✅ Admin user created:', admin.username);

    // Create cashier user
    const cashierPassword = await bcrypt.hash('kasir123', 10);
    const cashier = await prisma.user.upsert({
        where: { username: 'kasir1' },
        update: {},
        create: {
            username: 'kasir1',
            email: 'kasir1@pos.com',
            password: cashierPassword,
            fullName: 'Kasir Satu',
            role: 'cashier'
        }
    });
    console.log('✅ Cashier user created:', cashier.username);

    // Create categories
    const categories = [
        { name: 'Makanan', description: 'Berbagai jenis makanan', color: '#EF4444' },
        { name: 'Minuman', description: 'Berbagai jenis minuman', color: '#3B82F6' },
        { name: 'Snack', description: 'Makanan ringan', color: '#F59E0B' },
        { name: 'Sembako', description: 'Kebutuhan pokok', color: '#10B981' },
        { name: 'Lainnya', description: 'Produk lainnya', color: '#6B7280' }
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat
        });
    }
    console.log('✅ Categories created');

    // Get category IDs
    const makanan = await prisma.category.findUnique({ where: { name: 'Makanan' } });
    const minuman = await prisma.category.findUnique({ where: { name: 'Minuman' } });
    const snack = await prisma.category.findUnique({ where: { name: 'Snack' } });
    const sembako = await prisma.category.findUnique({ where: { name: 'Sembako' } });

    // Create sample products
    const products = [
        // Makanan
        { name: 'Nasi Goreng', barcode: '8991234567001', categoryId: makanan.id, buyPrice: 12000, sellPrice: 18000, stock: 50, unit: 'porsi' },
        { name: 'Mie Goreng', barcode: '8991234567002', categoryId: makanan.id, buyPrice: 10000, sellPrice: 15000, stock: 50, unit: 'porsi' },
        { name: 'Ayam Goreng', barcode: '8991234567003', categoryId: makanan.id, buyPrice: 15000, sellPrice: 22000, stock: 30, unit: 'porsi' },
        { name: 'Sate Ayam', barcode: '8991234567004', categoryId: makanan.id, buyPrice: 18000, sellPrice: 25000, stock: 25, unit: 'porsi' },

        // Minuman
        { name: 'Es Teh Manis', barcode: '8991234567010', categoryId: minuman.id, buyPrice: 2000, sellPrice: 5000, stock: 100, unit: 'gelas' },
        { name: 'Es Jeruk', barcode: '8991234567011', categoryId: minuman.id, buyPrice: 3000, sellPrice: 7000, stock: 80, unit: 'gelas' },
        { name: 'Kopi Hitam', barcode: '8991234567012', categoryId: minuman.id, buyPrice: 3000, sellPrice: 8000, stock: 60, unit: 'gelas' },
        { name: 'Air Mineral', barcode: '8991234567013', categoryId: minuman.id, buyPrice: 2500, sellPrice: 5000, stock: 200, unit: 'botol' },
        { name: 'Coca Cola', barcode: '8991234567014', categoryId: minuman.id, buyPrice: 5000, sellPrice: 8000, stock: 50, unit: 'botol' },

        // Snack
        { name: 'Kentang Goreng', barcode: '8991234567020', categoryId: snack.id, buyPrice: 8000, sellPrice: 12000, stock: 40, unit: 'porsi' },
        { name: 'Pisang Goreng', barcode: '8991234567021', categoryId: snack.id, buyPrice: 5000, sellPrice: 10000, stock: 30, unit: 'porsi' },
        { name: 'Chitato', barcode: '8991234567022', categoryId: snack.id, buyPrice: 8000, sellPrice: 12000, stock: 50, unit: 'pcs' },
        { name: 'Oreo', barcode: '8991234567023', categoryId: snack.id, buyPrice: 6000, sellPrice: 9000, stock: 40, unit: 'pcs' },

        // Sembako
        { name: 'Beras 5kg', barcode: '8991234567030', categoryId: sembako.id, buyPrice: 55000, sellPrice: 65000, stock: 20, unit: 'karung' },
        { name: 'Gula 1kg', barcode: '8991234567031', categoryId: sembako.id, buyPrice: 12000, sellPrice: 15000, stock: 30, unit: 'pcs' },
        { name: 'Minyak Goreng 1L', barcode: '8991234567032', categoryId: sembako.id, buyPrice: 14000, sellPrice: 18000, stock: 25, unit: 'botol' },
        { name: 'Telur 1kg', barcode: '8991234567033', categoryId: sembako.id, buyPrice: 22000, sellPrice: 28000, stock: 15, unit: 'kg' },

        // Low stock items for testing
        { name: 'Kecap Manis', barcode: '8991234567034', categoryId: sembako.id, buyPrice: 8000, sellPrice: 12000, stock: 3, minStock: 5, unit: 'botol' },
        { name: 'Sambal Botol', barcode: '8991234567035', categoryId: sembako.id, buyPrice: 10000, sellPrice: 15000, stock: 2, minStock: 5, unit: 'botol' }
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { barcode: product.barcode },
            update: {},
            create: product
        });
    }
    console.log('✅ Products created');

    // Create some sample transactions
    const productsList = await prisma.product.findMany({ take: 5 });

    const transaction = await prisma.transaction.create({
        data: {
            invoiceNo: 'INV2401140001',
            userId: admin.id,
            subtotal: 50000,
            discountPercent: 0,
            discountAmount: 0,
            taxPercent: 0,
            taxAmount: 0,
            total: 50000,
            paidAmount: 50000,
            changeAmount: 0,
            paymentMethod: 'cash',
            status: 'completed',
            items: {
                create: [
                    {
                        productId: productsList[0].id,
                        productName: productsList[0].name,
                        quantity: 2,
                        price: productsList[0].sellPrice,
                        discount: 0,
                        subtotal: productsList[0].sellPrice * 2
                    },
                    {
                        productId: productsList[4].id,
                        productName: productsList[4].name,
                        quantity: 1,
                        price: productsList[4].sellPrice,
                        discount: 0,
                        subtotal: productsList[4].sellPrice
                    }
                ]
            }
        }
    });
    console.log('✅ Sample transaction created:', transaction.invoiceNo);

    // Create settings
    await prisma.setting.upsert({
        where: { key: 'store_name' },
        update: {},
        create: { key: 'store_name', value: 'POS System' }
    });
    await prisma.setting.upsert({
        where: { key: 'store_address' },
        update: {},
        create: { key: 'store_address', value: 'Jl. Contoh No. 123' }
    });
    await prisma.setting.upsert({
        where: { key: 'store_phone' },
        update: {},
        create: { key: 'store_phone', value: '021-1234567' }
    });
    await prisma.setting.upsert({
        where: { key: 'tax_percentage' },
        update: {},
        create: { key: 'tax_percentage', value: '0' }
    });
    console.log('✅ Settings created');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📌 Login credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Kasir: kasir1 / kasir123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
