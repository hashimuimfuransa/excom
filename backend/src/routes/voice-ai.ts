import { Router } from 'express';
import { geminiChat } from '../services/aiService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Voice chat endpoint
router.post('/voice-chat', async (req, res) => {
  try {
    const { message, language, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Voice AI: Received message - "${message}" in ${language}`);

    // Detect language if not provided
    const detectedLanguage = detectLanguage(message) || language || 'en';
    
    // Enhanced system prompt for voice interactions
    const systemPrompt = `You are an intelligent voice shopping assistant for ExCom. You communicate naturally and conversationally.

    **VOICE INTERACTION GUIDELINES:**
    1. Keep responses concise and natural for speech (under 100 words)
    2. Use conversational tone - speak like a helpful friend
    3. Respond in the same language as the user (${detectedLanguage})
    4. For Kinyarwanda: Use simple, clear language
    5. Always prioritize product recommendations from our catalog
    6. Use natural speech patterns, not formal writing

    **KINYARWANDA VOICE RESPONSES:**
    - Use common phrases: "Muraho", "Ndagufasha", "Nibaza", "Nkunda"
    - Keep sentences short and clear
    - Use familiar terms: "ibicuruzwa" (products), "amafaranga" (money), "byiza" (good)

    **ENGLISH VOICE RESPONSES:**
    - Use friendly, conversational tone
    - Keep it simple and direct
    - Use phrases like "I can help you find", "Let me show you", "Here's what I found"

    **CURRENT EXCOM PRODUCT CATALOG:**
    ${await getProductCatalog()}

    **RESPONSE FORMAT:**
    - Start with a brief greeting in the appropriate language
    - Provide 1-3 specific product recommendations if relevant
    - End with a question to keep the conversation going
    - Keep total response under 100 words for optimal voice experience

    Remember: This is a voice conversation - be natural, helpful, and concise!`;

    const result = await geminiChat(message, {
      ...context,
      voiceMode: true,
      language: detectedLanguage,
      systemPrompt
    });
    
    res.json({ 
      reply: result,
      detectedLanguage,
      voiceOptimized: true
    });
  } catch (error) {
    console.error('Voice AI error:', error);
    res.status(500).json({ 
      error: 'Voice AI service temporarily unavailable',
      reply: language === 'rw' 
        ? 'Nkaba ikangaye, nfite ikibazo mu gukora icyo usaba. Gerageza nanone.'
        : 'Sorry, I\'m having trouble right now. Please try again.'
    });
  }
});

// Translation endpoint
router.post('/translate', async (req, res) => {
  try {
    const { text, fromLanguage, toLanguage } = req.body;
    
    if (!text || !fromLanguage || !toLanguage) {
      return res.status(400).json({ error: 'Text, fromLanguage, and toLanguage are required' });
    }

    console.log(`Translation: ${fromLanguage} -> ${toLanguage}`);

    // Simple translation mapping for common shopping terms
    const translations = getTranslationMap();
    const translationKey = `${fromLanguage}-${toLanguage}`;
    
    let translatedText = text;
    
    if (translations[translationKey]) {
      // Apply word-by-word translations for common terms
      Object.entries(translations[translationKey]).forEach(([original, translated]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        translatedText = translatedText.replace(regex, translated);
      });
    }

    res.json({ 
      translatedText,
      fromLanguage,
      toLanguage,
      confidence: 0.8
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});

// Language detection helper
function detectLanguage(text: string): string | null {
  // Simple language detection based on common words
  const kinyarwandaWords = [
    'muraho', 'ndagufasha', 'ibicuruzwa', 'amafaranga', 'byiza', 'gura', 
    'shakisha', 'nkunda', 'nibaza', 'murakoze', 'yego', 'oya', 'niba',
    'kugura', 'gucuruza', 'ibintu', 'byinshi', 'byose', 'ryose'
  ];
  
  const englishWords = [
    'hello', 'help', 'products', 'money', 'good', 'buy', 'search', 'like',
    'please', 'thank', 'yes', 'no', 'if', 'shopping', 'things', 'many', 'all'
  ];

  const lowerText = text.toLowerCase();
  
  const kinyarwandaCount = kinyarwandaWords.filter(word => 
    lowerText.includes(word)
  ).length;
  
  const englishCount = englishWords.filter(word => 
    lowerText.includes(word)
  ).length;

  if (kinyarwandaCount > englishCount && kinyarwandaCount > 0) {
    return 'rw';
  } else if (englishCount > 0) {
    return 'en';
  }
  
  return null;
}

// Get product catalog for AI context
async function getProductCatalog(): Promise<string> {
  try {
    const Product = require('../models/Product').default;
    const products = await Product.find().populate('seller', 'name').limit(20);
    
    return products.map(p => 
      `${p.title} - $${p.price} (${p.category})`
    ).join('\n');
  } catch (error) {
    console.error('Error fetching product catalog:', error);
    return 'Product catalog temporarily unavailable';
  }
}

// Translation mappings
function getTranslationMap() {
  return {
    'en-rw': {
      'hello': 'muraho',
      'help': 'ndagufasha',
      'products': 'ibicuruzwa',
      'money': 'amafaranga',
      'good': 'byiza',
      'buy': 'gura',
      'search': 'shakisha',
      'like': 'nkunda',
      'please': 'nyamuneka',
      'thank you': 'murakoze',
      'yes': 'yego',
      'no': 'oya',
      'shopping': 'gucuruza',
      'price': 'ikiguzi',
      'cheap': 'byihuse',
      'expensive': 'byinshi',
      'find': 'gushakisha',
      'show': 'kwerekana',
      'recommend': 'gutanga ibyemezo'
    },
    'rw-en': {
      'muraho': 'hello',
      'ndagufasha': 'help',
      'ibicuruzwa': 'products',
      'amafaranga': 'money',
      'byiza': 'good',
      'gura': 'buy',
      'shakisha': 'search',
      'nkunda': 'like',
      'nyamuneka': 'please',
      'murakoze': 'thank you',
      'yego': 'yes',
      'oya': 'no',
      'gucuruza': 'shopping',
      'ikiguzi': 'price',
      'byihuse': 'cheap',
      'byinshi': 'expensive',
      'gushakisha': 'find',
      'kwerekana': 'show',
      'gutanga ibyemezo': 'recommend'
    }
  };
}

export default router;
