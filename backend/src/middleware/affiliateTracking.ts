import { Request, Response, NextFunction } from 'express';
import Affiliate from '../models/Affiliate';
import AffiliateClick from '../models/AffiliateClick';
import AffiliateCommission from '../models/AffiliateCommission';
import AffiliateProgram from '../models/AffiliateProgram';
import Order from '../models/Order';
import Product from '../models/Product';

// Generate unique visitor ID
function generateVisitorId(): string {
  return 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Extract affiliate code from URL parameters
export function extractAffiliateCode(req: Request): string | null {
  const affiliateCode = req.query.ref as string;
  return affiliateCode || null;
}

// Track affiliate click
export async function trackAffiliateClick(
  affiliateCode: string,
  targetUrl: string,
  req: Request
): Promise<void> {
  try {
    // Find affiliate by referral code
    const affiliate = await Affiliate.findOne({ 
      referralCode: affiliateCode, 
      status: 'approved' 
    });
    
    if (!affiliate) return;

    // Get visitor ID from session or generate new one
    let visitorId = req.session?.visitorId;
    if (!visitorId) {
      visitorId = generateVisitorId();
      if (req.session) {
        req.session.visitorId = visitorId;
      }
    }

    // Create click record
    await AffiliateClick.create({
      affiliate: affiliate._id,
      vendor: affiliate.vendor,
      visitorId,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      referrer: req.get('Referer') || '',
      clickedUrl: req.get('Referer') || '',
      targetUrl,
      linkType: 'general'
    });

    // Update affiliate click count
    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { totalClicks: 1 }
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

// Process affiliate commission when order is completed
export async function processAffiliateCommission(orderId: string): Promise<void> {
  try {
    const order = await Order.findById(orderId)
      .populate('items.product')
      .populate('buyer');

    if (!order || !order.affiliateId || order.status !== 'completed') {
      return;
    }

    const affiliate = await Affiliate.findById(order.affiliateId);
    if (!affiliate || affiliate.status !== 'approved') {
      return;
    }

    const program = await AffiliateProgram.findOne({ vendor: affiliate.vendor });
    if (!program || !program.isActive) {
      return;
    }

    // Process commission for each order item
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // Calculate commission based on program rules
      let commissionRate = affiliate.commissionRate;
      let commissionType = affiliate.commissionType;
      let fixedAmount = affiliate.fixedCommissionAmount;

      // Check for category-specific commission rules
      const categoryRule = program.commissionRules.productCategories.find(
        rule => rule.category === product.category
      );
      
      if (categoryRule) {
        commissionRate = categoryRule.commissionRate;
        commissionType = categoryRule.commissionType;
        fixedAmount = categoryRule.fixedAmount;
      }

      // Calculate commission amount
      let commissionAmount = 0;
      if (commissionType === 'percentage') {
        commissionAmount = (item.price * item.quantity) * (commissionRate / 100);
      } else if (commissionType === 'fixed' && fixedAmount) {
        commissionAmount = fixedAmount;
      }

      // Calculate fees
      const platformFee = commissionAmount * (program.payoutSettings.processingFee / 100);
      const vendorFee = commissionAmount * (program.payoutSettings.vendorFee / 100);
      const netCommission = commissionAmount - platformFee - vendorFee;

      // Create commission record
      await AffiliateCommission.create({
        affiliate: affiliate._id,
        vendor: affiliate.vendor,
        order: order._id,
        orderItem: item._id,
        product: item.product,
        orderAmount: item.price * item.quantity,
        commissionRate,
        commissionType,
        commissionAmount,
        platformFee,
        vendorFee,
        netCommission,
        status: 'pending'
      });

      // Update affiliate earnings
      await Affiliate.findByIdAndUpdate(affiliate._id, {
        $inc: { 
          totalConversions: 1,
          totalEarnings: commissionAmount,
          pendingEarnings: netCommission
        }
      });

      // Update click conversion status
      await AffiliateClick.updateMany(
        { 
          affiliate: affiliate._id,
          visitorId: order.buyer._id.toString(),
          converted: false
        },
        { 
          converted: true,
          conversionDate: new Date(),
          orderId: order._id
        }
      );
    }
  } catch (error) {
    console.error('Error processing affiliate commission:', error);
  }
}

// Middleware to track affiliate clicks
export function affiliateTrackingMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const affiliateCode = extractAffiliateCode(req);
      
      if (affiliateCode) {
        // Store affiliate code in session for later use
        if (req.session) {
          req.session.affiliateCode = affiliateCode;
        }
        
        // Track the click
        await trackAffiliateClick(affiliateCode, req.originalUrl, req);
      }
      
      next();
    } catch (error) {
      console.error('Affiliate tracking middleware error:', error);
      next(); // Continue even if tracking fails
    }
  };
}
