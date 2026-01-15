const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all categories
const getCategories = async (req, res, next) => {
    try {
        const { search, isActive } = req.query;

        const where = {};

        if (search) {
            where.name = { contains: search };
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ categories });
    } catch (error) {
        next(error);
    }
};

// Get category by ID
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: {
                products: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        sellPrice: true,
                        stock: true
                    }
                },
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ category });
    } catch (error) {
        next(error);
    }
};

// Create category
const createCategory = async (req, res, next) => {
    try {
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
                color: color || '#3B82F6'
            }
        });

        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        next(error);
    }
};

// Update category
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, color, isActive } = req.body;

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(color && { color }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json({ message: 'Category updated successfully', category });
    } catch (error) {
        next(error);
    }
};

// Delete category
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId: parseInt(id) }
        });

        if (productsCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with products. Move or delete products first.'
            });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
