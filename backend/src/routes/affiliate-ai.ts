import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Affiliate from '../models/Affiliate';
import Product from '../models/Product';
import AffiliateClick from '../models/AffiliateClick';
import { generateProductRecommendations } from '../services/gemini';

const router = Router();

// Get AI-powered product recommendations for affiliate
router.get('/recommendations/:affiliateId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { affiliateId } = req.params;
    const { limit = 10 } = req.query;

    // Verify affiliate exists and is approved
    const affiliate = await Affiliate.findById(affiliateId).populate('vendor', 'name');
    if (!affiliate || affiliate.status !== 'approved') {
      return res.status(404).json({ message: 'Affiliate not found or not approved' });
    }

    // Get affiliate's click history to understand preferences
    const clickHistory = await AffiliateClick.find({ affiliate: affiliateId })
      .populate('product', 'title category')
      .sort({ createdAt: -1 })
      .limit(50);

    // Get products from the vendor
    const vendorProducts = await Product.find({ seller: affiliate.vendor })
      .limit(100);

    // Generate AI recommendations
    const recommendations = await generateProductRecommendations(
      clickHistory,
      vendorProducts,
      Number(limit)
    );

    res.json({
      affiliate: {
        _id: affiliate._id,
        referralCode: affiliate.referralCode,
        vendor: affiliate.vendor
      },
      recommendations
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
});

// Generate social media content for affiliate
router.post('/social-content', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId, platform, affiliateCode, customMessage } = req.body;

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get affiliate details
    const affiliate = await Affiliate.findOne({ referralCode: affiliateCode });
    if (!affiliate || affiliate.status !== 'approved') {
      return res.status(404).json({ message: 'Invalid affiliate code' });
    }

    // Generate affiliate URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const affiliateUrl = `${baseUrl}/product/${product._id}?ref=${affiliateCode}`;

    // Generate platform-specific content
    const content = await generateSocialContent(product, platform, affiliateUrl, customMessage);

    res.json({
      product: {
        _id: product._id,
        title: product.title,
        price: product.price,
        images: product.images
      },
      affiliateUrl,
      content
    });
  } catch (error) {
    console.error('Error generating social content:', error);
    res.status(500).json({ message: 'Failed to generate social content' });
  }
});

// Generate social media content using AI
async function generateSocialContent(product: any, platform: string, affiliateUrl: string, customMessage?: string) {
  const prompts = {
    instagram: `Create an engaging Instagram post for this product: ${product.title}. Price: $${product.price}. Include hashtags and emojis. Keep it under 2200 characters.`,
    tiktok: `Create a TikTok video script for this product: ${product.title}. Price: $${product.price}. Make it engaging and trendy. Include call-to-action.`,
    facebook: `Create a Facebook post for this product: ${product.title}. Price: $${product.price}. Make it informative and engaging. Include call-to-action.`,
    twitter: `Create a Twitter post for this product: ${product.title}. Price: $${product.price}. Keep it under 280 characters. Include hashtags.`,
    youtube: `Create a YouTube video description for this product: ${product.title}. Price: $${product.price}. Include timestamps and call-to-action.`
  };

  const prompt = prompts[platform as keyof typeof prompts] || prompts.instagram;
  
  try {
    const response = await generateProductRecommendations([], [product], 1);
    return {
      text: customMessage || `Check out this amazing ${product.title} for just $${product.price}! 🔥\n\n${affiliateUrl}\n\n#shopping #deals #affiliate`,
      hashtags: ['#shopping', '#deals', '#affiliate', '#product'],
      callToAction: 'Shop now using my link!',
      platform: platform
    };
  } catch (error) {
    console.error('Error generating AI content:', error);
    return {
      text: customMessage || `Check out this amazing ${product.title} for just $${product.price}! 🔥\n\n${affiliateUrl}`,
      hashtags: ['#shopping', '#deals', '#affiliate'],
      callToAction: 'Shop now using my link!',
      platform: platform
    };
  }
}

export default router;
