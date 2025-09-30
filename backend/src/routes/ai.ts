import { Router } from 'express';
import { geminiChat, geminiRecommend, geminiGenerateListing, geminiSmartSearch, geminiCompareProducts, testGeminiConnection, listAvailableModels, VendorAIService } from '../services/aiService';
import meshyService from '../services/meshy';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Test endpoint to check Gemini API connection
router.get('/test', async (req, res) => {
  try {
    const isConnected = await testGeminiConnection();
    res.json({ 
      success: isConnected,
      message: isConnected ? 'Gemini API is working' : 'Gemini API connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Test failed',
      error: error.message 
    });
  }
});

// Test endpoint to check Meshy API connection
router.get('/test-meshy', async (req, res) => {
  try {
    const isConnected = await meshyService.testConnection();
    res.json({ 
      success: isConnected.success,
      message: isConnected.success ? 'Meshy API is working' : `Meshy API connection failed: ${isConnected.error}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Meshy test endpoint error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Meshy test failed',
      error: error.message 
    });
  }
});

// List available Gemini models
router.get('/models', async (req, res) => {
  try {
    const result = await listAvailableModels();
    res.json({ 
      success: result.success,
      models: result.models,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('List models endpoint error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to list models',
      error: error.message 
    });
  }
});

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

router.post('/vendor-support', async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    console.log(`Vendor Support API: Received message - "${message}" from user ${userId}`);
    
    // Use intelligent vendor AI service with Gemini
    const vendorAI = VendorAIService.getInstance();
    const vendorResponse = await vendorAI.generateVendorResponse(message, userId, context);
    
    console.log(`Vendor Support API: Intelligent AI response generated successfully (source: ${vendorResponse.metadata.aiSource})`);
    
    res.json({ 
      success: true,
      data: {
        response: vendorResponse.response,
        suggestions: vendorResponse.suggestions,
        metadata: vendorResponse.metadata
      }
    });
  } catch (error) {
    console.error('Vendor support error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Analytics endpoint for vendor AI
router.get('/vendor-analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const vendorAI = VendorAIService.getInstance();
    const analytics = vendorAI.getAnalytics(userId);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Vendor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

// Global analytics endpoint (admin only)
router.get('/vendor-analytics-global', async (req, res) => {
  try {
    const vendorAI = VendorAIService.getInstance();
    const globalAnalytics = vendorAI.getGlobalAnalytics();
    
    res.json({
      success: true,
      data: globalAnalytics
    });
  } catch (error) {
    console.error('Global vendor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get global analytics',
      error: error.message
    });
  }
});

// Feedback endpoint for vendor AI
router.post('/vendor-feedback', async (req, res) => {
  try {
    const { userId, messageId, feedback } = req.body;
    
    if (!userId || !messageId || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'userId, messageId, and feedback are required'
      });
    }

    if (!['like', 'dislike'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must be either "like" or "dislike"'
      });
    }

    const vendorAI = VendorAIService.getInstance();
    vendorAI.recordFeedback(userId, messageId, feedback);
    
    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Vendor feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: error.message
    });
  }
});

// Helper function to generate intelligent vendor responses
function generateIntelligentVendorResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Kinyarwanda language detection
  const kinyarwandaWords = ['muraho', 'bite', 'ni', 'iki', 'nshobora', 'gufasha', 'isitolo', 'ubucuruzi', 'ibicuruzwa', 'amafaranga', 'gucuruza', 'abakiriya', 'gukoresha', 'gutanga', 'gushakisha', 'gusuzuma', 'amahirwe', 'ibyemezo', 'gereranya', 'byihuse', 'byizewe', 'murakoze', 'yego', 'oya', 'sawa', 'byose', 'umeze', 'ute', 'murabe', 'murakoze', 'ndabizi', 'ntabwo', 'yego', 'oya', 'sawa', 'byose', 'byose', 'byose'];
  const isKinyarwanda = kinyarwandaWords.some(word => lowerMessage.includes(word));
  
  // Detect specific topics
  const isSalesQuery = lowerMessage.includes('sales') || lowerMessage.includes('ibyaguzwe') || lowerMessage.includes('amafaranga');
  const isProductQuery = lowerMessage.includes('product') || lowerMessage.includes('ibicuruzwa') || lowerMessage.includes('gucuruza');
  const isMarketingQuery = lowerMessage.includes('marketing') || lowerMessage.includes('ubwoba') || lowerMessage.includes('kwamamaza');
  const isCustomerQuery = lowerMessage.includes('customer') || lowerMessage.includes('abakiriya') || lowerMessage.includes('serivisi');
  const isPerformanceQuery = lowerMessage.includes('performance') || lowerMessage.includes('imikorere') || lowerMessage.includes('gusuzuma');
  
  if (isKinyarwanda) {
    // Handle greetings
    if (lowerMessage.includes('umeze') || lowerMessage.includes('muraho') || lowerMessage.includes('murabe')) {
      return `Muraho! Ndi Umufasha wawe wa AI w'Isitolo. Nimeze neza, murakoze! 

Nshobora gufasha mu gukoresha neza isitolo yawe:

• **Gusuzuma imikorere y'isitolo**: Reba amakuru y'ibyaguzwe, ibitekerezo by'abakiriya
• **Gukoresha neza ibicuruzwa**: Bona amabwiriza y'ibisobanuro byiza, amahitamo y'amafaranga
• **Amahitamo y'ubwoba**: Menya uburyo bwo kwamamaza neza, kwongera abakiriya
• **Serivisi y'abakiriya**: Koresha neza igihe cyo gusubiza, gucunga ibibazo
• **Gutezimbere ubucuruzi**: Shyiraho intego z'ukuri, suzuma iterambere

Ni iki ushaka gufashwa uyu munsi?`;
    }
    
    if (isSalesQuery) {
      return `Muraho! Ndi Umufasha wawe wa AI. Nshobora gufasha mu kwongera ibyaguzwe by'isitolo yawe:

**Amahitamo yo kwongera ibyaguzwe:**
• Koresha neza amashusho y'ibicuruzwa byawe
• Tanga amafaranga meza (discounts) ku bicuruzwa by'ingenzi
• Koresha uburyo bwo kwamamaza ku mbuga nkoranyambaga (WhatsApp, Facebook, Instagram)
• Tanga serivisi nziza y'abakiriya
• Reba amafaranga y'abandi bacuruzi kugira ngo wongere ubwoba

**Icyakora wongere:**
• Tanga amakuru meza y'ibicuruzwa byawe
• Subiza vuba ibibazo by'abakiriya
• Koresha amashusho meza y'ibicuruzwa
• Tanga amafaranga y'ubucuruzi (bulk pricing)

Nshobora gufasha iki cyangwa iki gikurikira?`;
    }
    
    if (isProductQuery) {
      return `Muraho! Ndi Umufasha wawe wa AI. Nshobora gufasha mu gukoresha neza ibicuruzwa byawe:

**Uburyo bwo gukoresha neza ibicuruzwa:**
• Andika ibisobanuro byiza by'ibicuruzwa byawe
• Koresha amashusho meza y'ibicuruzwa
• Shyiraho amafaranga y'ukuri (competitive pricing)
• Tanga amakuru y'ubwoba bw'ibicuruzwa
• Koresha neza ibyiciro by'ibicuruzwa (categories)

**Amabwiriza y'ingenzi:**
• Reba ibicuruzwa by'abandi bacuruzi
• Tanga amafaranga y'ubucuruzi ku bicuruzwa byinshi
• Koresha amashusho y'ibicuruzwa byawe mu buryo bwo kwamamaza
• Subiza vuba ibibazo by'abakiriya

Nshobora gufasha iki cyangwa iki gikurikira?`;
    }
    
    if (isMarketingQuery) {
      return `Muraho! Ndi Umufasha wawe wa AI. Nshobora gufasha mu kwamamaza isitolo yawe:

**Amahitamo y'ubwoba:**
• Koresha WhatsApp, Facebook, Instagram
• Tanga amakuru y'ibicuruzwa byawe ku mbuga nkoranyambaga
• Koresha amashusho meza y'ibicuruzwa
• Tanga amafaranga meza (discounts) ku bicuruzwa by'ingenzi
• Koresha uburyo bwo kwamamaza ku mbuga nkoranyambaga

**Uburyo bwo kwongera abakiriya:**
• Tanga serivisi nziza y'abakiriya
• Subiza vuba ibibazo by'abakiriya
• Tanga amafaranga y'ubucuruzi
• Koresha neza amashusho y'ibicuruzwa

Nshobora gufasha iki cyangwa iki gikurikira?`;
    }
    
    if (isCustomerQuery) {
      return `Muraho! Ndi Umufasha wawe wa AI. Nshobora gufasha mu gukoresha neza serivisi y'abakiriya:

**Serivisi y'abakiriya:**
• Subiza vuba ibibazo by'abakiriya
• Tanga amakuru y'ibicuruzwa byawe
• Koresha neza amashusho y'ibicuruzwa
• Tanga amafaranga y'ubucuruzi
• Koresha neza uburyo bwo kwamamaza

**Uburyo bwo gukomeza abakiriya:**
• Tanga serivisi nziza y'abakiriya
• Subiza vuba ibibazo by'abakiriya
• Tanga amafaranga meza (discounts)
• Koresha neza amashusho y'ibicuruzwa

Nshobora gufasha iki cyangwa iki gikurikira?`;
    }
    
    if (isPerformanceQuery) {
      return `Muraho! Ndi Umufasha wawe wa AI. Nshobora gufasha mu gusuzuma imikorere y'isitolo yawe:

**Gusuzuma imikorere:**
• Reba amakuru y'ibyaguzwe byawe
• Suzuma ibitekerezo by'abakiriya
• Reba amafaranga y'abandi bacuruzi
• Suzuma uburyo bwo kwamamaza
• Reba serivisi y'abakiriya

**Amahitamo yo gukoresha neza:**
• Koresha neza amashusho y'ibicuruzwa
• Tanga amafaranga y'ubucuruzi
• Subiza vuba ibibazo by'abakiriya
• Koresha neza uburyo bwo kwamamaza

Nshobora gufasha iki cyangwa iki gikurikira?`;
    }
    
    // General Kinyarwanda response
    return `Muraho! Ndi Umufasha wawe wa AI w'Isitolo. Nshobora gufasha mu:

• **Gusuzuma imikorere y'isitolo**: Reba amakuru y'ibyaguzwe, ibitekerezo by'abakiriya, no gusuzuma ibintu byo gukoresha neza
• **Gukoresha neza ibicuruzwa**: Bona amabwiriza y'ibisobanuro byiza by'ibicuruzwa, amahitamo y'amafaranga, n'ubucuruzi bw'ibicuruzwa
• **Amahitamo y'ubwoba**: Menya uburyo bwo kwamamaza neza, kwamamaza ku mbuga nkoranyambaga, no kwongera abakiriya
• **Serivisi y'abakiriya**: Koresha neza igihe cyo gusubiza, gucunga ibibazo by'abakiriya, no gukomeza ubucuruzi
• **Gutezimbere ubucuruzi**: Shyiraho intego z'ukuri, suzuma iterambere, no kwiyongera ubucuruzi bwawe

Nyamuneka vuga ibintu ushaka gufashwa, nanjye nzagutanga amabwiriza yihariye y'ubucuruzi bwawe.`;
  }
  
  // English responses for specific topics
  if (isSalesQuery) {
    return `Hello! I'm your AI Store Assistant. I can help you increase your store's sales:

**Sales Growth Strategies:**
• Optimize your product images and descriptions
• Offer competitive pricing and discounts
• Use social media marketing (WhatsApp, Facebook, Instagram)
• Provide excellent customer service
• Analyze competitor pricing

**Key Actions to Take:**
• Write compelling product descriptions
• Respond quickly to customer inquiries
• Use high-quality product photos
• Offer bulk pricing for multiple items

What specific area would you like help with next?`;
  }
  
  if (isProductQuery) {
    return `Hello! I'm your AI Store Assistant. I can help you optimize your products:

**Product Optimization Tips:**
• Write detailed, compelling product descriptions
• Use high-quality product images
• Set competitive prices
• Organize products into clear categories
• Highlight unique selling points

**Best Practices:**
• Research competitor products and pricing
• Offer bundle deals for related items
• Use product images in your marketing
• Respond quickly to customer questions

What would you like to focus on next?`;
  }
  
  if (isMarketingQuery) {
    return `Hello! I'm your AI Store Assistant. I can help you market your store effectively:

**Marketing Strategies:**
• Use social media platforms (WhatsApp, Facebook, Instagram)
• Create engaging product posts
• Offer special discounts and promotions
• Use high-quality product images
• Build customer relationships

**Customer Acquisition:**
• Provide excellent customer service
• Respond quickly to inquiries
• Offer competitive pricing
• Use product images in marketing

What marketing area would you like to explore?`;
  }
  
  if (isCustomerQuery) {
    return `Hello! I'm your AI Store Assistant. I can help you improve customer service:

**Customer Service Excellence:**
• Respond quickly to customer inquiries
• Provide detailed product information
• Use high-quality product images
• Offer competitive pricing
• Be helpful and friendly

**Building Customer Loyalty:**
• Provide excellent service
• Respond promptly to questions
• Offer special discounts
• Use clear product images

What customer service area would you like to improve?`;
  }
  
  if (isPerformanceQuery) {
    return `Hello! I'm your AI Store Assistant. I can help you analyze your store's performance:

**Performance Analysis:**
• Review your sales data and trends
• Analyze customer feedback
• Compare with competitor pricing
• Evaluate marketing effectiveness
• Assess customer service quality

**Optimization Opportunities:**
• Improve product descriptions
• Enhance product images
• Optimize pricing strategy
• Improve response times
• Strengthen marketing efforts

What performance area would you like to focus on?`;
  }
  
  // General English response
  return `Hello! I'm your AI Store Assistant. I can help you with:

• **Store Performance Analysis**: Review your sales data, customer feedback, and identify areas for improvement
• **Product Optimization**: Get suggestions for better product descriptions, pricing strategies, and inventory management
• **Marketing Strategies**: Learn about effective marketing tactics, social media promotion, and customer acquisition
• **Customer Service**: Improve response times, handle complaints better, and build customer loyalty
• **Growth Planning**: Set realistic goals, track progress, and scale your business effectively

Please let me know which area you'd like to focus on, and I'll provide detailed, actionable advice tailored to your business needs.`;
}

// Helper function to generate vendor-specific suggestions
function generateVendorSuggestions(message: string, reply: string): string[] {
  const suggestions: string[] = [];
  
  // Analyze the message and reply to generate relevant suggestions
  const lowerMessage = message.toLowerCase();
  const lowerReply = reply.toLowerCase();
  
  // Kinyarwanda language detection
  const kinyarwandaWords = ['muraho', 'bite', 'ni', 'iki', 'nshobora', 'gufasha', 'isitolo', 'ubucuruzi', 'ibicuruzwa', 'amafaranga', 'gucuruza', 'abakiriya', 'gukoresha', 'gutanga', 'gushakisha', 'gusuzuma', 'amahirwe', 'ibyemezo', 'gereranya', 'byihuse', 'byizewe', 'murakoze', 'yego', 'oya', 'sawa', 'byose', 'umeze', 'ute', 'murabe'];
  const isKinyarwanda = kinyarwandaWords.some(word => lowerMessage.includes(word));
  
  if (isKinyarwanda) {
    // Kinyarwanda suggestions
    if (lowerMessage.includes('ibyaguzwe') || lowerMessage.includes('amafaranga')) {
      suggestions.push('Nerekere amahitamo y\'ubwoba');
      suggestions.push('Suzuma uburyo bwo guhindura abakiriya');
      suggestions.push('Nerekere amahirwe y\'igihe');
    }
    
    if (lowerMessage.includes('ibicuruzwa') || lowerMessage.includes('gucuruza')) {
      suggestions.push('Suzuma ibisobanuro by\'ibicuruzwa');
      suggestions.push('Nerekere amahitamo y\'amafaranga');
      suggestions.push('Gereranya n\'abandi bacuruzi');
    }
    
    if (lowerMessage.includes('abakiriya') || lowerMessage.includes('serivisi')) {
      suggestions.push('Koresha neza uburyo bwo gusubiza');
      suggestions.push('Koresha neza igihe cyo gusubiza');
      suggestions.push('Kora ikiganiro cy\'ibibazo');
    }
    
    if (lowerMessage.includes('isitolo') || lowerMessage.includes('imiterere')) {
      suggestions.push('Koresha neza uburyo bwo gushakisha');
      suggestions.push('Koresha neza ibyiciro by\'ibicuruzwa');
      suggestions.push('Koresha neza amashusho');
    }
    
    // Default Kinyarwanda suggestions
    if (suggestions.length === 0) {
      suggestions.push('Nshobora gute kongera ibyaguzwe?');
      suggestions.push('Suzuma imikorere y\'isitolo yanjye');
      suggestions.push('Nerekere amabwiriza y\'ibicuruzwa');
      suggestions.push('Nfasha mu mahitamo y\'amafaranga');
    }
  } else {
    // English suggestions
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      suggestions.push('Show me specific marketing tactics');
      suggestions.push('Analyze my conversion funnel');
      suggestions.push('Suggest seasonal promotions');
    }
    
    if (lowerMessage.includes('product') || lowerMessage.includes('inventory')) {
      suggestions.push('Review my product descriptions');
      suggestions.push('Suggest pricing strategies');
      suggestions.push('Analyze competitor pricing');
    }
    
    if (lowerMessage.includes('customer') || lowerMessage.includes('service')) {
      suggestions.push('Improve customer communication');
      suggestions.push('Optimize response times');
      suggestions.push('Create FAQ section');
    }
    
    if (lowerMessage.includes('store') || lowerMessage.includes('layout')) {
      suggestions.push('Optimize store navigation');
      suggestions.push('Improve product categories');
      suggestions.push('Enhance visual appeal');
    }
    
    // Default English suggestions
    if (suggestions.length === 0) {
      suggestions.push('How can I increase my sales?');
      suggestions.push('Analyze my store performance');
      suggestions.push('Suggest product improvements');
      suggestions.push('Help with pricing strategy');
    }
  }
  
  return suggestions.slice(0, 4); // Return max 4 suggestions
}

export default router;