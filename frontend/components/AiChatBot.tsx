"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Stack,
  Avatar,
  Chip,
  Button,
  Card,
  CardContent,
  CardMedia,
  Fade,
  Zoom,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  ShoppingCart as CartIcon,
  Compare as CompareIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  AutoAwesome as AiIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import { apiPost } from '@utils/api';
import { getMainImage } from '@utils/imageHelpers';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { kinyarwandaTTS, TTSVoice } from '../services/kinyarwandaTTS';
import KinyarwandaVoiceSelector from './KinyarwandaVoiceSelector';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any; // For structured data like product recommendations
}

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  recommendationReason?: string;
  recommendationScore?: number;
}

interface AiChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  position?: 'bottom-right' | 'bottom-left';
}

const PREDEFINED_PROMPTS = [
  { text: "🛍️ Find me the best deals today", key: "ai.prompts.bestDeals" },
  { text: "💡 Recommend products based on my purchases", key: "ai.prompts.recommendations" },
  { text: "⚖️ Compare these products for quality", key: "ai.prompts.compare" },
  { text: "🎯 What's trending in electronics?", key: "ai.prompts.trending" },
  { text: "💰 Show me budget-friendly options", key: "ai.prompts.budget" },
  { text: "⭐ Find highly rated products", key: "ai.prompts.rated" }
];

