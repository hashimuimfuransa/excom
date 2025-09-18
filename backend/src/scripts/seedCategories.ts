// Script to seed categories into the database
import mongoose from 'mongoose';
import Category from '../models/Category';
import { connectDB } from '../config/mongo';

const categories = [
  { 
    name: 'Electronics', 
    icon: 'Computer', 
    color: '#2196F3', 
    bgColor: 'rgba(33, 150, 243, 0.1)',
    slug: 'electronics',
    count: 542,
    badge: '🔥 Hot',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop&crop=center',
    sortOrder: 1
  },
  { 
    name: 'Fashion', 
    icon: 'Person', 
    color: '#E91E63', 
    bgColor: 'rgba(233, 30, 99, 0.1)',
    slug: 'fashion',
    count: 387,
    badge: '✨ Trending',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    sortOrder: 2
  },
  { 
    name: 'Gaming', 
    icon: 'Star', 
    color: '#9C27B0', 
    bgColor: 'rgba(156, 39, 176, 0.1)',
    slug: 'gaming',
    count: 678,
    badge: '🎮 Epic',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    sortOrder: 3
  },
  { 
    name: 'Mobile & Tech', 
    icon: 'Phone', 
    color: '#FF5722', 
    bgColor: 'rgba(255, 87, 34, 0.1)',
    slug: 'mobile',
    count: 445,
    badge: '📱 Smart',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center',
    sortOrder: 4
  },
  { 
    name: 'Home & Garden', 
    icon: 'Home', 
    color: '#4CAF50', 
    bgColor: 'rgba(76, 175, 80, 0.1)',
    slug: 'home',
    count: 298,
    badge: '🏡 Cozy',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
    sortOrder: 5
  },
  { 
    name: 'Sports & Fitness', 
    icon: 'Sports', 
    color: '#FF9800', 
    bgColor: 'rgba(255, 152, 0, 0.1)',
    slug: 'sports',
    count: 234,
    badge: '⚡ Active',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
    sortOrder: 6
  },
  { 
    name: 'Books & Media', 
    icon: 'Book', 
    color: '#795548', 
    bgColor: 'rgba(121, 85, 72, 0.1)',
    slug: 'books',
    count: 189,
    badge: '📚 Wisdom',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
    sortOrder: 7
  },
  { 
    name: 'Beauty & Care', 
    icon: 'Person', 
    color: '#E91E63', 
    bgColor: 'rgba(233, 30, 99, 0.1)',
    slug: 'beauty',
    count: 312,
    badge: '💄 Glam',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop&crop=center',
    sortOrder: 8
  },
  { 
    name: 'Music & Audio', 
    icon: 'MusicNote', 
    color: '#9C27B0', 
    bgColor: 'rgba(156, 39, 176, 0.1)',
    slug: 'audio',
    count: 167,
    badge: '🎵 Sound',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center',
    sortOrder: 9
  },
  { 
    name: 'Computers', 
    icon: 'Computer', 
    color: '#607D8B', 
    bgColor: 'rgba(96, 125, 139, 0.1)',
    slug: 'computers',
    count: 89,
    badge: '💻 Tech',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&h=300&fit=crop&crop=center',
    sortOrder: 10
  },
  { 
    name: 'Kitchen & Dining', 
    icon: 'Home', 
    color: '#FF5722', 
    bgColor: 'rgba(255, 87, 34, 0.1)',
    slug: 'kitchen',
    count: 203,
    badge: '🍳 Chef',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center',
    sortOrder: 11
  },
  { 
    name: 'Pets & Animals', 
    icon: 'Favorite', 
    color: '#8BC34A', 
    bgColor: 'rgba(139, 195, 74, 0.1)',
    slug: 'pets',
    count: 134,
    badge: '🐕 Cute',
    image: 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=300&fit=crop&crop=center',
    sortOrder: 12
  },
  { 
    name: 'Toys & Games', 
    icon: 'Star', 
    color: '#F44336', 
    bgColor: 'rgba(244, 67, 54, 0.1)',
    slug: 'toys',
    count: 156,
    badge: '🎮 Fun',
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop&crop=center',
    sortOrder: 13
  },
  { 
    name: 'Automotive', 
    icon: 'DirectionsCar', 
    color: '#607D8B', 
    bgColor: 'rgba(96, 125, 139, 0.1)',
    slug: 'automotive',
    count: 143,
    badge: '🚗 Drive',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop&crop=center',
    sortOrder: 14
  },
  { 
    name: 'Health & Wellness', 
    icon: 'LocalHospital', 
    color: '#00BCD4', 
    bgColor: 'rgba(0, 188, 212, 0.1)',
    slug: 'health',
    count: 172,
    badge: '💊 Wellness',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center',
    sortOrder: 15
  },
  { 
    name: 'Food & Beverages', 
    icon: 'Restaurant', 
    color: '#8BC34A', 
    bgColor: 'rgba(139, 195, 74, 0.1)',
    slug: 'food',
    count: 267,
    badge: '🍔 Tasty',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&crop=center',
    sortOrder: 16
  },
  { 
    name: 'Arts & Crafts', 
    icon: 'Palette', 
    color: '#9C27B0', 
    bgColor: 'rgba(156, 39, 176, 0.1)',
    slug: 'arts',
    count: 95,
    badge: '🎨 Creative',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center',
    sortOrder: 17
  },
  { 
    name: 'Fitness Equipment', 
    icon: 'Sports', 
    color: '#FF9800', 
    bgColor: 'rgba(255, 152, 0, 0.1)',
    slug: 'fitness',
    count: 178,
    badge: '💪 Strong',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&crop=center',
    sortOrder: 18
  },
  { 
    name: 'Education & Learning', 
    icon: 'School', 
    color: '#3F51B5', 
    bgColor: 'rgba(63, 81, 181, 0.1)',
    slug: 'education',
    count: 124,
    badge: '🎓 Learn',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
    sortOrder: 19
  },
  { 
    name: 'Business & Office', 
    icon: 'Work', 
    color: '#424242', 
    bgColor: 'rgba(66, 66, 66, 0.1)',
    slug: 'business',
    count: 89,
    badge: '💼 Pro',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center',
    sortOrder: 20
  },
  { 
    name: 'Travel & Luggage', 
    icon: 'Flight', 
    color: '#00BCD4', 
    bgColor: 'rgba(0, 188, 212, 0.1)',
    slug: 'travel',
    count: 212,
    badge: '✈️ Journey',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=center',
    sortOrder: 21
  },
  { 
    name: 'Groceries', 
    icon: 'ShoppingCart', 
    color: '#4CAF50', 
    bgColor: 'rgba(76, 175, 80, 0.1)',
    slug: 'groceries',
    count: 456,
    badge: '🥕 Fresh',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center',
    sortOrder: 22
  },
  { 
    name: 'Watches & Accessories', 
    icon: 'AccessTime', 
    color: '#795548', 
    bgColor: 'rgba(121, 85, 72, 0.1)',
    slug: 'watches',
    count: 78,
    badge: '⌚ Time',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&crop=center',
    sortOrder: 23
  },
  { 
    name: 'Photography', 
    icon: 'Camera', 
    color: '#FF5722', 
    bgColor: 'rgba(255, 87, 34, 0.1)',
    slug: 'photography',
    count: 143,
    badge: '📷 Capture',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop&crop=center',
    sortOrder: 24
  },
  { 
    name: 'Outdoor & Camping', 
    icon: 'Star', 
    color: '#8BC34A', 
    bgColor: 'rgba(139, 195, 74, 0.1)',
    slug: 'outdoor',
    count: 189,
    badge: '🏕️ Wild',
    image: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=400&h=300&fit=crop&crop=center',
    sortOrder: 25
  },
  { 
    name: 'Baby & Kids', 
    icon: 'Person', 
    color: '#E91E63', 
    bgColor: 'rgba(233, 30, 99, 0.1)',
    slug: 'baby',
    count: 267,
    badge: '👶 Care',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop&crop=center',
    sortOrder: 26
  },
  { 
    name: 'E-Sports', 
    icon: 'Sports', 
    color: '#9C27B0', 
    bgColor: 'rgba(156, 39, 176, 0.1)',
    slug: 'esports',
    count: 89,
    badge: '🏆 Pro',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop&crop=center',
    sortOrder: 27
  },
  { 
    name: 'Jewelry & Watches', 
    icon: 'Star', 
    color: '#FFD700', 
    bgColor: 'rgba(255, 215, 0, 0.1)',
    slug: 'jewelry',
    count: 156,
    badge: '⭐ Luxury',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop&crop=center',
    sortOrder: 28
  },
  { 
    name: 'Movies & Entertainment', 
    icon: 'Star', 
    color: '#FF5722', 
    bgColor: 'rgba(255, 87, 34, 0.1)',
    slug: 'movies',
    count: 234,
    badge: '🎬 Action',
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop&crop=center',
    sortOrder: 29
  },
  { 
    name: 'Wellness & Spa', 
    icon: 'Favorite', 
    color: '#00BCD4', 
    bgColor: 'rgba(0, 188, 212, 0.1)',
    slug: 'wellness',
    count: 98,
    badge: '🧘 Zen',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&crop=center',
    sortOrder: 30
  },
  { 
    name: 'Bikes & Cycling', 
    icon: 'DirectionsCar', 
    color: '#4CAF50', 
    bgColor: 'rgba(76, 175, 80, 0.1)',
    slug: 'bikes',
    count: 67,
    badge: '🚴 Ride',
    image: 'https://images.unsplash.com/photo-1544191696-15693a5d87b4?w=400&h=300&fit=crop&crop=center',
    sortOrder: 31
  },
  { 
    name: 'Swimming & Water Sports', 
    icon: 'Star', 
    color: '#2196F3', 
    bgColor: 'rgba(33, 150, 243, 0.1)',
    slug: 'swimming',
    count: 145,
    badge: '🏊 Splash',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop&crop=center',
    sortOrder: 32
  },
  { 
    name: 'Gardening & Plants', 
    icon: 'Star', 
    color: '#4CAF50', 
    bgColor: 'rgba(76, 175, 80, 0.1)',
    slug: 'gardening',
    count: 189,
    badge: '🌱 Grow',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center',
    sortOrder: 33
  },
  { 
    name: 'Tools & Hardware', 
    icon: 'Build', 
    color: '#FF9800', 
    bgColor: 'rgba(255, 152, 0, 0.1)',
    slug: 'tools',
    count: 123,
    badge: '🔧 Build',
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=300&fit=crop&crop=center',
    sortOrder: 34
  }
];

async function seedCategories() {
  try {
    await connectDB();
    
    console.log('Connected to database');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);
    
    mongoose.connection.close();
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCategories();
}

export default seedCategories;