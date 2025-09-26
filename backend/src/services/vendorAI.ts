import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product';
import User from '../models/User';
import Order from '../models/Order';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_FALLBACK_API_KEY = 'AIzaSyDHKQjqgv6NDqczxWB7uhLFozaAXa4k9JQ';

if (!GEMINI_API_KEY && !GEMINI_FALLBACK_API_KEY) {
  throw new Error('At least one GEMINI_API_KEY is required for vendor AI');
}

// Create multiple AI instances for fallback with v1beta API
const primaryGenAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY, {
  apiVersion: 'v1beta'
}) : null;
const fallbackGenAI = new GoogleGenerativeAI(GEMINI_FALLBACK_API_KEY, {
  apiVersion: 'v1beta'
});

// Dedicated AI service for vendor support - separate from customer support
export class VendorAIService {
  private static instance: VendorAIService;
  private conversationMemory: Map<string, any[]> = new Map();
  private analyticsData: Map<string, any> = new Map();
  private requestQueue: Array<{ resolve: Function; reject: Function; request: any }> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly REQUEST_DELAY = 2000; // 2 seconds between requests
  private quotaResetTime = 0; // Track when quota resets
  private consecutiveFailures = 0; // Track consecutive failures for backoff
  
  private constructor() {}
  
  public static getInstance(): VendorAIService {
    if (!VendorAIService.instance) {
      VendorAIService.instance = new VendorAIService();
    }
    return VendorAIService.instance;
  }

  // Rate-limited request queue system
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        request: requestFn
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { resolve, reject, request } = this.requestQueue.shift()!;
      
