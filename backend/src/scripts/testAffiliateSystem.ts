import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Affiliate from '../models/Affiliate';
import AffiliateProgram from '../models/AffiliateProgram';
import AffiliateClick from '../models/AffiliateClick';
import AffiliateCommission from '../models/AffiliateCommission';
import Order from '../models/Order';
import Product from '../models/Product';
import { connectDB } from '../config/mongo';

async function testAffiliateSystem() {
  try {
    console.log('🚀 Starting Affiliate System Test...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Clean up existing test data
    await cleanupTestData();
    console.log('🧹 Cleaned up existing test data\n');

    // Test 1: Create test users
    console.log('📝 Test 1: Creating test users...');
    const vendor = await createTestUser('vendor@test.com', 'seller', 'Test Vendor');
    const affiliate = await createTestUser('affiliate@test.com', 'affiliate', 'Test Affiliate');
    const buyer = await createTestUser('buyer@test.com', 'buyer', 'Test Buyer');
    console.log('✅ Created test users\n');

    // Test 2: Create affiliate program
    console.log('📝 Test 2: Creating affiliate program...');
    const program = await createAffiliateProgram(vendor._id);
    console.log('✅ Created affiliate program\n');

    // Test 3: Create affiliate relationship
    console.log('📝 Test 3: Creating affiliate relationship...');
    const affiliateRecord = await createAffiliate(affiliate._id, vendor._id, program);
    console.log('✅ Created affiliate relationship\n');

    // Test 4: Create test product
    console.log('📝 Test 4: Creating test product...');
    const product = await createTestProduct(vendor._id);
    console.log('✅ Created test product\n');

    // Test 5: Simulate affiliate clicks
    console.log('📝 Test 5: Simulating affiliate clicks...');
    await simulateAffiliateClicks(affiliateRecord._id, vendor._id, product._id);
    console.log('✅ Simulated affiliate clicks\n');

    // Test 6: Create order with affiliate tracking
    console.log('📝 Test 6: Creating order with affiliate tracking...');
    const order = await createOrderWithAffiliate(buyer._id, product._id, affiliateRecord.referralCode);
    console.log('✅ Created order with affiliate tracking\n');

    // Test 7: Process commission
    console.log('📝 Test 7: Processing commission...');
    await processCommission(order._id);
    console.log('✅ Processed commission\n');

    // Test 8: Verify results
    console.log('📝 Test 8: Verifying results...');
    await verifyResults(affiliateRecord._id, vendor._id);
    console.log('✅ Verified results\n');

    console.log('🎉 All tests passed! Affiliate system is working correctly.\n');

    // Display final results
    await displayFinalResults();

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

async function cleanupTestData() {
  await User.deleteMany({ email: { $regex: /@test\.com$/ } });
  await Affiliate.deleteMany({});
  await AffiliateProgram.deleteMany({});
  await AffiliateClick.deleteMany({});
  await AffiliateCommission.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({ title: 'Test Product' });
}

async function createTestUser(email: string, role: string, name: string) {
  const user = new User({
    name,
    email,
    role,
    passwordHash: 'test_hash'
  });
  return await user.save();
}

async function createAffiliateProgram(vendorId: string) {
  const program = new AffiliateProgram({
    vendor: vendorId,
    isActive: true,
    globalSettings: {
      enabled: true,
      defaultCommissionRate: 5,
      defaultCommissionType: 'percentage',
      minPayoutAmount: 50,
      autoApproveAffiliates: true
    },
    payoutSettings: {
      processingFee: 3,
      vendorFee: 0
    }
  });
  return await program.save();
}

async function createAffiliate(userId: string, vendorId: string, program: any) {
  const affiliate = new Affiliate({
    user: userId,
    vendor: vendorId,
    status: 'approved',
    commissionRate: program.globalSettings.defaultCommissionRate,
    commissionType: program.globalSettings.defaultCommissionType,
    referralCode: 'TEST123',
    approvalDate: new Date()
  });
  return await affiliate.save();
}

async function createTestProduct(vendorId: string) {
  const product = new Product({
    title: 'Test Product',
    description: 'A test product for affiliate testing',
    price: 100,
    currency: 'USD',
    seller: vendorId,
    category: 'Electronics',
    images: ['test-image.jpg']
  });
  return await product.save();
}

async function simulateAffiliateClicks(affiliateId: string, vendorId: string, productId: string) {
  const clicks = [];
  for (let i = 0; i < 10; i++) {
    const click = new AffiliateClick({
      affiliate: affiliateId,
      vendor: vendorId,
      visitorId: `visitor_${i}`,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      clickedUrl: 'http://test.com',
      targetUrl: `/product/${productId}`,
      linkType: 'product',
      targetId: productId
    });
    clicks.push(click.save());
  }
  await Promise.all(clicks);
}

async function createOrderWithAffiliate(buyerId: string, productId: string, affiliateCode: string) {
  const order = new Order({
    buyer: buyerId,
    items: [{
      product: productId,
      quantity: 1,
      price: 100,
      vendor: buyerId
    }],
    total: 100,
    currency: 'USD',
    status: 'completed',
    affiliateCode,
    referralSource: 'affiliate_link'
  });
  return await order.save();
}

async function processCommission(orderId: string) {
  const order = await Order.findById(orderId).populate('items.product');
  if (!order || !order.affiliateCode) return;

  const affiliate = await Affiliate.findOne({ referralCode: order.affiliateCode });
  if (!affiliate) return;

  const program = await AffiliateProgram.findOne({ vendor: affiliate.vendor });
  if (!program) return;

  for (const item of order.items) {
    const commissionAmount = item.price * item.quantity * (affiliate.commissionRate / 100);
    const platformFee = commissionAmount * (program.payoutSettings.processingFee / 100);
    const netCommission = commissionAmount - platformFee;

    const commission = new AffiliateCommission({
      affiliate: affiliate._id,
      vendor: affiliate.vendor,
      order: order._id,
      orderItem: item._id,
      product: item.product._id,
      orderAmount: item.price * item.quantity,
      commissionRate: affiliate.commissionRate,
      commissionType: affiliate.commissionType,
      commissionAmount,
      platformFee,
      netCommission,
      status: 'approved',
      approvedDate: new Date()
    });
    await commission.save();

    // Update affiliate stats
    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: {
        totalConversions: 1,
        totalEarnings: commissionAmount,
        pendingEarnings: netCommission
      }
    });
  }
}

async function verifyResults(affiliateId: string, vendorId: string) {
  const affiliate = await Affiliate.findById(affiliateId);
  const commissions = await AffiliateCommission.find({ affiliate: affiliateId });
  const clicks = await AffiliateClick.find({ affiliate: affiliateId });

  console.log('📊 Verification Results:');
  console.log(`   - Affiliate clicks: ${clicks.length}`);
  console.log(`   - Affiliate conversions: ${affiliate?.totalConversions}`);
  console.log(`   - Total earnings: $${affiliate?.totalEarnings}`);
  console.log(`   - Pending earnings: $${affiliate?.pendingEarnings}`);
  console.log(`   - Commission records: ${commissions.length}`);
}

async function displayFinalResults() {
  const totalAffiliates = await Affiliate.countDocuments();
  const totalClicks = await AffiliateClick.countDocuments();
  const totalCommissions = await AffiliateCommission.countDocuments();
  const totalEarnings = await AffiliateCommission.aggregate([
    { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
  ]);

  console.log('📈 Final System Statistics:');
  console.log(`   - Total affiliates: ${totalAffiliates}`);
  console.log(`   - Total clicks: ${totalClicks}`);
  console.log(`   - Total commissions: ${totalCommissions}`);
  console.log(`   - Total earnings: $${totalEarnings[0]?.total || 0}`);
}

// Run the test
if (require.main === module) {
  testAffiliateSystem().catch(console.error);
}

export default testAffiliateSystem;
