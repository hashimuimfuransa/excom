import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { geminiChat } from './aiService';
import Product from '../models/Product';

interface VoiceMessage {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isUser: boolean;
  audioData?: string; // Base64 encoded audio
}

interface VoiceSession {
  userId?: string;
  messages: VoiceMessage[];
  currentLanguage: string;
  isActive: boolean;
  lastActivity: Date;
}

class VoiceWebSocketService {
  private io: SocketIOServer;
  private sessions: Map<string, VoiceSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor(io: SocketIOServer) {
    this.io = io;

    this.setupEventHandlers();
    this.startSessionCleanup();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Voice WebSocket: Client connected - ${socket.id}`);

      // Initialize voice session
      socket.on('init-voice-session', (data) => {
        const { userId, language = 'en' } = data;
        const session: VoiceSession = {
          userId,
          messages: [],
          currentLanguage: language,
          isActive: true,
          lastActivity: new Date()
        };
        
        this.sessions.set(socket.id, session);
        socket.emit('session-initialized', { 
          sessionId: socket.id, 
          language,
          message: 'Voice session initialized successfully'
        });
        
        console.log(`Voice session initialized for ${socket.id} (user: ${userId})`);
      });

      // Handle voice message
      socket.on('voice-message', async (data) => {
        const session = this.sessions.get(socket.id);
        if (!session) {
          socket.emit('error', { message: 'No active voice session' });
          return;
        }

        const { text, audioData, language } = data;
        if (!text || !text.trim()) {
          socket.emit('error', { message: 'Empty message received' });
          return;
        }

        session.lastActivity = new Date();
        session.currentLanguage = language || session.currentLanguage;

        // Add user message to session
        const userMessage: VoiceMessage = {
          id: Date.now().toString(),
          text: text.trim(),
          language: session.currentLanguage,
          timestamp: new Date(),
          isUser: true,
          audioData
        };

        session.messages.push(userMessage);

        // Emit user message to client
        socket.emit('message-received', {
          message: userMessage,
          status: 'processing'
        });

        try {
          // Get product catalog for context
          const products = await Product.find().populate('seller', 'name').limit(50);
          const productCatalog = products.map(p => ({
            id: (p._id as any).toString(),
            title: p.title,
            description: p.description,
            price: p.price,
            category: p.category,
            seller: (p.seller as any)?.name || 'ExCom Seller'
          }));

          // Enhanced system prompt for real-time voice interactions with comprehensive Kinyarwanda support
          const systemPrompt = `You are an intelligent real-time voice shopping assistant for ExCom. You communicate naturally and conversationally in real-time.

**REAL-TIME VOICE INTERACTION GUIDELINES:**
1. Keep responses concise and natural for speech (under 80 words)
2. Use conversational tone - speak like a helpful friend
3. Respond in the same language as the user (${session.currentLanguage})
4. For Kinyarwanda: Use simple, clear language with common phrases
5. Always prioritize product recommendations from our catalog
6. Use natural speech patterns, not formal writing
7. Be responsive and helpful in real-time

**COMPREHENSIVE KINYARWANDA VOICE RESPONSES:**
- Use common greetings: "Muraho", "Murakoze", "Murabeho", "Amakuru"
- Use helpful phrases: "Ndagufasha", "Nshobora gufasha", "Nibaza", "Nkunda"
- Use shopping vocabulary: "ibicuruzwa" (products), "amafaranga" (money), "gucuruza" (to sell), "gura" (to buy)
- Use descriptive words: "byiza" (good), "make" (cheap), "byinshi" (many), "byose" (all)
- Use numbers: "rimwe" (one), "kabiri" (two), "gatatu" (three), "kane" (four), "gatanu" (five)
- Use product categories: "imyenda" (clothes), "ibikoresho" (tools), "ibiribwa" (food), "ibinyobwa" (drinks)
- Use common expressions: "yego" (yes), "oya" (no), "ntibyiza" (not good), "ni byiza" (it's good)
- Examples of natural responses:
  * "Muraho! Ndagufasha gusanga ibicuruzwa byiza. Nshobora kureba ibicuruzwa bya ${text}"
  * "Nerekere amafaranga make y'ibicuruzwa bya ${text}"
  * "Nshobora kugura iki? Ndagufasha gusanga ibyiza"
  * "Murakoze gufasha! Nshaka ibicuruzwa byiza"

**ENGLISH VOICE RESPONSES:**
- Use friendly, conversational tone
- Keep it simple and direct
- Use phrases like "I can help you find", "Let me show you", "Here's what I found"
- Examples: "Hi! I can help you find great products. Let me search for ${text}"

**CURRENT EXCOM PRODUCT CATALOG:**
${productCatalog.map(p => `ID: ${p.id} | ${p.title} - $${p.price} | ${p.category} | Seller: ${p.seller}`).join('\n')}

**CONVERSATION HISTORY:**
${session.messages.slice(-5).map(m => `${m.isUser ? 'User' : 'AI'}: ${m.text}`).join('\n')}

**RESPONSE FORMAT:**
- Start with a brief greeting in the appropriate language
- Provide 1-3 specific product recommendations if relevant
- End with a question to keep the conversation going
- Keep total response under 80 words for optimal real-time voice experience
- Use product ID format: "ID: [product_id]" for recommendations

Remember: This is a real-time voice conversation - be natural, helpful, and concise!`;

          // Generate AI response
          const aiResponse = await geminiChat(text, {
            voiceMode: true,
            realTime: true,
            language: session.currentLanguage,
            systemPrompt,
            conversationHistory: session.messages.slice(-5)
          });

          // Add AI message to session
          const aiMessage: VoiceMessage = {
            id: (Date.now() + 1).toString(),
            text: aiResponse,
            language: session.currentLanguage,
            timestamp: new Date(),
            isUser: false
          };

          session.messages.push(aiMessage);

          // Extract product recommendations
          const productIdRegex = /ID:\s*([a-fA-F0-9]{24})/g;
          const productIds: string[] = [];
          let match;
          
          while ((match = productIdRegex.exec(aiResponse)) !== null) {
            productIds.push(match[1]);
          }

          // Fetch recommended products
          let recommendedProducts = [];
          if (productIds.length > 0) {
            try {
              recommendedProducts = await Product.find({
                _id: { $in: productIds }
              }).populate('seller', 'name').limit(3);
            } catch (error) {
              console.error('Error fetching recommended products:', error);
            }
          }

          // Emit AI response to client
          socket.emit('ai-response', {
            message: aiMessage,
            recommendedProducts: recommendedProducts.map(p => p.toObject()),
            hasProductRecommendations: productIds.length > 0,
            language: session.currentLanguage
          });

          console.log(`Voice AI response sent to ${socket.id}: ${aiResponse.substring(0, 100)}...`);

        } catch (error) {
          console.error('Voice AI error:', error);
          
          const errorMessage: VoiceMessage = {
            id: (Date.now() + 1).toString(),
            text: session.currentLanguage === 'rw' 
              ? 'Nkaba ikangaye, nfite ikibazo mu gukora icyo usaba. Gerageza nanone.'
              : 'Sorry, I\'m having trouble right now. Please try again.',
            language: session.currentLanguage,
            timestamp: new Date(),
            isUser: false
          };

          session.messages.push(errorMessage);
          socket.emit('ai-response', {
            message: errorMessage,
            recommendedProducts: [],
            hasProductRecommendations: false,
            language: session.currentLanguage
          });
        }
      });

      // Handle language change
      socket.on('change-language', (data) => {
        const session = this.sessions.get(socket.id);
        if (session) {
          session.currentLanguage = data.language;
          session.lastActivity = new Date();
          
          socket.emit('language-changed', {
            language: data.language,
            message: data.language === 'rw' 
              ? 'Ururimi rwahinduwe mu Kinyarwanda'
              : 'Language changed to English'
          });
          
          console.log(`Language changed to ${data.language} for ${socket.id}`);
        }
      });

      // Handle audio streaming
      socket.on('audio-stream', (data) => {
        const session = this.sessions.get(socket.id);
        if (session) {
          session.lastActivity = new Date();
          // Process audio stream if needed
          socket.emit('audio-received', { status: 'processing' });
        }
      });

      // Handle session end
      socket.on('end-session', () => {
        this.sessions.delete(socket.id);
        socket.emit('session-ended', { message: 'Voice session ended' });
        console.log(`Voice session ended for ${socket.id}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.sessions.delete(socket.id);
        console.log(`Voice WebSocket: Client disconnected - ${socket.id}`);
      });
    });
  }

  private startSessionCleanup() {
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
          this.sessions.delete(sessionId);
          console.log(`Cleaned up expired voice session: ${sessionId}`);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public getSessionInfo(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToSession(sessionId: string, event: string, data: any) {
    this.io.to(sessionId).emit(event, data);
  }
}

export default VoiceWebSocketService;
