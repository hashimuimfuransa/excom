import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Product from '../models/Product';
import { connectDB } from '../config/mongo';
import meshyService from '../services/meshy';

async function testARSystem() {
  try {
    console.log('🚀 Starting AR System Test...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Test 1: Check Meshy API configuration
    console.log('📝 Test 1: Checking Meshy API configuration...');
    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      console.log('❌ MESHY_API_KEY not found in environment variables');
      console.log('💡 Please set MESHY_API_KEY in your .env file');
      return;
    }
    console.log('✅ Meshy API key is configured\n');

    // Test 2: Create test user and product
    console.log('📝 Test 2: Creating test user and product...');
    const seller = await createTestUser('seller@test.com', 'seller', 'Test Seller');
    const product = await createTestProduct(seller._id);
    console.log('✅ Created test user and product\n');

    // Test 3: Test AR generation (if API key is valid)
    console.log('📝 Test 3: Testing AR generation...');
    try {
      const testImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'; // Sample product image
      const fileName = `test_product_${product._id}.glb`;
      
      console.log('🔄 Starting 3D model generation...');
      const result = await meshyService.generateAndUpload3DModel(
        testImageUrl,
        fileName,
        {
          mode: 'preview+texture',
          style: 'realistic'
        }
      );

      if (result.status === 'failed') {
        console.log('❌ AR generation failed:', result.error);
      } else {
        console.log('✅ AR generation started successfully');
        console.log(`📋 Task ID: ${result.taskId}`);
        console.log(`📊 Status: ${result.status}`);
        console.log(`📈 Progress: ${result.progress}%`);
      }
    } catch (error) {
      console.log('❌ AR generation test failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('💡 This might be due to invalid API key or network issues');
    }

    console.log('\n🎉 AR System Test completed!');
    console.log('\n📋 Summary:');
    console.log('- Environment configuration: ✅');
    console.log('- Database connection: ✅');
    console.log('- Test data creation: ✅');
    console.log('- AR generation: Check logs above');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

async function createTestUser(email: string, role: string, name: string) {
  // Clean up existing test user
  await User.deleteOne({ email });
  
  const user = new User({
    email,
    password: 'test123',
    role,
    name,
    isActive: true
  });
  
  return await user.save();
}

async function createTestProduct(sellerId: string) {
  // Clean up existing test products
  await Product.deleteMany({ title: 'Test Product for AR' });
  
  const product = new Product({
    title: 'Test Product for AR',
    description: 'A test product for AR generation testing',
    price: 99.99,
    currency: 'USD',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    seller: sellerId,
    source: 'local',
    modelStatus: 'none'
  });
  
  return await product.save();
}

// Run the test
if (require.main === module) {
  testARSystem().catch(console.error);
}

export default testARSystem;