      try {
        // Check if we need to wait for quota reset
        if (this.quotaResetTime > Date.now()) {
          const waitTime = this.quotaResetTime - Date.now();
          console.log(`Vendor AI: Waiting ${Math.ceil(waitTime / 1000)}s for quota reset...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Wait for the required delay between requests (with exponential backoff)
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        const delay = this.REQUEST_DELAY * Math.pow(2, Math.min(this.consecutiveFailures, 3)); // Max 16s delay
        if (timeSinceLastRequest < delay) {
          await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastRequest));
        }

        console.log(`Vendor AI: Processing queued request (${this.requestQueue.length} remaining, delay: ${delay}ms)`);
        const result = await request();
        this.lastRequestTime = Date.now();
        this.consecutiveFailures = 0; // Reset failure count on success
        resolve(result);
      } catch (error) {
        this.consecutiveFailures++;
        console.log(`Vendor AI: Queued request failed (${this.consecutiveFailures} consecutive failures):`, error.message);
        
        // Check if it's a quota error and extract reset time
        if (error.message.includes('429') && error.message.includes('retry')) {
          const retryMatch = error.message.match(/retry in (\d+\.?\d*)s/);
          if (retryMatch) {
            this.quotaResetTime = Date.now() + (parseFloat(retryMatch[1]) * 1000);
            console.log(`Vendor AI: Quota exceeded, will retry in ${retryMatch[1]}s`);
          }
        }
        
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  // Enhanced conversational AI responses for vendors using Gemini
  public async generateVendorResponse(message: string, userId?: string, context?: any): Promise<{ response: string; suggestions: string[]; metadata: any }> {
    const startTime = Date.now();
    try {
      console.log(`Vendor AI: Processing message from user ${userId || 'anonymous'}: "${message}"`);
      
      // Get conversation history for context
      const conversationHistory = this.getConversationHistory(userId || 'anonymous');
      
      // Get vendor-specific context
      const vendorContext = await this.getVendorContext(userId);
      
      // Detect language
      const language = this.detectLanguage(message);
      
      // Try multiple API keys for Gemini responses
      let aiResponse = '';
      let usedApiKey = 'none';
      
      const systemPrompt = `You are an intelligent AI business consultant specialized in helping online store vendors optimize their business operations. You provide actionable, data-driven advice for e-commerce success.

**YOUR EXPERTISE AREAS:**
- Store Performance Analysis & Optimization
- Product Management & Inventory Optimization
- Marketing Strategies & Customer Acquisition
- Pricing Strategies & Revenue Optimization
- Customer Service Excellence
- Business Growth & Scaling
- Analytics & Data-Driven Decisions
- Competitive Analysis & Market Positioning

**VENDOR CONTEXT:**
${JSON.stringify(vendorContext, null, 2)}

**CONVERSATION HISTORY:**
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

**CURRENT MESSAGE:** "${message}"
**LANGUAGE:** ${language}

**RESPONSE GUIDELINES:**
1. Provide specific, actionable advice tailored to the vendor's business
2. Use data and analytics to support recommendations
3. Consider the vendor's current business context and goals
4. Offer step-by-step implementation guidance
5. Suggest relevant tools, strategies, and best practices
6. Be encouraging but realistic about challenges
7. Respond in ${language === 'kinyarwanda' ? 'Kinyarwanda' : 'English'}
8. Keep responses concise but comprehensive
9. Always provide 3-4 relevant follow-up suggestions

**RESPONSE FORMAT:**
Provide a helpful, actionable response followed by 3-4 specific follow-up suggestions that the vendor can ask about next.

Remember: You're helping a real business owner succeed, so be practical, encouraging, and specific in your advice.`;

      // Try primary API key first with rate limiting
      if (primaryGenAI) {
        try {
          console.log('Vendor AI: Queuing primary API key request...');
          aiResponse = await this.queueRequest(async () => {
            const model = primaryGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent([
              systemPrompt,
              `Vendor Question: "${message}"`
            ]);
            const response = await result.response;
            return response.text();
          });
          usedApiKey = 'primary';
          console.log('Vendor AI: Primary API key successful');
        } catch (error) {
          console.log('Vendor AI: Primary API key failed, trying fallback...', error.message);
        }
      }
      
      // Try fallback API key if primary failed with rate limiting
      if (!aiResponse) {
        try {
          console.log('Vendor AI: Queuing fallback API key request...');
          aiResponse = await this.queueRequest(async () => {
            const model = fallbackGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent([
              systemPrompt,
              `Vendor Question: "${message}"`
            ]);
            const response = await result.response;
            return response.text();
          });
          usedApiKey = 'fallback';
          console.log('Vendor AI: Fallback API key successful');
        } catch (error) {
          console.log('Vendor AI: Fallback API key also failed:', error.message);
        }
      }
      
      // If both API keys failed, use fallback response
      if (!aiResponse) {
        console.log('Vendor AI: Both API keys failed, using enhanced fallback response');
        console.log('Vendor AI: This is normal - the system will provide intelligent responses without external AI');
        const fallbackResult = this.generateFallbackResponse(message);
        aiResponse = fallbackResult.response;
        usedApiKey = 'enhanced-fallback-system';
      }
      
      // Extract suggestions from the response
      const suggestions = this.extractSuggestions(aiResponse, language);
      
      // Store conversation in memory
      this.addToConversationHistory(userId || 'anonymous', 'user', message);
      this.addToConversationHistory(userId || 'anonymous', 'assistant', aiResponse);
      
      // Track analytics
      const metadata = {
        language: language,
        aiSource: usedApiKey === 'primary' ? 'gemini-vendor-ai-primary' : 
                  usedApiKey === 'fallback' ? 'gemini-vendor-ai-fallback' : 
                  usedApiKey === 'enhanced-fallback-system' ? 'enhanced-fallback-vendor-ai' : 'fallback-vendor-ai',
        apiKeyUsed: usedApiKey,
        timestamp: new Date().toISOString(),
        vendorFocused: true,
        conversationLength: conversationHistory.length,
        vendorContext: vendorContext,
        responseTime: Date.now() - startTime
      };
      
      this.trackAnalytics(userId || 'anonymous', message, aiResponse, metadata);
      
      console.log(`Vendor AI: Generated intelligent response with ${suggestions.length} suggestions`);
      
      return {
        response: aiResponse,
        suggestions: suggestions,
        metadata: metadata
      };
      
    } catch (error) {
      console.error('Vendor AI Gemini error:', error);
      
      // Fallback to rule-based responses
      return this.generateFallbackResponse(message);
    }
  }

  private async getVendorContext(userId?: string): Promise<any> {
    const context: any = {
      businessType: 'e-commerce',
      platform: 'ExCom',
      currentDate: new Date().toISOString(),
      season: this.getCurrentSeason()
    };

    if (userId && userId !== 'anonymous' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        // Get vendor's store information
        const user = await User.findById(userId);
        if (user) {
          context.vendorName = user.name;
          context.vendorEmail = user.email;
          context.accountType = user.role || 'vendor';
        }

        // Get vendor's products
        const products = await Product.find({ seller: userId }).limit(20);
        context.productCount = products.length;
        context.categories = Array.from(new Set(products.map(p => p.category)));
        context.averagePrice = products.length > 0 ? 
          products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
        context.priceRange = products.length > 0 ? {
          min: Math.min(...products.map(p => p.price)),
          max: Math.max(...products.map(p => p.price))
        } : { min: 0, max: 0 };

        // Get recent orders for this vendor
        const recentOrders = await Order.find({ 
          'items.product': { $in: products.map(p => p._id) }
        }).populate('items.product').limit(10).sort({ createdAt: -1 });
        
        context.recentSales = recentOrders.length;
        context.totalRevenue = recentOrders.reduce((sum, order) => 
          sum + order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0
        );

        // Analyze performance trends
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthOrders = recentOrders.filter(order => order.createdAt >= lastMonth);
        context.monthlyGrowth = lastMonthOrders.length > 0 ? 
          ((recentOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100) : 0;

      } catch (error) {
        console.error('Error getting vendor context:', error);
        context.error = 'Unable to load vendor data';
      }
    }

    return context;
  }

  private detectLanguage(message: string): 'english' | 'kinyarwanda' {
    const kinyarwandaWords = [
      'muraho', 'bite', 'ni', 'iki', 'nshobora', 'gufasha', 'isitolo', 'ubucuruzi', 
      'ibicuruzwa', 'amafaranga', 'gucuruza', 'abakiriya', 'gukoresha', 'gutanga', 
      'gushakisha', 'gusuzuma', 'amahirwe', 'ibyemezo', 'gereranya', 'byihuse', 
      'byizewe', 'murakoze', 'yego', 'oya', 'sawa', 'byose', 'umeze', 'ute', 
      'murabe', 'ndabizi', 'ntabwo', 'ubwoba', 'kwamamaza', 'serivisi', 'imikorere',
      'gutezimbere', 'kwiyongera', 'amabwiriza', 'ibisobanuro', 'amahitamo',
      'mwiriwe', 'mwaramutse', 'murakoze', 'ndabizi', 'ntabwo', 'yego', 'oya',
      'sawa', 'byose', 'byose', 'byose', 'byose', 'byose', 'byose', 'byose'
    ];
    
    const lowerMessage = message.toLowerCase();
    const isKinyarwanda = kinyarwandaWords.some(word => lowerMessage.includes(word));
    
    return isKinyarwanda ? 'kinyarwanda' : 'english';
  }

  private getConversationHistory(userId: string): any[] {
    return this.conversationMemory.get(userId) || [];
  }

  private addToConversationHistory(userId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, []);
    }
    
