import axios from 'axios';
import Product from '../models/Product';
import User from '../models/User';
import Order from '../models/Order';

// Get API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required in environment variables');
}

// Direct v1 API configuration
const GEMINI_V1_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

export interface AIResponse {
  response: string;
  suggestions?: string[];
  metadata?: {
    aiSource: string;
    timestamp: string;
    model: string;
  };
}

export interface ProductRecommendation {
  productId: string;
  title: string;
  price: number;
  category: string;
  relevanceScore: number;
  reason: string;
  recommendationType: string;
  confidenceLevel: string;
}

export interface SearchResults {
  query: string;
  recommendations: ProductRecommendation[];
  totalResults: number;
  searchTime: number;
  userContext?: any;
}

class AIService {
  private static instance: AIService;
  private conversationMemory: Map<string, any[]> = new Map();
  private requestQueue: Array<{ resolve: Function; reject: Function; request: any }> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly REQUEST_DELAY = 1000; // 1 second between requests

  private constructor() {
    // Direct v1 API implementation
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Rate limiting helper
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, request: requestFn });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { resolve, reject, request } = this.requestQueue.shift()!;

      try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.REQUEST_DELAY) {
          await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest));
        }

        const result = await request();
        this.lastRequestTime = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  // Test connection to Gemini API
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing Gemini v1 API connection...');
      console.log('API Key exists:', !!GEMINI_API_KEY);
      
      const response = await axios.post(
        `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: "Hello"
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const text = response.data.candidates[0].content.parts[0].text;
      console.log('API test successful, response:', text);
      return { success: true };
    } catch (error) {
      console.error('Gemini v1 API test failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Print the full error object from Google
      if (error.response?.data?.error) {
        console.error('Google API Error:', error.response.data.error);
      }
      
      return { success: false, error: error.message };
    }
  }

  // List available models from Google API
  async listAvailableModels(): Promise<{ success: boolean; models?: string[]; error?: string }> {
    try {
      console.log('Fetching available models from Google API...');
      
      // Try v1beta first
      try {
        const response = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const models = response.data.models?.map((model: any) => model.name) || [];
        console.log('Available models (v1beta):', models);
        return { success: true, models };
      } catch (v1betaError) {
        console.log('v1beta failed, trying v1...');
        
        // Try v1
        const response = await axios.get(
          `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const models = response.data.models?.map((model: any) => model.name) || [];
        console.log('Available models (v1):', models);
        return { success: true, models };
      }
    } catch (error) {
      console.error('Failed to list models:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return { success: false, error: error.message };
    }
  }

  // Retry logic for API calls
  private async retryApiCall<T>(apiCall: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Check if it's a retryable error
        const isRetryable = error.response?.data?.error?.code === 503 || 
                           error.response?.data?.error?.code === 429 ||
                           error.response?.data?.error?.status === 'UNAVAILABLE';
        
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff: wait 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Chat functionality
  async chat(message: string, context?: any): Promise<string> {
    try {
      console.log(`AI Chat: Processing message - "${message}"`);

      // Get products for context
      const products = await Product.find().populate('seller', 'name').limit(50);
      const productCatalog = products.map(p => ({
        id: (p._id as any).toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        seller: (p.seller as any)?.name || 'ExCom Seller'
      }));

      // Enhanced language detection
      const detectedLanguage = this.detectLanguage(message);
      const isRealTime = context?.realTime || false;
      const isVoiceMode = context?.voiceMode || false;

      const systemPrompt = `You are an intelligent shopping assistant for ExCom, an e-commerce platform. Your primary role is to help users find and recommend products from our catalog.

**IMPORTANT INSTRUCTIONS:**
1. You can communicate in both English and Kinyarwanda languages
2. When users write in Kinyarwanda, respond in Kinyarwanda
3. When users write in English, respond in English
4. When users mention ANY product name or type, immediately search our product catalog and recommend specific products
5. Always prioritize showing actual products from our ExCom catalog over generic advice
6. Be direct and helpful - users want product recommendations, not lengthy explanations
7. If you find matching products, format your response to highlight them clearly

**ENHANCED KINYARWANDA SUPPORT:**
- Use natural Kinyarwanda phrases: "Muraho" (Hello), "Ndagufasha" (I help you), "Nibaza" (I ask), "Nkunda" (I like)
- Common shopping terms: "ibicuruzwa" (products), "amafaranga" (money), "gucuruza" (to sell), "gura" (to buy)
- Use familiar expressions: "byiza" (good), "nshobora" (I can), "nshaka" (I want), "niba" (if)
- Keep responses natural and conversational in Kinyarwanda
- Use proper Kinyarwanda grammar and sentence structure
- Include common Kinyarwanda shopping phrases:
  * "Nshaka ibicuruzwa byiza" (I want good products)
  * "Nerekere amafaranga make" (Show me cheap prices)
  * "Nshobora kugura iki?" (Can I buy this?)
  * "Iki giciro ni iki?" (What is this price?)
  * "Ndagufasha gusanga ibyiza" (I help you find good ones)
  * "Murakoze gufasha" (Thank you for helping)
- Use appropriate Kinyarwanda numbers: rimwe, kabiri, gatatu, kane, gatanu
- Include common product categories in Kinyarwanda: imyenda (clothes), ibikoresho (tools), ibiribwa (food)

**REAL-TIME VOICE MODE:**
${isRealTime ? '- Keep responses under 80 words for optimal voice experience\n- Use conversational tone suitable for speech\n- Respond quickly and naturally\n- Use product ID format: "ID: [product_id]" for recommendations' : ''}

**CURRENT EXCOM PRODUCT CATALOG:**
${productCatalog.map(p => `ID: ${p.id} | ${p.title} - $${p.price} | ${p.category} | Seller: ${p.seller}`).join('\n')}

**CONVERSATION CONTEXT:**
${context?.conversationHistory ? context.conversationHistory.join('\n') : 'No previous conversation'}

**RESPONSE FORMAT:**
- Provide helpful, actionable responses
- Include specific product recommendations when relevant
- Use the product ID format: "ID: [product_id]" for recommendations
- Keep responses concise but comprehensive
- Always provide 3-4 relevant follow-up suggestions
- Respond in ${detectedLanguage} language

Remember: You're helping users find products they want to buy, so be practical, encouraging, and specific in your recommendations.`;

      const result = await this.retryApiCall(async () => {
        return await this.queueRequest(async () => {
          const response = await axios.post(
            `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\nUser Question: "${message}"`
                }]
              }]
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          return response.data.candidates[0].content.parts[0].text;
        });
      });

      return result;
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Print the full error object from Google
      if (error.response?.data?.error) {
        console.error('Google API Error:', error.response.data.error);
        
        // Handle specific error types
        const googleError = error.response.data.error;
        if (googleError.code === 503 || googleError.status === 'UNAVAILABLE') {
          throw new Error('AI service is temporarily overloaded. Please try again in a few moments.');
        } else if (googleError.code === 429) {
          throw new Error('AI service rate limit exceeded. Please wait a moment before trying again.');
        } else if (googleError.code === 400) {
          throw new Error('Invalid request to AI service. Please try rephrasing your question.');
        }
      }
      
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
  }

  // Smart search functionality
  async smartSearch(query: string, userId?: string): Promise<SearchResults> {
    try {
      console.log(`AI Search: Processing query - "${query}"`);

      const startTime = Date.now();

      // Get all products
      const products = await Product.find().populate('seller', 'name rating').sort({ createdAt: -1 });
      
      // Get user context if available
      let userContext = '';
      if (userId) {
        try {
          const user = await User.findById(userId);
          const recentOrders = await Order.find({ buyer: userId })
            .populate('items.product', 'title category price seller')
            .limit(10)
            .sort({ createdAt: -1 });
          
          const purchasedItems = recentOrders.flatMap(order => order.items);
          const categories = Array.from(new Set(purchasedItems.map(item => (item.product as any).category)));
          const prices = purchasedItems.map(item => (item.product as any).price);
          
          userContext = `User has purchased from categories: ${categories.join(', ')}. Price range: $${Math.min(...prices)} - $${Math.max(...prices)}.`;
        } catch (error) {
          console.error('Error getting user context:', error);
        }
      }

      const productCatalog = products.map(p => ({
        id: (p._id as any).toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        seller: (p.seller as any)?.name || 'ExCom Seller',
        keywords: `${p.title} ${p.description} ${p.category}`.toLowerCase()
      }));

      const systemPrompt = `You are an intelligent product search assistant for ExCom. Analyze the user's search query and recommend the most relevant products from our catalog.

**SEARCH ANALYSIS:**
- Query: "${query}"
- User Context: ${userContext || 'No user context available'}
- Total Products Available: ${products.length}

**PRODUCT CATALOG:**
${productCatalog.map(p => `ID: ${p.id} | ${p.title} - $${p.price} | ${p.category} | Seller: ${p.seller} | Keywords: ${p.keywords}`).join('\n')}

**INSTRUCTIONS:**
1. Analyze the search query for intent, keywords, and context
2. Find the most relevant products (minimum 3, maximum 10)
3. Rank products by relevance to the search query
4. Provide reasoning for each recommendation
5. Consider user's purchase history if available
6. Focus on products that match the search intent

**RESPONSE FORMAT:**
Return a JSON array of recommendations with this structure:
[
  {
    "productId": "product_id_here",
    "relevanceScore": 0.95,
    "reason": "Why this product is relevant",
    "recommendationType": "exact_match|category_match|related|trending",
    "confidenceLevel": "high|medium|low"
  }
]

**SEARCH PRIORITIES:**
1. Exact product name matches
2. Category matches
3. Description keyword matches
4. Related products
5. Trending/popular products

Return only the JSON array, no additional text.`;

      const result = await this.queueRequest(async () => {
        const response = await axios.post(
          `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: systemPrompt
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data.candidates[0].content.parts[0].text;
      });

      // Parse the AI response
      let recommendations: ProductRecommendation[] = [];
      try {
        const cleanResponse = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        
        if (Array.isArray(parsed)) {
          recommendations = parsed.map((rec: any) => {
            const product = productCatalog.find(p => p.id === rec.productId);
            return {
              productId: rec.productId,
              title: product?.title || 'Unknown Product',
              price: product?.price || 0,
              category: product?.category || 'Unknown',
              relevanceScore: rec.relevanceScore || 0.5,
              reason: rec.reason || 'Recommended based on search',
              recommendationType: rec.recommendationType || 'related',
              confidenceLevel: rec.confidenceLevel || 'medium'
            };
          });
        }
      } catch (parseError) {
        console.error('Error parsing AI search response:', parseError);
        // Fallback: simple keyword matching
        recommendations = this.fallbackSearch(query, productCatalog);
      }

      const searchTime = Date.now() - startTime;

      return {
        query,
        recommendations,
        totalResults: recommendations.length,
        searchTime,
        userContext: userContext || undefined
      };
    } catch (error) {
      console.error('AI Smart Search error:', error);
      throw new Error('AI search service temporarily unavailable');
    }
  }

  // Fallback search when AI parsing fails
  private fallbackSearch(query: string, products: any[]): ProductRecommendation[] {
    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(' ').filter(word => word.length > 2);
    
    return products
      .map(product => {
        let score = 0;
        const productText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        
        // Exact title match
        if (product.title.toLowerCase().includes(lowerQuery)) {
          score += 0.9;
        }
        
        // Keyword matches
        keywords.forEach(keyword => {
          if (productText.includes(keyword)) {
            score += 0.3;
          }
        });
        
        // Category match
        if (product.category.toLowerCase().includes(lowerQuery)) {
          score += 0.5;
        }
        
        return {
          productId: product.id,
          title: product.title,
          price: product.price,
          category: product.category,
          relevanceScore: Math.min(score, 1),
          reason: `Matches search query: "${query}"`,
          recommendationType: score > 0.7 ? 'exact_match' : 'category_match',
          confidenceLevel: score > 0.7 ? 'high' : 'medium'
        };
      })
      .filter(rec => rec.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  // Generate product recommendations
  async generateRecommendations(userId?: string, limit: number = 10): Promise<ProductRecommendation[]> {
    try {
      console.log(`AI Recommendations: Generating for user ${userId || 'anonymous'}`);

      // Get products
      const products = await Product.find().populate('seller', 'name rating').limit(100);
      
      // Get user context if available
      let userContext = '';
      if (userId) {
        try {
          const user = await User.findById(userId);
          const recentOrders = await Order.find({ buyer: userId })
            .populate('items.product', 'title category price seller')
            .limit(10)
            .sort({ createdAt: -1 });
          
          const purchasedItems = recentOrders.flatMap(order => order.items);
          const categories = Array.from(new Set(purchasedItems.map(item => (item.product as any).category)));
          
          userContext = `User has purchased from categories: ${categories.join(', ')}.`;
        } catch (error) {
          console.error('Error getting user context for recommendations:', error);
        }
      }

      const productCatalog = products.map(p => ({
        id: (p._id as any).toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        seller: (p.seller as any)?.name || 'ExCom Seller',
        rating: (p.seller as any)?.rating || 0
      }));

      const systemPrompt = `You are a product recommendation engine for ExCom. Generate personalized product recommendations based on user context and available products.

**USER CONTEXT:**
${userContext || 'No user context available - recommend popular/trending products'}

**AVAILABLE PRODUCTS:**
${productCatalog.map(p => `ID: ${p.id} | ${p.title} - $${p.price} | ${p.category} | Seller: ${p.seller} | Rating: ${p.rating}`).join('\n')}

**INSTRUCTIONS:**
1. Generate ${limit} personalized product recommendations
2. Consider user's purchase history if available
3. Include a mix of categories and price ranges
4. Prioritize high-rated products and popular categories
5. Provide reasoning for each recommendation

**RESPONSE FORMAT:**
Return a JSON array of recommendations:
[
  {
    "productId": "product_id_here",
    "relevanceScore": 0.95,
    "reason": "Why this product is recommended",
    "recommendationType": "personalized|trending|category_based|price_based",
    "confidenceLevel": "high|medium|low"
  }
]

Return only the JSON array, no additional text.`;

      const result = await this.queueRequest(async () => {
        const response = await axios.post(
          `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: systemPrompt
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data.candidates[0].content.parts[0].text;
      });

      // Parse the AI response
      let recommendations: ProductRecommendation[] = [];
      try {
        const cleanResponse = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        
        if (Array.isArray(parsed)) {
          recommendations = parsed.map((rec: any) => {
            const product = productCatalog.find(p => p.id === rec.productId);
            return {
              productId: rec.productId,
              title: product?.title || 'Unknown Product',
              price: product?.price || 0,
              category: product?.category || 'Unknown',
              relevanceScore: rec.relevanceScore || 0.5,
              reason: rec.reason || 'Recommended for you',
              recommendationType: rec.recommendationType || 'personalized',
              confidenceLevel: rec.confidenceLevel || 'medium'
            };
          });
        }
      } catch (parseError) {
        console.error('Error parsing AI recommendations response:', parseError);
        // Fallback: return popular products
        recommendations = productCatalog
          .sort((a, b) => b.rating - a.rating)
          .slice(0, limit)
          .map(product => ({
            productId: product.id,
            title: product.title,
            price: product.price,
            category: product.category,
            relevanceScore: 0.8,
            reason: 'Popular product recommendation',
            recommendationType: 'trending',
            confidenceLevel: 'high'
          }));
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('AI Recommendations error:', error);
      throw new Error('AI recommendations service temporarily unavailable');
    }
  }

  // Compare products
  async compareProducts(productIds: string[]): Promise<any> {
    try {
      console.log(`AI Compare: Comparing products ${productIds.join(', ')}`);

      const products = await Product.find({ _id: { $in: productIds } })
        .populate('seller', 'name rating');

      if (products.length < 2) {
        throw new Error('At least 2 products are required for comparison');
      }

      const productData = products.map(p => ({
        id: (p._id as any).toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        seller: (p.seller as any)?.name || 'ExCom Seller',
        rating: (p.seller as any)?.rating || 0,
        images: p.images
      }));

      const systemPrompt = `You are a product comparison expert for ExCom. Compare the following products and provide a detailed analysis.

**PRODUCTS TO COMPARE:**
${productData.map(p => `ID: ${p.id} | ${p.title} - $${p.price} | ${p.category} | Seller: ${p.seller} | Rating: ${p.rating}\nDescription: ${p.description}`).join('\n\n')}

**INSTRUCTIONS:**
1. Compare products across key dimensions: price, quality, features, seller reputation
2. Identify the best value for money
3. Highlight unique selling points of each product
4. Provide a clear recommendation
5. Consider different user needs and preferences

**RESPONSE FORMAT:**
Return a JSON object with this structure:
{
  "comparison": {
    "price": "Analysis of pricing",
    "quality": "Analysis of quality",
    "features": "Analysis of features",
    "seller": "Analysis of sellers"
  },
  "recommendations": [
    {
      "productId": "product_id",
      "reason": "Why this product is recommended",
      "bestFor": "Type of user this product is best for"
    }
  ],
  "summary": "Overall comparison summary",
  "winner": "product_id_of_best_overall"
}

Return only the JSON object, no additional text.`;

      const result = await this.queueRequest(async () => {
        const response = await axios.post(
          `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: systemPrompt
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data.candidates[0].content.parts[0].text;
      });

      // Parse the AI response
      try {
        const cleanResponse = result.replace(/```json|```/g, '').trim();
        const comparison = JSON.parse(cleanResponse);
        
        return {
          products: productData,
          comparison: comparison.comparison || {},
          recommendations: comparison.recommendations || [],
          summary: comparison.summary || 'Comparison completed',
          winner: comparison.winner || productIds[0]
        };
      } catch (parseError) {
        console.error('Error parsing AI comparison response:', parseError);
        // Fallback comparison
        return {
          products: productData,
          comparison: {
            price: 'Price comparison available',
            quality: 'Quality assessment available',
            features: 'Feature comparison available',
            seller: 'Seller comparison available'
          },
          recommendations: productData.map(p => ({
            productId: p.id,
            reason: 'Product available for comparison',
            bestFor: 'General use'
          })),
          summary: 'Basic product comparison completed',
          winner: productData[0].id
        };
      }
    } catch (error) {
      console.error('AI Compare error:', error);
      throw new Error('AI comparison service temporarily unavailable');
    }
  }

  // Generate product listing from image and text
  async generateListing(data: { imageBase64?: string; text?: string }): Promise<any> {
    try {
      console.log('AI Generate Listing: Processing request');

      const systemPrompt = `You are a product listing generator for ExCom. Create a compelling product listing based on the provided information.

**INSTRUCTIONS:**
1. Generate a catchy product title
2. Write a detailed product description
3. Suggest appropriate categories
4. Recommend pricing strategy
5. Provide marketing tips
6. Include relevant keywords for SEO

**RESPONSE FORMAT:**
Return a JSON object with this structure:
{
  "title": "Product title",
  "description": "Detailed product description",
  "category": "Suggested category",
  "price": "Suggested price range",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "marketingTips": ["tip1", "tip2", "tip3"],
  "seoOptimized": true
}

Return only the JSON object, no additional text.`;

      const result = await this.queueRequest(async () => {
        const response = await axios.post(
          `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nProduct Information: ${data.text || 'No text provided'}`
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data.candidates[0].content.parts[0].text;
      });

      // Parse the AI response
      try {
        const cleanResponse = result.replace(/```json|```/g, '').trim();
        const listing = JSON.parse(cleanResponse);
        
        return {
          title: listing.title || 'Generated Product Title',
          description: listing.description || 'Generated product description',
          category: listing.category || 'General',
          price: listing.price || '$10-50',
          keywords: listing.keywords || ['product', 'quality', 'affordable'],
          marketingTips: listing.marketingTips || ['Use high-quality images', 'Write compelling descriptions'],
          seoOptimized: listing.seoOptimized || true
        };
      } catch (parseError) {
        console.error('Error parsing AI listing response:', parseError);
        // Fallback listing
        return {
          title: 'Generated Product Title',
          description: 'Generated product description based on provided information',
          category: 'General',
          price: '$10-50',
          keywords: ['product', 'quality', 'affordable'],
          marketingTips: ['Use high-quality images', 'Write compelling descriptions'],
          seoOptimized: true
        };
      }
    } catch (error) {
      console.error('AI Generate Listing error:', error);
      throw new Error('AI listing generation service temporarily unavailable');
    }
  }

  // Vendor support functionality
  async generateVendorResponse(message: string, userId?: string, context?: any): Promise<AIResponse> {
    try {
      console.log(`AI Vendor Support: Processing message - "${message}"`);

      const systemPrompt = `You are an intelligent vendor support assistant for ExCom. Help vendors with their business needs, product management, and store optimization.

**VENDOR SUPPORT GUIDELINES:**
1. You can communicate in both English and Kinyarwanda languages
2. When users write in Kinyarwanda, respond in Kinyarwanda
3. When users write in English, respond in English
4. Focus on practical, actionable advice for business growth
5. Provide specific strategies and tips
6. Be encouraging and supportive
7. Always provide 3-4 relevant follow-up suggestions

**KINYARWANDA LANGUAGE SUPPORT:**
- Common terms: "isitolo" (store), "ibicuruzwa" (products), "amafaranga" (money), "abakiriya" (customers)
- Use simple, clear language
- Be respectful and helpful

**ENGLISH LANGUAGE SUPPORT:**
- Use professional but friendly tone
- Provide clear, actionable advice
- Focus on business growth and optimization

**RESPONSE FORMAT:**
Provide a helpful, actionable response followed by 3-4 specific follow-up suggestions that the vendor can ask about next.

Remember: You're helping a real business owner succeed, so be practical, encouraging, and specific in your advice.`;

      const result = await this.queueRequest(async () => {
        const response = await axios.post(
          `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nVendor Question: "${message}"`
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data.candidates[0].content.parts[0].text;
      });

      // Generate follow-up suggestions
      const suggestions = this.generateVendorSuggestions(message, result);

      return {
        response: result,
        suggestions,
        metadata: {
          aiSource: 'gemini-2.0-flash',
          timestamp: new Date().toISOString(),
          model: 'gemini-2.0-flash'
        }
      };
    } catch (error) {
      console.error('AI Vendor Support error:', error);
      throw new Error('AI vendor support service temporarily unavailable');
    }
  }

  // Enhanced language detection method with comprehensive Kinyarwanda support
  private detectLanguage(text: string): string {
    const lowerText = text.toLowerCase().trim();
    
    // Comprehensive Kinyarwanda language indicators
    const kinyarwandaWords = [
      // Greetings and common phrases
      'muraho', 'bite', 'murakoze', 'murabeho', 'murakaza', 'murakaza neza',
      'amakuru', 'ni meza', 'ni byiza', 'ni byose', 'ni byiza cyane',
      
      // Pronouns and basic words
      'ni', 'iki', 'icyo', 'iyi', 'iyo', 'iyi', 'iyo', 'iyi', 'iyo',
      'nshobora', 'nshaka', 'nkunda', 'nibaza', 'ndagufasha', 'ndabizi',
      'nshoboye', 'nshoboye', 'nshoboye', 'nshoboye', 'nshoboye',
      
      // Shopping and commerce vocabulary
      'gufasha', 'isitolo', 'ubucuruzi', 'ibicuruzwa', 'amafaranga', 'gucuruza',
      'abakiriya', 'umucuruzi', 'umukiriya', 'isoko', 'gura', 'gucuruza',
      'ibyaguzwe', 'ibyaguzwe', 'ibyaguzwe', 'ibyaguzwe', 'ibyaguzwe',
      'amafaranga', 'amafaranga', 'amafaranga', 'amafaranga', 'amafaranga',
      
      // Common verbs and actions
      'gufasha', 'gukora', 'gukora', 'gukora', 'gukora', 'gukora',
      'gukora', 'gukora', 'gukora', 'gukora', 'gukora', 'gukora',
      'gukora', 'gukora', 'gukora', 'gukora', 'gukora', 'gukora',
      
      // Descriptive words
      'byiza', 'niba', 'byose', 'byose', 'byose', 'byose', 'byose',
      'byose', 'byose', 'byose', 'byose', 'byose', 'byose', 'byose',
      
      // Numbers and quantities
      'rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu', 'gatandatu', 'karindwi',
      'umunani', 'icyenda', 'icumi', 'ijana', 'igihumbi', 'amajana',
      
      // Time and location
      'ubu', 'ejo', 'ejo hazaza', 'ejo hashize', 'noneho', 'hanyuma',
      'mbere', 'nyuma', 'hejuru', 'hasi', 'hariya', 'hano', 'hano',
      
      // Common expressions
      'yego', 'oya', 'ntibyiza', 'ntibyiza', 'ntibyiza', 'ntibyiza',
      'ntibyiza', 'ntibyiza', 'ntibyiza', 'ntibyiza', 'ntibyiza', 'ntibyiza',
      
      // Product categories in Kinyarwanda
      'imyenda', 'ibikoresho', 'ibiribwa', 'ibinyobwa', 'ibikoresho by\'ubwoba',
      'ibikoresho by\'ubwoba', 'ibikoresho by\'ubwoba', 'ibikoresho by\'ubwoba',
      'ibikoresho by\'ubwoba', 'ibikoresho by\'ubwoba', 'ibikoresho by\'ubwoba',
      
      // Additional common words
      'umuntu', 'abantu', 'umugore', 'abagore', 'umuhungu', 'abahungu',
      'umwana', 'abana', 'umuryango', 'imiryango', 'urugo', 'amazu',
      'umudugu', 'imidugudu', 'umujyi', 'imijyi', 'igihugu', 'amahanga'
    ];
    
    // English language indicators (for comparison)
    const englishWords = [
      'hello', 'hi', 'help', 'find', 'show', 'buy', 'sell', 'product', 'price',
      'money', 'store', 'shop', 'customer', 'want', 'can', 'like', 'good', 'if',
      'the', 'and', 'or', 'but', 'with', 'for', 'from', 'to', 'in', 'on', 'at',
      'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'
    ];
    
    // Count matches for each language
    const kinyarwandaCount = kinyarwandaWords.filter(word => lowerText.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    
    // Calculate confidence scores
    const totalWords = kinyarwandaCount + englishCount;
    let confidence = 0.5;
    
    if (totalWords > 0) {
      confidence = kinyarwandaCount / totalWords;
    }
    
    // Strong Kinyarwanda indicators
    const strongKinyarwandaIndicators = [
      'muraho', 'nshobora', 'ndagufasha', 'murakoze', 'amakuru', 'ni meza',
      'ibicuruzwa', 'amafaranga', 'gucuruza', 'isitolo', 'ubucuruzi'
    ];
    
    const hasStrongIndicator = strongKinyarwandaIndicators.some(word => lowerText.includes(word));
    
    // Decision logic
    if (hasStrongIndicator || confidence > 0.6 || kinyarwandaCount >= 3) {
      return 'rw';
    }
    
    // If English words dominate, return English
    if (englishCount > kinyarwandaCount && englishCount >= 2) {
      return 'en';
    }
    
    // Default to English for ambiguous cases
    return 'en';
  }

  // Generate vendor suggestions with comprehensive Kinyarwanda support
  private generateVendorSuggestions(message: string, reply: string): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Enhanced Kinyarwanda language detection
    const kinyarwandaWords = [
      'muraho', 'bite', 'ni', 'iki', 'nshobora', 'gufasha', 'isitolo', 'ubucuruzi', 
      'ibicuruzwa', 'amafaranga', 'gucuruza', 'abakiriya', 'murakoze', 'amakuru',
      'ndagufasha', 'nshaka', 'nkunda', 'byiza', 'niba', 'gura', 'isoko'
    ];
    const isKinyarwanda = kinyarwandaWords.some(word => lowerMessage.includes(word));
    
    if (isKinyarwanda) {
      // Comprehensive Kinyarwanda suggestions based on context
      if (lowerMessage.includes('ibyaguzwe') || lowerMessage.includes('amafaranga') || lowerMessage.includes('gucuruza')) {
        suggestions.push('Nerekere amahitamo y\'ubwoba');
        suggestions.push('Suzuma uburyo bwo guhindura abakiriya');
        suggestions.push('Nerekere amahirwe y\'igihe');
        suggestions.push('Nfasha mu mahitamo y\'amafaranga');
      } else if (lowerMessage.includes('ibicuruzwa') || lowerMessage.includes('gucuruza') || lowerMessage.includes('isitolo')) {
        suggestions.push('Suzuma ibisobanuro by\'ibicuruzwa');
        suggestions.push('Nerekere amahitamo y\'amafaranga');
        suggestions.push('Gereranya n\'abandi bacuruzi');
        suggestions.push('Nerekere ibicuruzwa byiza');
      } else if (lowerMessage.includes('imyenda') || lowerMessage.includes('ibikoresho') || lowerMessage.includes('ibiribwa')) {
        suggestions.push('Nerekere imyenda nziza');
        suggestions.push('Nfasha gusanga ibikoresho byiza');
        suggestions.push('Nerekere amafaranga make y\'ibiribwa');
        suggestions.push('Nshobora kugura iki?');
      } else if (lowerMessage.includes('nshaka') || lowerMessage.includes('nshobora') || lowerMessage.includes('ndagufasha')) {
        suggestions.push('Nshobora gute kongera ibyaguzwe?');
        suggestions.push('Suzuma imikorere y\'isitolo yanjye');
        suggestions.push('Nerekere amabwiriza y\'ibicuruzwa');
        suggestions.push('Nfasha mu mahitamo y\'amafaranga');
      } else {
        // General Kinyarwanda suggestions
        suggestions.push('Nshobora gufasha iki?');
        suggestions.push('Nerekere ibicuruzwa byiza');
        suggestions.push('Nfasha gusanga amafaranga make');
        suggestions.push('Nshaka kumenya byinshi');
      }
    } else {
      // English suggestions
      if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
        suggestions.push('Show me specific marketing tactics');
        suggestions.push('Analyze my conversion funnel');
        suggestions.push('Suggest seasonal promotions');
      } else if (lowerMessage.includes('product') || lowerMessage.includes('inventory')) {
        suggestions.push('Review my product descriptions');
        suggestions.push('Suggest pricing strategies');
        suggestions.push('Analyze competitor pricing');
      } else {
        suggestions.push('How can I increase my sales?');
        suggestions.push('Analyze my store performance');
        suggestions.push('Suggest product improvements');
        suggestions.push('Help with pricing strategy');
      }
    }
    
    return suggestions.slice(0, 4);
  }

  // AI-powered trend analysis for vendors
  async analyzeVendorTrends(vendorId: string, timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    try {
      console.log(`AI Trend Analysis: Analyzing trends for vendor ${vendorId} over ${timeRange}`);

      // Get vendor's products and orders
      const products = await Product.find({ seller: vendorId }).populate('seller', 'name');
      const orders = await Order.find({ 
        'items.vendor': vendorId,
        createdAt: this.getDateRangeFilter(timeRange)
      }).populate('items.product', 'title category price').populate('buyer', 'name');

      // Calculate time range filter
      const dateRange = this.getDateRangeFilter(timeRange);
      
      // Get historical data for comparison
      const previousOrders = await Order.find({ 
        'items.vendor': vendorId,
        createdAt: this.getPreviousDateRangeFilter(timeRange)
      }).populate('items.product', 'title category price');

      // Prepare data for AI analysis
      const salesData = this.prepareSalesData(orders, products);
      const previousSalesData = this.prepareSalesData(previousOrders, products);
      
      const systemPrompt = `You are an AI business analyst specializing in e-commerce trend analysis. Analyze the following vendor sales data and provide comprehensive insights.

**VENDOR SALES DATA (${timeRange.toUpperCase()}):**
${JSON.stringify(salesData, null, 2)}

**PREVIOUS PERIOD DATA (for comparison):**
${JSON.stringify(previousSalesData, null, 2)}

**ANALYSIS REQUIREMENTS:**
1. Identify top-performing products and categories
2. Analyze sales trends and patterns
3. Compare current period vs previous period
4. Identify growth opportunities
5. Suggest pricing strategies
6. Recommend inventory adjustments
7. Provide actionable business insights
8. Identify seasonal trends if applicable
9. Suggest marketing strategies
10. Highlight potential risks or concerns

**RESPONSE FORMAT:**
Return a comprehensive JSON analysis with this structure:
{
  "summary": {
    "totalRevenue": number,
    "totalOrders": number,
    "averageOrderValue": number,
    "growthRate": number,
    "topPerformingCategory": string,
    "topPerformingProduct": string
  },
  "trends": {
    "salesTrend": "increasing|decreasing|stable",
    "categoryTrends": [
      {
        "category": string,
        "sales": number,
        "growth": number,
        "trend": "up|down|stable"
      }
    ],
    "productTrends": [
      {
        "productId": string,
        "productName": string,
        "sales": number,
        "growth": number,
        "trend": "up|down|stable"
      }
    ]
  },
  "insights": {
    "topInsights": [
      {
        "type": "opportunity|warning|success|recommendation",
        "title": string,
        "description": string,
        "impact": "high|medium|low",
        "actionable": boolean
      }
    ],
    "seasonalPatterns": string,
    "customerBehavior": string,
    "marketPosition": string
  },
  "recommendations": {
    "pricing": [
      {
        "productId": string,
        "currentPrice": number,
        "suggestedPrice": number,
        "reason": string,
        "expectedImpact": string
      }
    ],
    "inventory": [
      {
        "productId": string,
        "action": "increase|decrease|maintain",
        "reason": string,
        "priority": "high|medium|low"
      }
    ],
    "marketing": [
      {
        "strategy": string,
        "targetProducts": string[],
        "expectedOutcome": string,
        "effort": "low|medium|high"
      }
    ]
  },
  "forecasting": {
    "nextPeriodPrediction": {
      "expectedRevenue": number,
      "expectedOrders": number,
      "confidence": "high|medium|low"
    },
    "riskFactors": string[],
    "opportunities": string[]
  }
}

Return only the JSON object, no additional text.`;

      const result = await this.queueRequest(async () => {
        const response = await axios.post(
          `${GEMINI_V1_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: systemPrompt
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data.candidates[0].content.parts[0].text;
      });

      // Parse the AI response
      try {
        const cleanResponse = result.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanResponse);
        
        return {
          vendorId,
          timeRange,
          analysis,
          generatedAt: new Date().toISOString(),
          dataPoints: {
            currentPeriodOrders: orders.length,
            previousPeriodOrders: previousOrders.length,
            totalProducts: products.length
          }
        };
      } catch (parseError) {
        console.error('Error parsing AI trend analysis response:', parseError);
        // Fallback analysis
        return this.generateFallbackTrendAnalysis(salesData, previousSalesData, vendorId, timeRange);
      }
    } catch (error) {
      console.error('AI Trend Analysis error:', error);
      throw new Error('AI trend analysis service temporarily unavailable');
    }
  }

  // Prepare sales data for AI analysis
  private prepareSalesData(orders: any[], products: any[]): any {
    const salesByProduct: { [key: string]: any } = {};
    const salesByCategory: { [key: string]: any } = {};
    let totalRevenue = 0;
    let totalOrders = orders.length;

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const product = item.product;
        if (!product) return;

        const productId = product._id.toString();
        const category = product.category;
        
        // Product sales
        if (!salesByProduct[productId]) {
          salesByProduct[productId] = {
            productId,
            productName: product.title,
            category: product.category,
            price: product.price,
            sales: 0,
            quantity: 0,
            revenue: 0
          };
        }
        
        salesByProduct[productId].sales += 1;
        salesByProduct[productId].quantity += item.quantity;
        salesByProduct[productId].revenue += item.price * item.quantity;
        
        // Category sales
        if (!salesByCategory[category]) {
          salesByCategory[category] = {
            category,
            sales: 0,
            quantity: 0,
            revenue: 0
          };
        }
        
        salesByCategory[category].sales += 1;
        salesByCategory[category].quantity += item.quantity;
        salesByCategory[category].revenue += item.price * item.quantity;
        
        totalRevenue += item.price * item.quantity;
      });
    });

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      salesByProduct: Object.values(salesByProduct),
      salesByCategory: Object.values(salesByCategory),
      topProducts: Object.values(salesByProduct).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10),
      topCategories: Object.values(salesByCategory).sort((a: any, b: any) => b.revenue - a.revenue)
    };
  }

  // Get date range filter for MongoDB queries
  private getDateRangeFilter(timeRange: string): any {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { $gte: startDate, $lte: now };
  }

  // Get previous period date range filter
  private getPreviousDateRangeFilter(timeRange: string): any {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (timeRange) {
      case 'week':
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = lastMonth;
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarter':
        const lastQuarter = Math.floor((now.getMonth() - 3) / 3);
        const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter;
        startDate = new Date(lastQuarterYear, adjustedQuarter * 3, 1);
        endDate = new Date(lastQuarterYear, (adjustedQuarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { $gte: startDate, $lte: endDate };
  }

  // Generate fallback trend analysis when AI parsing fails
  private generateFallbackTrendAnalysis(currentData: any, previousData: any, vendorId: string, timeRange: string): any {
    const growthRate = previousData.totalRevenue > 0 
      ? ((currentData.totalRevenue - previousData.totalRevenue) / previousData.totalRevenue) * 100 
      : 0;

    const topProduct = currentData.topProducts[0];
    const topCategory = currentData.topCategories[0];

    return {
      vendorId,
      timeRange,
      analysis: {
        summary: {
          totalRevenue: currentData.totalRevenue,
          totalOrders: currentData.totalOrders,
          averageOrderValue: currentData.averageOrderValue,
          growthRate: growthRate,
          topPerformingCategory: topCategory?.category || 'N/A',
          topPerformingProduct: topProduct?.productName || 'N/A'
        },
        trends: {
          salesTrend: growthRate > 5 ? 'increasing' : growthRate < -5 ? 'decreasing' : 'stable',
          categoryTrends: currentData.topCategories.map((cat: any) => ({
            category: cat.category,
            sales: cat.sales,
            growth: 0, // Would need more complex calculation
            trend: 'stable'
          })),
          productTrends: currentData.topProducts.slice(0, 5).map((prod: any) => ({
            productId: prod.productId,
            productName: prod.productName,
            sales: prod.sales,
            growth: 0,
            trend: 'stable'
          }))
        },
        insights: {
          topInsights: [
            {
              type: 'recommendation',
              title: 'Focus on Top Products',
              description: `Your top product "${topProduct?.productName}" is performing well. Consider expanding inventory.`,
              impact: 'medium',
              actionable: true
            }
          ],
          seasonalPatterns: 'No seasonal patterns detected in current data',
          customerBehavior: 'Standard purchasing patterns observed',
          marketPosition: 'Competitive position maintained'
        },
        recommendations: {
          pricing: [],
          inventory: [],
          marketing: []
        },
        forecasting: {
          nextPeriodPrediction: {
            expectedRevenue: currentData.totalRevenue * (1 + growthRate / 100),
            expectedOrders: currentData.totalOrders * (1 + growthRate / 100),
            confidence: 'medium'
          },
          riskFactors: [],
          opportunities: []
        }
      },
      generatedAt: new Date().toISOString(),
      dataPoints: {
        currentPeriodOrders: currentData.totalOrders,
        previousPeriodOrders: previousData.totalOrders,
        totalProducts: currentData.salesByProduct.length
      }
    };
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Export individual functions for backward compatibility
export const testGeminiConnection = () => aiService.testConnection();
export const listAvailableModels = () => aiService.listAvailableModels();
export const geminiChat = (message: string, context?: any) => aiService.chat(message, context);
export const geminiSmartSearch = (query: string, userId?: string) => aiService.smartSearch(query, userId);
export const geminiRecommend = (userId?: string, limit?: number) => aiService.generateRecommendations(userId, limit);
export const geminiCompareProducts = (productIds: string[]) => aiService.compareProducts(productIds);
export const geminiGenerateListing = (data: { imageBase64?: string; text?: string }) => aiService.generateListing(data);
export const generateProductRecommendations = (clickHistory: any[], products: any[], limit: number) => 
  aiService.generateRecommendations(undefined, limit);
export const analyzeVendorTrends = (vendorId: string, timeRange?: 'week' | 'month' | 'quarter' | 'year') => 
  aiService.analyzeVendorTrends(vendorId, timeRange);

// Export the VendorAIService class for backward compatibility
export class VendorAIService {
  private static instance: VendorAIService;

  public static getInstance(): VendorAIService {
    if (!VendorAIService.instance) {
      VendorAIService.instance = new VendorAIService();
    }
    return VendorAIService.instance;
  }

  async generateVendorResponse(message: string, userId?: string, context?: any): Promise<AIResponse> {
    return aiService.generateVendorResponse(message, userId, context);
  }

  getAnalytics(userId: string): any {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      commonTopics: []
    };
  }

  getGlobalAnalytics(): any {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      commonTopics: []
    };
  }

  recordFeedback(userId: string, messageId: string, feedback: string): void {
    // Implementation for feedback recording
    console.log(`Feedback recorded: ${userId} - ${messageId} - ${feedback}`);
  }
}

export default aiService;
