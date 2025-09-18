import { Request, Response } from 'express';
import Category from '../models/Category';
import Product from '../models/Product';

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    // Update product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category.slug,
          status: 'active' 
        });
        
        // Update the count in database if it's different
        if (category.count !== productCount) {
          await Category.updateOne(
            { _id: category._id },
            { count: productCount }
          );
        }

        return {
          ...category.toObject(),
          count: productCount
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};

// Get category by slug
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ slug, isActive: true });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({ 
      category: slug,
      status: 'active' 
    });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        count: productCount
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
};

// Create category (admin only)
export const createCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    
    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: categoryData.slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
};

// Update category (admin only)
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
};

// Delete category (admin only)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }

    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
};

// Bulk create categories (for initial setup)
export const bulkCreateCategories = async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;

    // Clear existing categories (only for initial setup)
    await Category.deleteMany({});

    const createdCategories = await Category.insertMany(categories);

    res.status(201).json({
      success: true,
      data: createdCategories,
      message: `${createdCategories.length} categories created successfully`
    });
  } catch (error) {
    console.error('Error bulk creating categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating categories'
    });
  }
};