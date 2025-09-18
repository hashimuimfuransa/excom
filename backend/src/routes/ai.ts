import { Router } from 'express';
import { geminiChat, geminiRecommend, geminiGenerateListing, geminiSmartSearch, geminiCompareProducts } from '../services/gemini';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`AI Chat API: Received message - "${message}"`);
    const reply = await geminiChat(message, context);
    
    // Try to extract product IDs from the response if it contains product recommendations
    const productIdRegex = /ID:\s*([a-fA-F0-9]{24})/g;
    const productIds: string[] = [];
    let match;
    
    while ((match = productIdRegex.exec(reply)) !== null) {
      productIds.push(match[1]);
    }
    
    console.log(`AI Chat API: Found ${productIds.length} product IDs in response`);
    
    // If we found product IDs, fetch the full product data
    let recommendedProducts = [];
    if (productIds.length > 0) {
      try {
        const Product = require('../models/Product').default;
        recommendedProducts = await Product.find({
          _id: { $in: productIds }
        }).populate('seller', 'name').limit(6);
        
        console.log(`AI Chat API: Retrieved ${recommendedProducts.length} full products`);
      } catch (error) {
        console.error('Error fetching recommended products:', error);
      }
    }
    
    res.json({ 
      reply,
      recommendedProducts: recommendedProducts.map(p => p.toObject()),
      hasProductRecommendations: productIds.length > 0
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query, userId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`AI Search Request - Query: "${query}", User ID: ${userId || 'Anonymous'}`);
    const results = await geminiSmartSearch(query, userId);
    
    // Convert AI recommendations to full product objects
    if (results.recommendations && results.recommendations.length > 0) {
      const Product = require('../models/Product').default;
      
      const productIds = results.recommendations.map((rec: any) => rec.productId);
      console.log(`Fetching full product data for IDs: ${productIds.join(', ')}`);
      
      const fullProducts = await Product.find({
        _id: { $in: productIds }
      }).populate('seller', 'name email').populate('store', 'name');
      
      // Map products to maintain AI recommendation order and include AI metadata
      const productsWithAIData = results.recommendations.map((rec: any) => {
        const product = fullProducts.find((p: any) => p._id.toString() === rec.productId);
        if (product) {
          return {
            ...product.toObject(),
            aiRelevanceScore: rec.relevanceScore,
            aiReason: rec.reason,
            recommendationType: rec.recommendationType || 'smart-search',
            confidenceLevel: rec.confidenceLevel || 'high'
          };
        }
        return null;
      }).filter(Boolean);
      
      console.log(`AI Search: Returning ${productsWithAIData.length} products with full data`);
      
      // Return the response with products as the main data
      res.json({
        ...results,
        products: productsWithAIData, // Add full product objects
        recommendations: results.recommendations // Keep original recommendations for reference
      });
    } else {
      console.log('AI Search: No recommendations found');
      res.json({
        ...results,
        products: []
      });
    }
  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recommend', async (req, res) => {
  try {
    const { userId } = req.body;
    const recommendations = await geminiRecommend(userId);
    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 product IDs are required for comparison' });
    }

    const comparison = await geminiCompareProducts(productIds);
    res.json(comparison);
  } catch (error) {
    console.error('Compare products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate-listing', async (req, res) => {
  try {
    const { imageBase64, text } = req.body;
    const listing = await geminiGenerateListing({ imageBase64, text });
    res.json(listing);
  } catch (error) {
    console.error('Generate listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;