export default function AiChatBot({ isOpen, onToggle, position = 'bottom-right' }: AiChatBotProps) {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: t('ai.welcomeMessage', 'Hi! I\'m your AI shopping assistant. I can help you find products, compare prices, and make smart shopping decisions. What are you looking for today?'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  
  // Voice-related state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [lastMessageWasVoice, setLastMessageWasVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Enhanced Kinyarwanda voice state
  const [kinyarwandaVoice, setKinyarwandaVoice] = useState<TTSVoice | null>(null);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [isVoiceCallMode, setIsVoiceCallMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted for immediate AI voice
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize WebSocket for voice calls
  const initializeVoiceWebSocket = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current.on('connect', () => {
      console.log('Voice WebSocket connected:', socketRef.current?.id);
      setIsConnected(true);
      setConnectionError('');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Voice WebSocket disconnected');
      setIsConnected(false);
      setConnectionError('Connection lost. Please try again.');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Voice WebSocket connection error:', error);
      setIsConnected(false);
      setConnectionError('Failed to connect to voice service.');
    });

    socketRef.current.on('ai-response', (data) => {
      console.log('AI response received:', data);
      const responseMessage = data.message.text;
      
      // Add AI response to messages
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: responseMessage,
        timestamp: new Date(),
        isVoice: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsProcessing(false);
      
      // Speak the response using Kinyarwanda TTS (unless muted)
      if (responseMessage && !isMuted) {
        speakText(responseMessage);
        
        // Auto-restart listening after AI finishes speaking
        if (isContinuousListening) {
          setTimeout(() => {
            if (!isSpeaking && !isProcessing) {
              startContinuousListening();
            }
          }, 2000); // Wait 2 seconds after AI starts speaking
        }
      }
    });

    socketRef.current.on('error', (data) => {
      console.error('Voice WebSocket error:', data);
      setConnectionError(data.message);
      setIsProcessing(false);
    });
  };

  // Enhanced speak function with Kinyarwanda support
  const speakText = async (text: string) => {
    console.log('🔊 speakText called with:', text);
    console.log('🔊 isMuted:', isMuted);
    console.log('🔊 speechSynthesis available:', typeof window !== 'undefined' && 'speechSynthesis' in window);
    
    if (!text || isMuted) {
      console.log('🔊 Speech blocked - text empty or muted');
      return; // Don't speak if muted
    }

    // Stop any current speech
    kinyarwandaTTS.stop();
    speechSynthesis.cancel();

    // Detect if text is Kinyarwanda
    const isKinyarwanda = detectKinyarwanda(text);
    console.log('🔊 Detected language - Kinyarwanda:', isKinyarwanda);

    if (isKinyarwanda) {
      console.log('🔊 Using Kinyarwanda TTS');
      // Use enhanced Kinyarwanda TTS
      const processedText = kinyarwandaTTS.preprocessKinyarwandaText(text);
      const voice = kinyarwandaVoice || kinyarwandaTTS.getBestVoice();
      console.log('🔊 Using voice:', voice);
      
      try {
        await kinyarwandaTTS.speak(processedText, {
          voice,
          rate: 0.8,
          pitch: 1.0,
          volume: 0.9,
          onStart: () => {
            console.log('🔊 Kinyarwanda TTS started');
            setIsSpeaking(true);
          },
          onEnd: () => {
            console.log('🔊 Kinyarwanda TTS ended');
            setIsSpeaking(false);
          },
          onError: (error) => {
            console.error('🔊 Kinyarwanda TTS error:', error);
            setIsSpeaking(false);
          }
        });
      } catch (error) {
        console.error('🔊 Kinyarwanda TTS failed:', error);
        setIsSpeaking(false);
      }
    } else {
      console.log('🔊 Using English TTS');
      // Use default browser TTS for English
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        console.log('🔊 English TTS started');
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        console.log('🔊 English TTS ended');
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error('🔊 English TTS error:', event);
        setIsSpeaking(false);
      };

      synthesisRef.current = utterance;
      console.log('🔊 Starting English speech synthesis');
      speechSynthesis.speak(utterance);
    }
  };

  // Enhanced Kinyarwanda text detection
  const detectKinyarwanda = (text: string): boolean => {
    const kinyarwandaWords = [
      // Greetings and common phrases
      'muraho', 'bite', 'murakoze', 'murabeho', 'murakaza', 'murakaza neza',
      'amakuru', 'ni meza', 'ni byiza', 'ni byose', 'ni byiza cyane',
      
      // Pronouns and basic words
      'ni', 'iki', 'icyo', 'iyi', 'iyo', 'nshobora', 'nshaka', 'nkunda', 'nibaza', 
      'ndagufasha', 'ndabizi', 'nshoboye',
      
      // Shopping and commerce vocabulary
      'gufasha', 'isitolo', 'ubucuruzi', 'ibicuruzwa', 'amafaranga', 'gucuruza',
      'abakiriya', 'umucuruzi', 'umukiriya', 'isoko', 'gura', 'ibyaguzwe',
      
      // Descriptive words
      'byiza', 'niba', 'byose', 'make', 'byinshi', 'byiza cyane',
      
      // Numbers
      'rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu', 'gatandatu', 'karindwi',
      'umunani', 'icyenda', 'icumi', 'ijana', 'igihumbi',
      
      // Time and location
      'ubu', 'ejo', 'ejo hazaza', 'ejo hashize', 'noneho', 'hanyuma',
      'mbere', 'nyuma', 'hejuru', 'hasi', 'hariya', 'hano',
      
      // Common expressions
      'yego', 'oya', 'ntibyiza', 'ni byiza',
      
      // Product categories
      'imyenda', 'ibikoresho', 'ibiribwa', 'ibinyobwa', 'ibikoresho by\'ubwoba',
      
      // Additional common words
      'umuntu', 'abantu', 'umugore', 'umwana', 'abana', 'umuryango', 'imiryango', 
      'urugo', 'amazu', 'umudugu', 'imidugudu', 'umujyi', 'imijyi', 'igihugu', 'amahanga'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Check for Kinyarwanda words
    const hasKinyarwandaWords = kinyarwandaWords.some(word => lowerText.includes(word));
    
    // Check for Kinyarwanda phonetic patterns
    const hasKinyarwandaPhonetics = /[rw][aeiou]|[aeiou][rw]|ng[aeiou]|ny[aeiou]|cy[aeiou]|jy[aeiou]/.test(lowerText);
    
    // Check for common Kinyarwanda sentence structures
    const hasKinyarwandaStructure = /^(muraho|nshobora|ndagufasha|murakoze|nshaka|nkunda)/i.test(text.trim());
    
    return hasKinyarwandaWords || hasKinyarwandaPhonetics || hasKinyarwandaStructure;
  };

  // Handle voice call mode toggle
  const toggleVoiceCallMode = () => {
    setIsVoiceCallMode(!isVoiceCallMode);
    if (!isVoiceCallMode) {
      initializeVoiceWebSocket();
      // Enable continuous listening in voice call mode
      setIsContinuousListening(true);
      setConversationActive(true);
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setConnectionError('');
      setIsContinuousListening(false);
      setConversationActive(false);
      // Stop any ongoing speech
      kinyarwandaTTS.stop();
      speechSynthesis.cancel();
    }
  };

  // Start continuous listening for seamless conversation
  const startContinuousListening = () => {
    if (!isVoiceCallMode || !isConnected || isSpeaking || isProcessing) {
      return;
    }

    try {
      if (recognitionRef.current && !isRecording) {
        console.log('Starting continuous listening...');
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting continuous listening:', error);
    }
  };

  // Stop continuous listening
  const stopContinuousListening = () => {
    setIsContinuousListening(false);
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  // Handle voice message via WebSocket
  const handleVoiceMessage = async (text: string) => {
    if (!text.trim() || !socketRef.current) return;

    setIsProcessing(true);
    setVoiceError('');

    try {
      // Initialize voice session if not already done
      if (!socketRef.current.connected) {
        await new Promise<void>((resolve) => {
          socketRef.current?.on('connect', () => resolve());
        });
      }

      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;

      // Initialize session
      socketRef.current.emit('init-voice-session', {
        userId,
        language: 'rw'
      });

      // Send voice message
      socketRef.current.emit('voice-message', {
        text: text,
        language: 'rw',
        audioData: null
      });

      console.log('Voice message sent via WebSocket:', text);

    } catch (error) {
      console.error('Error processing voice input:', error);
      setVoiceError('Failed to process your request. Please try again.');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Load personalized recommendations when chat opens
      loadRecommendations();
    }
  }, [isOpen, isMinimized]);

  // Check microphone permission and initialize voices on component mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(result.state === 'granted');
      } catch (error) {
        // Fallback: try to get permission directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasPermission(true);
          stream.getTracks().forEach(track => track.stop());
        } catch (err) {
          setHasPermission(false);
        }
      }
    };
    
    const initializeVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Select the best voice for English and Kinyarwanda
      const bestVoice = selectBestVoice(voices);
      setSelectedVoice(bestVoice);
    };
    
    checkPermission();
    initializeVoices();
    
    // Listen for voice changes
    speechSynthesis.onvoiceschanged = initializeVoices;
  }, []);

  // Select the best voice for English and Kinyarwanda
  const selectBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    
    // Priority order for voice selection
    const preferredVoices = [
      // High-quality English voices
      'Google UK English Female',
      'Google UK English Male', 
      'Google US English Female',
      'Google US English Male',
      'Microsoft Zira Desktop',
      'Microsoft David Desktop',
      'Microsoft Mark Desktop',
      'Microsoft Susan Desktop',
      'Alex',
      'Samantha',
      'Victoria',
      'Daniel',
      'Moira',
      'Tessa',
      'Veena',
      'Karen',
      'Fiona',
      'Allison',
      'Ava',
      'Tom',
      'Fred',
      'Albert',
      'Bad News',
      'Bahh',
      'Bells',
      'Boing',
      'Bubbles',
      'Cellos',
      'Deranged',
      'Good News',
      'Hysterical',
      'Pipe Organ',
      'Trinoids',
      'Whisper',
      'Zarvox'
    ];
    
    // Find the best available voice
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(preferredName) || 
        v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (voice) {
        console.log(`Selected voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }
    
    // Fallback to first English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      console.log(`Fallback to English voice: ${englishVoice.name}`);
      return englishVoice;
    }
    
    // Final fallback to first available voice
    console.log(`Final fallback voice: ${voices[0].name}`);
    return voices[0];
  };

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;

      const response = await apiPost<{ recommendations: Product[] }>('/ai/recommend', { userId });
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Get user context
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;
      
      const context = {
        userId,
        recentMessages: messages.slice(-5).map(m => `${m.type}: ${m.content}`),
        hasRecommendations: recommendations.length > 0
      };

      const response = await apiPost<{ 
        reply: string; 
        recommendedProducts?: Product[];
        hasProductRecommendations?: boolean;
      }>('/ai/chat', {
        message: content,
        context
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.reply,
        timestamp: new Date(),
        data: response.hasProductRecommendations ? {
          products: response.recommendedProducts || []
        } : undefined
      };

      setMessages(prev => [...prev, botMessage]);

      // If AI found specific products, update recommendations with those
      if (response.recommendedProducts && response.recommendedProducts.length > 0) {
        setRecommendations(response.recommendedProducts);
      } else if (content.toLowerCase().includes('recommend') || content.toLowerCase().includes('suggest')) {
        // Fallback to general recommendations
        await loadRecommendations();
      }

      // Auto-speak AI response (always speak unless muted)
      if (!isMuted) {
        console.log('Auto-speaking AI response');
        setTimeout(() => {
          speakText(response.reply);
        }, 1000); // Wait 1 second for the message to appear
      }
      
      // Reset voice flag if it was set
      if (lastMessageWasVoice) {
        setLastMessageWasVoice(false);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: t('ai.errorMessage', 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Auto-speak error message if the last message was from voice
      if (lastMessageWasVoice) {
        setTimeout(() => {
          speakText(errorMessage.content);
        }, 1000);
        setLastMessageWasVoice(false);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Reset voice flag when sending text message
      setLastMessageWasVoice(false);
      sendMessage();
    }
  };

  // Initialize Kinyarwanda TTS and WebSocket
  useEffect(() => {
    // Initialize Kinyarwanda TTS
    const bestVoice = kinyarwandaTTS.getBestVoice();
    setKinyarwandaVoice(bestVoice);
    
    // Initialize WebSocket for voice calls
    if (isVoiceCallMode) {
      initializeVoiceWebSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isVoiceCallMode]);

  // Auto-start continuous listening when voice call mode is enabled
  useEffect(() => {
    if (isVoiceCallMode && isConnected && isContinuousListening && !isRecording && !isSpeaking && !isProcessing) {
      const timer = setTimeout(() => {
        startContinuousListening();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isVoiceCallMode, isConnected, isContinuousListening, isRecording, isSpeaking, isProcessing]);

  // Voice functionality methods
  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = isVoiceCallMode ? 'rw-RW' : 'en-US';
        recognitionRef.current.maxAlternatives = 5; // Get more alternatives for better Kinyarwanda recognition
        recognitionRef.current.serviceURI = 'https://www.google.com/speech-api/v2/recognize'; // Use Google's speech API
        
        // Enhanced settings for better Kinyarwanda recognition
        if (isVoiceCallMode) {
          recognitionRef.current.grammars = null; // Allow free-form speech
          recognitionRef.current.serviceURI = 'https://www.google.com/speech-api/v2/recognize';
        }

        recognitionRef.current.onstart = () => {
          console.log('Voice recognition started');
          setIsRecording(true);
          setVoiceError('');
        };

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          let bestTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
              finalTranscript += transcript;
              
              // For Kinyarwanda, try to get the best alternative
              if (isVoiceCallMode && result.length > 1) {
                // Look for the best Kinyarwanda match
                for (let j = 0; j < Math.min(result.length, 5); j++) {
                  const altTranscript = result[j].transcript.toLowerCase();
                  const confidence = result[j].confidence || 0;
                  
                  // Enhanced Kinyarwanda word detection
                  const kinyarwandaWords = [
                    'muraho', 'nshobora', 'ndagufasha', 'murakoze', 'amakuru', 'ibicuruzwa', 'amafaranga',
                    'gucuruza', 'isitolo', 'ubucuruzi', 'gufasha', 'nshaka', 'nkunda', 'byiza', 'ni meza',
                    'yego', 'oya', 'ntibyiza', 'ni byiza', 'byose', 'make', 'byinshi', 'byiza cyane',
                    'imyenda', 'ibikoresho', 'ibiribwa', 'ibinyobwa', 'umuntu', 'abantu', 'umugore', 'umwana'
                  ];
                  const hasKinyarwanda = kinyarwandaWords.some(word => altTranscript.includes(word));
                  
                  // Also check for Kinyarwanda phonetics patterns
                  const hasKinyarwandaPhonetics = /[rw][aeiou]|[aeiou][rw]|ng[aeiou]|ny[aeiou]|cy[aeiou]|jy[aeiou]/.test(altTranscript);
                  
                  if ((hasKinyarwanda || hasKinyarwandaPhonetics) && confidence > 0.3) {
                    bestTranscript = result[j].transcript;
                    console.log(`Selected Kinyarwanda alternative ${j}: ${bestTranscript} (confidence: ${confidence})`);
                    break;
                  }
                }
              }
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Show interim results in real-time
          if (interimTranscript) {
            setInput(interimTranscript);
            setTranscribedText(interimTranscript);
          }
          
          // Process final transcript
          if (finalTranscript) {
            const processedTranscript = bestTranscript || finalTranscript;
            console.log('Final transcript:', processedTranscript);
            console.log('Original transcript:', finalTranscript);
            console.log('Best alternative:', bestTranscript);
            
            setInput(processedTranscript);
            setTranscribedText(processedTranscript);
            
            if (isVoiceCallMode) {
              // Use WebSocket for voice call mode with real-time response
              handleVoiceMessage(processedTranscript);
              
              // Auto-restart listening for continuous conversation
              if (isContinuousListening && !isSpeaking) {
                setTimeout(() => {
                  startContinuousListening();
                }, 1000);
              }
            } else {
              // Use regular chat mode
              setLastMessageWasVoice(true);
              setTimeout(() => {
                sendMessage(processedTranscript);
              }, 500);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = 'Speech recognition failed. Please try again.';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking louder.';
              break;
            case 'audio-capture':
              errorMessage = 'Microphone not found. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          setVoiceError(errorMessage);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          console.log('Voice recognition ended');
          setIsRecording(false);
          
          // Auto-restart listening in continuous mode
          if (isContinuousListening && isVoiceCallMode && !isSpeaking && !isProcessing) {
            setTimeout(() => {
              startContinuousListening();
            }, 500);
          }
        };

        recognitionRef.current.onspeechstart = () => {
          console.log('Speech started');
        };

        recognitionRef.current.onspeechend = () => {
          console.log('Speech ended');
          // Stop continuous listening when user stops speaking
          if (isContinuousListening) {
            setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                recognitionRef.current.stop();
              }
            }, 1000); // Wait 1 second after speech ends
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setVoiceError('');
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      setVoiceError('Microphone permission is required for voice input. Please allow microphone access and try again.');
      return false;
    }
  };

  const startRecording = async () => {
    // Clear any previous errors
    setVoiceError('');
    
    // Check if voice recognition is supported
    if (!recognitionRef.current) {
      setVoiceError('Voice recognition not supported on this device. Please use text input instead.');
      return;
    }

    // Request permission if not already granted
    if (!hasPermission) {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        return;
      }
    }

    try {
      // Clear input field for new recording
      setInput('');
      
      // Set language and recognition parameters based on mode
      if (recognitionRef.current) {
        if (isVoiceCallMode) {
          // Enhanced settings for Kinyarwanda recognition
          recognitionRef.current.lang = 'rw-RW';
          recognitionRef.current.maxAlternatives = 5;
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.grammars = null; // Allow free-form speech
        } else {
          // Standard settings for English
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 1;
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
        }
      }
      
      // Start recognition
      recognitionRef.current.start();
      console.log('Starting voice recognition...');
    } catch (error) {
      console.error('Error starting recording:', error);
      setVoiceError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      console.log('Stopping voice recognition...');
      recognitionRef.current.stop();
    }
  };


  // Detect language and process text for better pronunciation
  const detectLanguageAndProcessText = (text: string) => {
    // Common Kinyarwanda words and patterns
    const kinyarwandaPatterns = [
      'muraho', 'murakoze', 'amakuru', 'ni meza', 'sawa', 'yego', 'oya', 'nta',
      'ubwoba', 'urugendo', 'amashanyarazi', 'ibicuruzwa', 'amahirwe', 'gucuruza',
      'shakisha', 'nyereka', 'tanga', 'gerageza', 'nanone', 'byose', 'byose',
      'rwose', 'byose', 'byose', 'byose', 'byose', 'byose', 'byose', 'byose'
    ];
    
    const hasKinyarwanda = kinyarwandaPatterns.some(pattern => 
      text.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Process text for better pronunciation
    let processedText = text
      .replace(/[^\w\s.,!?]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return {
      processedText,
      language: hasKinyarwanda ? 'kinyarwanda' : 'english'
    };
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isOpen) {
    return (
      <Zoom in={!isOpen}>
        <Box
          sx={{
            position: 'fixed',
            [position.includes('right') ? 'right' : 'left']: { xs: 16, sm: 24, md: 24, lg: 32, xl: 40 },
            bottom: { xs: 180, sm: 180, md: 160, lg: 140, xl: 120 }, // Responsive positioning
            zIndex: 1300
          }}
        >
          <Tooltip title={t('ai.tooltipTitle', 'Chat with AI Assistant')} placement="left">
            <IconButton
              data-ai-assistant="true"
              onClick={onToggle}
              sx={{
                width: { xs: 56, sm: 60, md: 64, lg: 68, xl: 72 },
                height: { xs: 56, sm: 60, md: 64, lg: 68, xl: 72 },
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                color: 'white',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 8px 32px rgba(33, 150, 243, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  background: (theme) => theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                    : 'linear-gradient(135deg, #21CBF3 0%, #2196F3 100%)',
                  transform: 'scale(1.1) translateY(-2px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 12px 40px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                    : '0 12px 40px rgba(33, 150, 243, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                },
                animation: 'aiFloat 3s ease-in-out infinite',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '@keyframes aiFloat': {
                  '0%, 100%': {
                    transform: 'translateY(0px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                      : '0 8px 32px rgba(33, 150, 243, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                  },
                  '50%': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 12px 40px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)'
                      : '0 12px 40px rgba(33, 150, 243, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.25)',
                  }
                }
              }}
            >
              <BotIcon sx={{ 
                fontSize: { xs: 28, sm: 30, md: 32, lg: 34, xl: 36 },
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Zoom>
    );
  }

  return (
    <Fade in={isOpen}>
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          [position.includes('right') ? 'right' : 'left']: { xs: 16, sm: 24, md: 24, lg: 32, xl: 40 },
          bottom: { xs: 180, sm: 180, md: 160, lg: 140, xl: 120 }, // Responsive positioning
          width: { 
            xs: 'calc(100vw - 32px)', 
            sm: 'calc(100vw - 48px)', 
            md: 520, 
            lg: 600,
            xl: 700
          },
          height: isMinimized ? 60 : { 
            xs: 'calc(100vh - 180px)', 
            sm: 'calc(100vh - 200px)', 
            md: 'calc(100vh - 180px)',
            lg: 'calc(100vh - 160px)',
            xl: 'calc(100vh - 140px)'
          },
          maxHeight: { 
            xs: 'calc(100vh - 180px)', 
            sm: 'calc(100vh - 200px)', 
            md: 'calc(100vh - 180px)',
            lg: 'calc(100vh - 160px)',
            xl: 'calc(100vh - 140px)'
          },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1300,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(15, 15, 15, 0.95) 0%, rgba(25, 25, 35, 0.95) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 25px 80px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5, md: 3, lg: 3.5, xl: 4 },
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
              : 'linear-gradient(135deg, #2196F3 0%, #21CBF3 50%, #64B5F6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(15px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.25)', 
                width: { xs: 36, sm: 40, md: 44, lg: 48, xl: 52 }, 
                height: { xs: 36, sm: 40, md: 44, lg: 48, xl: 52 },
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <AiIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24, lg: 26, xl: 28 }, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
            </Avatar>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.2rem', xl: '1.3rem' }, 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' 
              }}>
                {t('ai.headerTitle', 'AI Shopping Assistant')}
              </Typography>
              <Typography variant="body2" sx={{ 
                opacity: 0.9, 
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem', lg: '0.85rem', xl: '0.9rem' }, 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' 
              }}>
                {t('ai.headerSubtitle', 'Powered by Gemini AI • Kinyarwanda Support')}
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {!isMinimized && (
          <>
            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 },
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(20, 20, 20, 0.8)' 
                  : 'rgba(248, 249, 250, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                backdropFilter: 'blur(10px)'
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Stack
                    direction={message.type === 'user' ? 'row-reverse' : 'row'}
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ maxWidth: '85%' }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main'
                      }}
                    >
                      {message.type === 'user' ? (
                        <PersonIcon fontSize="small" />
                      ) : (
                        <BotIcon fontSize="small" />
                      )}
                    </Avatar>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          bgcolor: message.type === 'user' 
                            ? 'primary.main' 
                            : (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'white',
                          color: message.type === 'user' 
                            ? 'white' 
                            : (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.9)' 
                              : 'text.primary',
                          borderRadius: 2,
                          borderTopLeftRadius: message.type === 'bot' ? 0 : 2,
                          borderTopRightRadius: message.type === 'user' ? 0 : 2,
                          backdropFilter: 'blur(10px)',
                          border: (theme) => theme.palette.mode === 'dark' && message.type === 'bot'
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : 'none'
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        
                        {/* Speaker button for bot messages */}
                        {message.type === 'bot' && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Tooltip title={isMuted ? t('voiceAI.unmute', 'Unmute AI Voice') : t('voiceAI.mute', 'Mute AI Voice')}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setIsMuted(!isMuted);
                                  if (isSpeaking) {
                                    stopSpeaking();
                                  }
                                }}
                                sx={{
                                  bgcolor: isMuted 
                                    ? (theme) => theme.palette.mode === 'dark' 
                                      ? 'rgba(244, 67, 54, 0.8)' 
                                      : 'error.main'
                                    : (theme) => theme.palette.mode === 'dark' 
                                      ? 'rgba(76, 175, 80, 0.8)' 
                                      : 'success.main',
                                  color: 'white',
                                  width: 28,
                                  height: 28,
                                  '&:hover': {
                                    bgcolor: isMuted 
                                      ? (theme) => theme.palette.mode === 'dark' 
                                        ? 'rgba(244, 67, 54, 1)' 
                                        : 'error.dark'
                                      : (theme) => theme.palette.mode === 'dark' 
                                        ? 'rgba(76, 175, 80, 1)' 
                                        : 'success.dark',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Paper>
                      
                      {/* Inline Product Recommendations */}
                      {message.type === 'bot' && message.data?.products && (
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <CartIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="caption" fontWeight={600} color="primary.main">
                              Recommended Products
                            </Typography>
                          </Stack>
                          <Stack spacing={0.5}>
                            {message.data.products.slice(0, 3).map((product: Product) => (
                              <Card
                                key={product._id}
                                component={NextLink}
                                href={`/product/${product._id}`}
                                sx={{
                                  display: 'flex',
                                  textDecoration: 'none',
                                  maxWidth: 280,
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <CardMedia
                                  component="img"
                                  sx={{ width: 50, height: 50 }}
                                  image={getMainImage(product.images, 'product', product._id)}
                                  alt={product.title}
                                />
                                <CardContent sx={{ flex: 1, py: 0.5, px: 1, '&:last-child': { pb: 0.5 } }}>
                                  <Typography variant="caption" fontWeight={600} noWrap>
                                    {product.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                                      ${product.price.toFixed(2)}
                                    </Typography>
                                    <Chip 
                                      label={product.category} 
                                      size="small" 
                                      variant="outlined" 
                                      sx={{ fontSize: '0.6rem', height: 18 }}
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <TrendingIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Personalized for You
                    </Typography>
                  </Stack>
                  
                  <Stack spacing={1}>
                    {recommendations.slice(0, 3).map((product) => (
                      <Card
                        key={product._id}
                        component={NextLink}
                        href={`/product/${product._id}`}
                        sx={{
                          display: 'flex',
                          textDecoration: 'none',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <CardMedia
                          component="img"
                          sx={{ width: 60, height: 60 }}
                          image={getMainImage(product.images, 'product', product._id)}
                          alt={product.title}
                        />
                        <CardContent sx={{ flex: 1, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {product.title}
                          </Typography>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6" color="primary.main" fontWeight={700}>
                              ${product.price.toFixed(2)}
                            </Typography>
                            {product.recommendationScore && (
                              <Chip
                                label={`${Math.round(product.recommendationScore * 100)}% match`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          {product.recommendationReason && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {product.recommendationReason}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Auto-Speak Indicator */}
              {lastMessageWasVoice && isTyping && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <VolumeUpIcon fontSize="small" sx={{ animation: 'pulse 1.5s infinite' }} />
                    <Typography variant="body2" fontWeight={600}>
                      🔊 AI will speak the response automatically
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Voice Status Display */}
              {isRecording && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      animation: 'pulse 1.5s infinite'
                    }}
                  >
                    <MicIcon fontSize="small" sx={{ animation: 'pulse 1s infinite' }} />
                    <Typography variant="body2" fontWeight={600}>
                      🎤 Listening... Speak now
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Voice Error Display */}
              {voiceError && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(244, 67, 54, 0.3)'
                    }}
                  >
                    <MicOffIcon fontSize="small" />
                    <Typography variant="body2">
                      {voiceError}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setVoiceError('')}
                      sx={{ color: 'error.contrastText', ml: 'auto' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                </Box>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      <BotIcon fontSize="small" />
                    </Avatar>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'white',
                        borderRadius: 2,
                        borderTopLeftRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backdropFilter: 'blur(10px)',
                        border: (theme) => theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.1)' 
                          : 'none'
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {t('ai.thinkingMessage', 'AI is thinking...')}
                      </Typography>
                    </Paper>
                  </Stack>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'white', 
                borderTop: '1px solid', 
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'divider',
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  {t('ai.quickActions', 'Quick Actions:')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {PREDEFINED_PROMPTS.slice(0, 3).map((prompt) => (
                    <Chip
                      key={prompt.key}
                      label={t(prompt.key, prompt.text)}
                      size="small"
                      clickable
                      onClick={() => {
                        // Reset voice flag when using quick actions
                        setLastMessageWasVoice(false);
                        sendMessage(t(prompt.key, prompt.text));
                      }}
                      sx={{
                        fontSize: '0.7rem',
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(33, 150, 243, 0.1)',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.9)' 
                          : 'primary.main',
                        border: (theme) => theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255, 255, 255, 0.2)' 
                          : '1px solid rgba(33, 150, 243, 0.2)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { 
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.2)' 
                            : 'rgba(33, 150, 243, 0.2)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Input */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 },
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'white',
                borderTop: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'divider',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                backdropFilter: 'blur(10px)'
              }}
            >
              <TextField
                ref={inputRef}
                fullWidth
                multiline
                maxRows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('ai.inputPlaceholder', 'Ask me anything about products, prices, or recommendations...')}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    backdropFilter: 'blur(10px)',
                    border: (theme) => theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.2)' 
                        : '1px solid rgba(0, 0, 0, 0.2)',
                    },
                    '&.Mui-focused': {
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '2px solid rgba(102, 126, 234, 0.5)' 
                        : '2px solid rgba(33, 150, 243, 0.5)',
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'text.primary',
                    '&::placeholder': {
                      color: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.6)' 
                        : 'text.secondary',
                      opacity: 1
                    }
                  }
                }}
              />
              {/* Enhanced Voice Button */}
              <Tooltip title={
                isRecording 
                  ? t('voiceAI.stopRecording', 'Stop Recording') 
                  : hasPermission 
                    ? t('voiceAI.startRecording', 'Start Voice Input')
                    : t('voiceAI.grantPermission', 'Grant Microphone Permission')
              }>
                <Box sx={{ position: 'relative', mr: 1 }}>
                  <IconButton
                    onClick={handleVoiceClick}
                    disabled={isTyping}
              sx={{
                bgcolor: isRecording 
                  ? (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(244, 67, 54, 0.9)' 
                    : 'error.main'
                  : !hasPermission
                    ? (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 152, 0, 0.8)' 
                      : 'warning.main'
                    : (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(76, 175, 80, 0.9)' 
                      : 'success.main',
                color: 'white',
                width: { xs: 36, sm: 38, md: 40, lg: 42, xl: 44 },
                height: { xs: 36, sm: 38, md: 40, lg: 42, xl: 44 },
                      '&:hover': {
                        bgcolor: isRecording 
                          ? (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(244, 67, 54, 1)' 
                            : 'error.dark'
                          : !hasPermission
                            ? (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(255, 152, 0, 1)' 
                              : 'warning.dark'
                            : (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(76, 175, 80, 1)' 
                              : 'success.dark',
                        transform: 'scale(1.1)'
                      },
                      '&:disabled': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'grey.300',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'grey.500'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)',
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.1)' 
                        : 'none',
                      animation: isRecording ? 'voice-pulse 1.5s infinite' : 'none',
                      boxShadow: isRecording 
                        ? '0 0 20px rgba(244, 67, 54, 0.5)' 
                        : !hasPermission
                          ? '0 0 15px rgba(255, 152, 0, 0.3)'
                          : '0 0 15px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    {isRecording ? (
                      <MicOffIcon sx={{ fontSize: { xs: 18, sm: 19, md: 20, lg: 21, xl: 22 } }} />
                    ) : !hasPermission ? (
                      <MicIcon sx={{ fontSize: { xs: 18, sm: 19, md: 20, lg: 21, xl: 22 }, opacity: 0.7 }} />
                    ) : (
                      <MicIcon sx={{ fontSize: { xs: 18, sm: 19, md: 20, lg: 21, xl: 22 } }} />
                    )}
                  </IconButton>
                  
                  {/* Recording indicator ring */}
                  {isRecording && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'error.main',
                        animation: 'voice-pulse 1.5s infinite',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                  
                  {/* Permission indicator */}
                  {!hasPermission && !isRecording && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'warning.main',
                        border: '1px solid white',
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  )}
                </Box>
              </Tooltip>

              {/* Voice Call Mode Toggle */}
              <Tooltip title={isVoiceCallMode ? "Exit Voice Call Mode" : "Enter Voice Call Mode"}>
                <IconButton
                  onClick={toggleVoiceCallMode}
                  sx={{
                    bgcolor: isVoiceCallMode 
                      ? (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(76, 175, 80, 0.8)' 
                        : 'success.main'
                      : (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'grey.300',
                    color: isVoiceCallMode ? 'white' : 'grey.600',
                    '&:hover': {
                      bgcolor: isVoiceCallMode 
                        ? (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(76, 175, 80, 1)' 
                          : 'success.dark'
                        : (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.2)' 
                          : 'grey.400',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    border: (theme) => theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : 'none'
                  }}
                >
                  {isVoiceCallMode ? (
                    <Box sx={{ position: 'relative' }}>
                      <AiIcon sx={{ fontSize: 20 }} />
                      {isConnected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            border: '1px solid white',
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      )}
                    </Box>
                  ) : (
                    <AiIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Voice Settings Button */}
              <Tooltip title="Voice Settings">
                <IconButton
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'grey.300',
                    color: 'grey.600',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'grey.400',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    border: (theme) => theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : 'none'
                  }}
                >
                  <VolumeUpIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>

              {/* Send Button */}
              <IconButton
                onClick={() => {
                  // Reset voice flag when sending text message
                  setLastMessageWasVoice(false);
                  sendMessage();
                }}
                disabled={!input.trim() || isTyping}
                sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(102, 126, 234, 0.8)' 
                    : 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(102, 126, 234, 1)' 
                      : 'primary.dark',
                    transform: 'scale(1.1)'
                  },
                  '&:disabled': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'grey.300',
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'grey.500'
                  },
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  border: (theme) => theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : 'none'
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}

        {/* Voice Selector Panel */}
        {showVoiceSelector && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <KinyarwandaVoiceSelector
              onVoiceChange={(voice) => {
                setKinyarwandaVoice(voice);
                console.log('Selected Kinyarwanda voice:', voice);
              }}
              onClose={() => setShowVoiceSelector(false)}
            />
          </Box>
        )}

        {/* Voice Call Mode Status */}
        {isVoiceCallMode && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={600}>
              🎤 Voice Call Mode Active {isConnected && '• Connected'}
            </Typography>
            {isContinuousListening && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.9 }}>
                🔄 Continuous listening enabled - Speak naturally!
              </Typography>
            )}
            {conversationActive && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                💬 Real-time conversation active
              </Typography>
            )}
            {connectionError && (
              <Typography variant="caption" color="error.light">
                {connectionError}
              </Typography>
            )}
          </Box>
        )}

      </Paper>
    </Fade>
  );
}