    const history = this.conversationMemory.get(userId)!;
    history.push({ role, content, timestamp: new Date().toISOString() });
    
    // Keep only last 10 messages to manage memory
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  private extractSuggestions(response: string, language: 'english' | 'kinyarwanda'): string[] {
    const suggestions: string[] = [];
    
    // Extract suggestions from response text using multiple patterns
    const lines = response.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match various bullet point patterns
      if (trimmed.match(/^[-•*]\s/) || 
          trimmed.match(/^\d+\.\s/) || 
          trimmed.match(/^[→▶]\s/) ||
          trimmed.match(/^Next:/i) ||
          trimmed.match(/^Try:/i) ||
          trimmed.match(/^Consider:/i)) {
        const suggestion = trimmed.replace(/^[-•*\d.\s→▶]+/, '').replace(/^(Next|Try|Consider):\s*/i, '');
        if (suggestion.length > 0 && suggestion.length < 100) {
          suggestions.push(suggestion);
        }
      }
    }
    
    // If no suggestions found, generate contextual ones based on response content
    if (suggestions.length === 0) {
      const contextualSuggestions = this.generateContextualSuggestions(response, language);
      suggestions.push(...contextualSuggestions);
    }
    
    return suggestions.slice(0, 4); // Return max 4 suggestions
  }

  private generateContextualSuggestions(response: string, language: 'english' | 'kinyarwanda'): string[] {
    const lowerResponse = response.toLowerCase();
    const suggestions: string[] = [];
    
    // Analyze response content to generate relevant suggestions
    if (lowerResponse.includes('sales') || lowerResponse.includes('ibyaguzwe')) {
      if (language === 'kinyarwanda') {
        suggestions.push('Nerekere amahitamo y\'ubwoba');
        suggestions.push('Suzuma uburyo bwo guhindura abakiriya');
      } else {
        suggestions.push('Show me specific marketing tactics');
        suggestions.push('Analyze my conversion funnel');
      }
    }
    
    if (lowerResponse.includes('product') || lowerResponse.includes('ibicuruzwa')) {
      if (language === 'kinyarwanda') {
        suggestions.push('Suzuma ibisobanuro by\'ibicuruzwa');
        suggestions.push('Nerekere amahitamo y\'amafaranga');
      } else {
        suggestions.push('Review my product descriptions');
        suggestions.push('Suggest pricing strategies');
      }
    }
    
    if (lowerResponse.includes('customer') || lowerResponse.includes('abakiriya')) {
      if (language === 'kinyarwanda') {
        suggestions.push('Koresha neza uburyo bwo gusubiza');
        suggestions.push('Koresha neza igihe cyo gusubiza');
      } else {
        suggestions.push('Improve customer communication');
        suggestions.push('Optimize response times');
      }
    }
    
    if (lowerResponse.includes('performance') || lowerResponse.includes('imikorere')) {
      if (language === 'kinyarwanda') {
        suggestions.push('Suzuma imikorere y\'ubucuruzi');
        suggestions.push('Gereranya n\'abandi bacuruzi');
      } else {
        suggestions.push('Analyze my sales performance');
        suggestions.push('Compare with competitors');
      }
    }
    
    // Add default suggestions if not enough contextual ones
    if (suggestions.length < 2) {
      if (language === 'kinyarwanda') {
        suggestions.push('Nshobora gute kongera ibyaguzwe?');
        suggestions.push('Suzuma imikorere y\'ubucuruzi bwanjye');
        suggestions.push('Nerekere amabwiriza y\'ibicuruzwa');
        suggestions.push('Nfasha mu mahitamo y\'amafaranga');
      } else {
        suggestions.push('How can I increase my sales?');
        suggestions.push('Analyze my store performance');
        suggestions.push('Suggest product improvements');
        suggestions.push('Help with pricing strategy');
      }
    }
    
    return suggestions.slice(0, 4);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private generateFallbackResponse(message: string): { response: string; suggestions: string[]; metadata: any } {
    const lowerMessage = message.toLowerCase();
    const language = this.detectLanguage(message);
    
    // Enhanced fallback responses based on message content
    const isSalesQuery = lowerMessage.includes('sales') || lowerMessage.includes('ibyaguzwe') || lowerMessage.includes('amafaranga');
    const isProductQuery = lowerMessage.includes('product') || lowerMessage.includes('ibicuruzwa') || lowerMessage.includes('gucuruza');
    const isMarketingQuery = lowerMessage.includes('marketing') || lowerMessage.includes('ubwoba') || lowerMessage.includes('kwamamaza');
    const isCustomerQuery = lowerMessage.includes('customer') || lowerMessage.includes('abakiriya') || lowerMessage.includes('serivisi');
    const isPerformanceQuery = lowerMessage.includes('performance') || lowerMessage.includes('imikorere') || lowerMessage.includes('gusuzuma');
    
    if (language === 'kinyarwanda') {
      let response = `Muraho! Ndi Umufasha wawe wa AI w'Ubucuruzi. `;
      let suggestions = [];
      
      if (isSalesQuery) {
        response += `Nshobora gufasha mu kwongera ibyaguzwe by'isitolo yawe. Koresha neza amashusho y'ibicuruzwa, tanga amafaranga meza, kandi koresha uburyo bwo kwamamaza ku mbuga nkoranyambaga.`;
        suggestions = ['Nerekere amahitamo y\'ubwoba', 'Suzuma uburyo bwo guhindura abakiriya', 'Nerekere amahirwe y\'igihe'];
      } else if (isProductQuery) {
        response += `Nshobora gufasha mu gukoresha neza ibicuruzwa byawe. Andika ibisobanuro byiza, koresha amashusho meza, kandi shyiraho amafaranga y'ukuri.`;
        suggestions = ['Suzuma ibisobanuro by\'ibicuruzwa', 'Nerekere amahitamo y\'amafaranga', 'Gereranya n\'abandi bacuruzi'];
      } else if (isMarketingQuery) {
        response += `Nshobora gufasha mu kwamamaza isitolo yawe. Koresha WhatsApp, Facebook, Instagram, kandi tanga amakuru y'ibicuruzwa byawe.`;
        suggestions = ['Nerekere amahitamo y\'ubwoba', 'Koresha neza uburyo bwo kwamamaza', 'Nerekere amahirwe y\'igihe'];
      } else if (isCustomerQuery) {
        response += `Nshobora gufasha mu gukoresha neza serivisi y'abakiriya. Subiza vuba ibibazo, tanga amakuru y'ibicuruzwa, kandi koresha neza amashusho.`;
        suggestions = ['Koresha neza uburyo bwo gusubiza', 'Koresha neza igihe cyo gusubiza', 'Kora ikiganiro cy\'ibibazo'];
      } else if (isPerformanceQuery) {
        response += `Nshobora gufasha mu gusuzuma imikorere y'isitolo yawe. Reba amakuru y'ibyaguzwe, suzuma ibitekerezo by'abakiriya, kandi gereranya n'abandi bacuruzi.`;
        suggestions = ['Suzuma imikorere y\'ubucuruzi', 'Gereranya n\'abandi bacuruzi', 'Nerekere amabwiriza y\'ibicuruzwa'];
      } else {
        response += `Nshobora gufasha mu gukoresha neza isitolo yawe. Nyamuneka vuga ibintu ushaka gufashwa, nanjye nzagutanga amabwiriza yihariye y'ubucuruzi bwawe.`;
        suggestions = ['Nshobora gute kongera ibyaguzwe?', 'Suzuma imikorere y\'ubucuruzi bwanjye', 'Nerekere amabwiriza y\'ibicuruzwa', 'Nfasha mu mahitamo y\'amafaranga'];
      }
      
      return {
        response,
        suggestions,
        metadata: {
          language: 'kinyarwanda',
          aiSource: 'enhanced-fallback-vendor-ai',
          timestamp: new Date().toISOString(),
          vendorFocused: true
        }
      };
    } else {
      let response = `Hello! I'm your AI Business Assistant. `;
      let suggestions = [];
      
      if (isSalesQuery) {
        response += `I can help you increase your store's sales. Focus on optimizing product images, offering competitive pricing, and using social media marketing effectively.`;
        suggestions = ['Show me specific marketing tactics', 'Analyze my conversion funnel', 'Suggest seasonal promotions'];
      } else if (isProductQuery) {
        response += `I can help you optimize your products. Write compelling descriptions, use high-quality images, and set competitive prices based on market research.`;
        suggestions = ['Review my product descriptions', 'Suggest pricing strategies', 'Analyze competitor pricing'];
      } else if (isMarketingQuery) {
        response += `I can help you market your store effectively. Use social media platforms, create engaging content, and build strong customer relationships.`;
        suggestions = ['Show me social media strategies', 'Help with promotional campaigns', 'Create customer loyalty programs'];
      } else if (isCustomerQuery) {
        response += `I can help you improve customer service. Respond quickly to inquiries, provide detailed product information, and maintain high service standards.`;
        suggestions = ['Improve customer communication', 'Optimize response times', 'Create FAQ section'];
      } else if (isPerformanceQuery) {
        response += `I can help you analyze your store's performance. Review sales data, analyze customer feedback, and compare with competitors.`;
        suggestions = ['Analyze my sales performance', 'Review customer feedback', 'Compare with competitors'];
      } else {
        response += `I can help you optimize your store performance, improve your products, develop marketing strategies, and grow your business. Please let me know what specific area you'd like help with.`;
        suggestions = ['How can I increase my sales?', 'Analyze my store performance', 'Suggest product improvements', 'Help with pricing strategy'];
      }
      
      return {
        response,
        suggestions,
        metadata: {
          language: 'english',
          aiSource: 'enhanced-fallback-vendor-ai',
          timestamp: new Date().toISOString(),
          vendorFocused: true
        }
      };
    }
  }

  // Clear conversation history for a user
  public clearConversationHistory(userId: string): void {
    this.conversationMemory.delete(userId);
  }

  // Get conversation statistics
  public getConversationStats(userId: string): any {
    const history = this.getConversationHistory(userId);
    return {
      messageCount: history.length,
      lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null,
      userMessages: history.filter(msg => msg.role === 'user').length,
      assistantMessages: history.filter(msg => msg.role === 'assistant').length
    };
  }

  // Track analytics for vendor AI interactions
  private trackAnalytics(userId: string, message: string, response: string, metadata: any): void {
    const analyticsKey = userId || 'anonymous';
    const currentAnalytics = this.analyticsData.get(analyticsKey) || {
      totalInteractions: 0,
      totalMessages: 0,
      languageUsage: { english: 0, kinyarwanda: 0 },
      topicFrequency: {},
      responseTimes: [],
      satisfactionScores: [],
      lastInteraction: null,
      firstInteraction: null
    };

    // Update analytics
    currentAnalytics.totalInteractions += 1;
    currentAnalytics.totalMessages += 1;
    currentAnalytics.languageUsage[metadata.language] = (currentAnalytics.languageUsage[metadata.language] || 0) + 1;
    
    // Track topics
    const topics = this.extractTopics(message);
    topics.forEach(topic => {
      currentAnalytics.topicFrequency[topic] = (currentAnalytics.topicFrequency[topic] || 0) + 1;
    });

    // Track response time (if available)
    if (metadata.responseTime) {
      currentAnalytics.responseTimes.push(metadata.responseTime);
    }

    // Update timestamps
    currentAnalytics.lastInteraction = new Date().toISOString();
    if (!currentAnalytics.firstInteraction) {
      currentAnalytics.firstInteraction = new Date().toISOString();
    }

    this.analyticsData.set(analyticsKey, currentAnalytics);
  }

  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    const topicKeywords = {
      'sales': ['sales', 'revenue', 'ibyaguzwe', 'amafaranga'],
      'products': ['product', 'inventory', 'ibicuruzwa', 'gucuruza'],
      'marketing': ['marketing', 'promotion', 'ubwoba', 'kwamamaza'],
      'customers': ['customer', 'service', 'abakiriya', 'serivisi'],
      'performance': ['performance', 'analytics', 'imikorere', 'gusuzuma'],
      'pricing': ['pricing', 'price', 'cost', 'amafaranga'],
      'growth': ['growth', 'expansion', 'gutezimbere', 'kwiyongera']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  // Get analytics data for a user
  public getAnalytics(userId: string): any {
    const analyticsKey = userId || 'anonymous';
    const analytics = this.analyticsData.get(analyticsKey);
    
    if (!analytics) {
      return {
        totalInteractions: 0,
        totalMessages: 0,
        languageUsage: { english: 0, kinyarwanda: 0 },
        topicFrequency: {},
        averageResponseTime: 0,
        satisfactionScore: 0,
        lastInteraction: null,
        firstInteraction: null
      };
    }

    // Calculate derived metrics
    const averageResponseTime = analytics.responseTimes.length > 0 
      ? analytics.responseTimes.reduce((sum, time) => sum + time, 0) / analytics.responseTimes.length 
      : 0;

    const satisfactionScore = analytics.satisfactionScores.length > 0
      ? analytics.satisfactionScores.reduce((sum, score) => sum + score, 0) / analytics.satisfactionScores.length
      : 0;

    return {
      ...analytics,
      averageResponseTime: Math.round(averageResponseTime),
      satisfactionScore: Math.round(satisfactionScore * 100) / 100,
      topTopics: Object.entries(analytics.topicFrequency)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }))
    };
  }

  // Record user feedback
  public recordFeedback(userId: string, messageId: string, feedback: 'like' | 'dislike'): void {
    const analyticsKey = userId || 'anonymous';
    const currentAnalytics = this.analyticsData.get(analyticsKey) || {
      satisfactionScores: []
    };

    const score = feedback === 'like' ? 1 : 0;
    currentAnalytics.satisfactionScores.push(score);

    this.analyticsData.set(analyticsKey, currentAnalytics);
  }

  // Get global analytics (for admin purposes)
  public getGlobalAnalytics(): any {
    const allAnalytics = Array.from(this.analyticsData.values());
    
    if (allAnalytics.length === 0) {
      return {
        totalUsers: 0,
        totalInteractions: 0,
        averageSatisfaction: 0,
        mostPopularTopics: [],
        languageDistribution: { english: 0, kinyarwanda: 0 }
      };
    }

    const totalUsers = this.analyticsData.size;
    const totalInteractions = allAnalytics.reduce((sum, analytics) => sum + analytics.totalInteractions, 0);
    
    const allSatisfactionScores = allAnalytics.flatMap(analytics => analytics.satisfactionScores || []);
    const averageSatisfaction = allSatisfactionScores.length > 0 
      ? allSatisfactionScores.reduce((sum, score) => sum + score, 0) / allSatisfactionScores.length 
      : 0;

    // Aggregate topic frequency
    const globalTopicFrequency: { [key: string]: number } = {};
    allAnalytics.forEach(analytics => {
      Object.entries(analytics.topicFrequency || {}).forEach(([topic, count]) => {
        globalTopicFrequency[topic] = (globalTopicFrequency[topic] || 0) + (count as number);
      });
    });

    const mostPopularTopics = Object.entries(globalTopicFrequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // Aggregate language usage
    const languageDistribution = allAnalytics.reduce((acc, analytics) => {
      acc.english += analytics.languageUsage?.english || 0;
      acc.kinyarwanda += analytics.languageUsage?.kinyarwanda || 0;
      return acc;
    }, { english: 0, kinyarwanda: 0 });
    
    return {
      totalUsers,
      totalInteractions,
      averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
      mostPopularTopics,
      languageDistribution
    };
  }
}
