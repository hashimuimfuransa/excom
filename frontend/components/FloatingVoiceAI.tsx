"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, VolumeX, X, Loader2, Wifi, WifiOff, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { kinyarwandaTTS, TTSVoice } from '../services/kinyarwandaTTS';
import KinyarwandaVoiceSelector from './KinyarwandaVoiceSelector';

interface FloatingVoiceAIProps {
  className?: string;
}

export default function FloatingVoiceAI({ className = '' }: FloatingVoiceAIProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const initializeSocket = () => {
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
        setAiResponse(data.message.text);
        setIsProcessing(false);
        
        // Speak the response
        if (data.message.text) {
          speakText(data.message.text);
        }
      });

      socketRef.current.on('error', (data) => {
        console.error('Voice WebSocket error:', data);
        setConnectionError(data.message);
        setIsProcessing(false);
      });
    };

    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = i18n.language === 'rw' ? 'rw-RW' : 'en-US';
        recognitionRef.current.maxAlternatives = i18n.language === 'rw' ? 5 : 1; // More alternatives for Kinyarwanda

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let bestTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              
              // For Kinyarwanda, try to get the best alternative
              if (i18n.language === 'rw' && result.length > 1) {
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
            }
          }
          
          const finalText = bestTranscript || finalTranscript;
          if (finalText) {
            setTranscribedText(finalText);
            handleVoiceSubmit(finalText);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError('Speech recognition failed. Please try again.');
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }

      // Initialize WebSocket when popup is shown
      if (showPopup && !socketRef.current) {
        initializeSocket();
      }

      // Listen for custom event to open voice AI from navbar
      const handleOpenVoiceAI = () => {
        console.log('Opening voice AI from navbar');
        setShowPopup(true);
      };

      // Add event listener
      window.addEventListener('openVoiceAI', handleOpenVoiceAI);
      
      // Also listen for clicks on voice shopping buttons
      const handleVoiceButtonClick = (event: any) => {
        if (event.target.closest('[data-voice-trigger]')) {
          console.log('Voice button clicked');
          setShowPopup(true);
        }
      };

      document.addEventListener('click', handleVoiceButtonClick);

      return () => {
        window.removeEventListener('openVoiceAI', handleOpenVoiceAI);
        document.removeEventListener('click', handleVoiceButtonClick);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (synthesisRef.current) {
          speechSynthesis.cancel();
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [i18n.language, showPopup]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setError('Microphone permission is required for voice shopping.');
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await requestMicrophonePermission();
      if (!hasPermission) return;
    }

    if (!recognitionRef.current) {
      setError('Voice recognition not supported on this device.');
      return;
    }

    try {
      setError('');
      setTranscribedText('');
      setAiResponse('');
      setIsRecording(true);
      console.log('Starting voice recognition...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceSubmit = async (text: string) => {
    if (!text.trim() || !socketRef.current) return;

    setIsProcessing(true);
    setError('');

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
        language: i18n.language
      });

      // Send voice message
      socketRef.current.emit('voice-message', {
        text: text,
        language: i18n.language,
        audioData: null
      });

      console.log('Voice message sent via WebSocket:', text);

      // Navigate to search page with the query
      setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(text)}&voice=true`);
      }, 2000);

    } catch (error) {
      console.error('Error processing voice input:', error);
      setError('Failed to process your request. Please try again.');
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string) => {
    if (!text) return;

    // Stop any current speech
    kinyarwandaTTS.stop();

    // Detect if text is Kinyarwanda
    const isKinyarwanda = i18n.language === 'rw' || detectKinyarwanda(text);

    if (isKinyarwanda) {
      // Use enhanced Kinyarwanda TTS
      const processedText = kinyarwandaTTS.preprocessKinyarwandaText(text);
      const voice = selectedVoice || kinyarwandaTTS.getBestVoice();
      
      await kinyarwandaTTS.speak(processedText, {
        voice,
        rate: 0.8,
        pitch: 1.0,
        volume: 0.9,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('Kinyarwanda TTS error:', error);
          setIsSpeaking(false);
        }
      });
    } else {
      // Use default browser TTS for English
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

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

  const stopSpeaking = () => {
    kinyarwandaTTS.stop();
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setTranscribedText('');
    setAiResponse('');
    setError('');
    setConnectionError('');
    setIsRecording(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    speechSynthesis.cancel();
    
    // Disconnect WebSocket
    if (socketRef.current) {
      socketRef.current.emit('end-session');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return (
    <>
      {/* Floating Microphone Button */}
      <button
        onClick={() => {
          console.log('Floating mic button clicked');
          setShowPopup(true);
        }}
        className={`fixed bottom-20 right-4 z-50 w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 xl:w-22 xl:h-22 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${className}`}
        title={t('voiceAI.voiceShopping', 'Voice Shopping')}
      >
        <Mic className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 group-hover:scale-110 transition-transform" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-30"></div>
        
        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 bg-white rounded-full animate-pulse"></div>
        </div>
      </button>

      {/* Voice AI Popup */}
      {showPopup && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 35%, rgba(236, 72, 153, 0.15) 70%, rgba(0, 0, 0, 0.3) 100%)',
            backdropFilter: 'blur(12px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePopup();
            }
          }}
        >
          {/* Stunning animated background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-80" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
            
            {/* Large floating orbs */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 animate-pulse blur-xl"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-20 animate-pulse blur-xl" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full opacity-10 animate-pulse blur-2xl" style={{animationDelay: '3s'}}></div>
          </div>

          <div 
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-full overflow-hidden transform transition-all duration-700 scale-100 border border-white/20 dark:border-gray-700/50"
            style={{
              maxHeight: '95vh',
              overflowY: 'auto',
              animation: 'popupIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Stunning Header */}
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 md:p-8 lg:p-10 xl:p-12 text-white overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white rounded-full opacity-15 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
                
                {/* Floating sparkles */}
                <div className="absolute top-4 right-8 w-1 h-1 bg-white rounded-full animate-ping opacity-80"></div>
                <div className="absolute top-12 right-16 w-1 h-1 bg-white rounded-full animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute top-8 right-12 w-1 h-1 bg-white rounded-full animate-ping opacity-70" style={{animationDelay: '1.5s'}}></div>
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-lg">
                      <Mic className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" />
                    </div>
                    {/* Glowing ring around mic */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      {t('voiceAI.title', 'Voice AI Assistant')}
                    </h3>
                    <p className="text-base md:text-lg lg:text-xl xl:text-2xl opacity-90 font-medium">
                      {t('voiceAI.subtitle', 'Speak to shop with AI')}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm opacity-80">Ready to help you shop</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                    className="p-4 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm border-2 border-white/30 hover:scale-110 shadow-lg"
                    title="Voice Settings"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  <button
                    onClick={closePopup}
                    className="p-4 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm border-2 border-white/30 hover:scale-110 hover:rotate-90 shadow-lg"
                    title="Close Voice Assistant"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Selector Panel */}
            {showVoiceSelector && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <KinyarwandaVoiceSelector
                  onVoiceChange={(voice) => {
                    setSelectedVoice(voice);
                    console.log('Selected voice:', voice);
                  }}
                  onClose={() => setShowVoiceSelector(false)}
                />
              </div>
            )}

            {/* Beautiful Content Area */}
            <div className="p-6 md:p-8 lg:p-10 xl:p-12 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
              {/* Status Messages */}
              {error && (
                <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-200 rounded-2xl text-sm border border-red-200 dark:border-red-800 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-lg">Error:</span>
                  </div>
                  <p className="mt-2 font-medium">{error}</p>
                </div>
              )}

              {connectionError && (
                <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-800 dark:text-orange-200 rounded-2xl text-sm border border-orange-200 dark:border-orange-800 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <WifiOff className="w-5 h-5" />
                    <span className="font-bold text-lg">Connection Issue:</span>
                  </div>
                  <p className="mt-2 font-medium">{connectionError}</p>
                </div>
              )}

              {isConnected && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-200 rounded-2xl text-sm border border-green-200 dark:border-green-800 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <Wifi className="w-5 h-5" />
                    <span className="font-bold text-lg">Connected:</span>
                  </div>
                  <p className="mt-2 font-medium">Real-time voice AI is ready for live conversation</p>
                </div>
              )}

              {transcribedText && (
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-200 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold">{t('voiceAI.heard', 'Heard:')}</span>
                  </div>
                  <p className="text-lg italic font-medium">"{transcribedText}"</p>
                </div>
              )}

              {isProcessing && (
                <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <span className="text-lg font-bold">{t('voiceAI.processing', 'AI is processing your request...')}</span>
                  </div>
                </div>
              )}

              {aiResponse && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold">AI Response:</span>
                  </div>
                  <p className="text-lg font-medium">{aiResponse}</p>
                </div>
              )}

              {/* Stunning Main Recording Button */}
              <div className="text-center mb-12">
                <div className="relative inline-block">
                  {/* Outer glow rings */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 animate-pulse scale-110"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-20 animate-pulse scale-125" style={{animationDelay: '0.5s'}}></div>
                  
                  <button
                    onClick={handleMicClick}
                    disabled={isProcessing || !isConnected}
                    className={`relative w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isRecording
                        ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-2xl shadow-red-500/60'
                        : 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 shadow-2xl shadow-blue-500/60'
                    } ${isProcessing || !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                    style={{
                      background: isRecording 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                      boxShadow: isRecording 
                        ? '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.3)'
                        : '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 text-white animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 text-white" />
                    ) : (
                      <Mic className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 text-white" />
                    )}
                    
                    {/* Inner glow */}
                    <div className="absolute inset-2 rounded-full bg-white/20 animate-pulse"></div>
                  </button>
                  
                  {/* Recording indicator rings */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping scale-110"></div>
                      <div className="absolute inset-0 rounded-full border-3 border-red-300 animate-pulse scale-120"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-red-200 animate-pulse scale-130" style={{animationDelay: '0.3s'}}></div>
                      <div className="absolute inset-0 rounded-full border border-red-100 animate-pulse scale-140" style={{animationDelay: '0.6s'}}></div>
                    </>
                  )}
                  
                  {/* Floating particles around button */}
                  {!isRecording && !isProcessing && (
                    <>
                      <div className="absolute -top-4 -left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                      <div className="absolute -top-4 -right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute -bottom-4 -left-4 w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
                      <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1.5s'}}></div>
                    </>
                  )}
                </div>
                
                <p className="mt-6 text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-700 dark:text-gray-300 font-bold">
                  {isRecording
                    ? t('voiceAI.listening', '🎤 Listening...')
                    : isProcessing
                    ? t('voiceAI.processing', '🤖 Processing...')
                    : !isConnected
                    ? '🔌 Connecting...'
                    : t('voiceAI.ready', '✨ Ready for live conversation')
                  }
                </p>
                
                {/* Enhanced waveform animation when recording */}
                {isRecording && (
                  <div className="flex justify-center space-x-2 mt-6">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 bg-gradient-to-t from-red-500 to-red-300 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 32 + 16}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s'
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>

              {/* Beautiful Voice Controls */}
              <div className="flex justify-center space-x-4 md:space-x-6 lg:space-x-8 xl:space-x-10 mb-8 md:mb-10 lg:mb-12 xl:mb-14">
                <button
                  onClick={isSpeaking ? stopSpeaking : () => speakText(aiResponse)}
                  disabled={!aiResponse}
                  className={`px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 xl:px-12 xl:py-6 rounded-2xl flex items-center space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-5 transition-all duration-300 font-bold text-base md:text-lg lg:text-xl xl:text-2xl ${
                    isSpeaking
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-2xl shadow-red-500/50 hover:scale-105'
                      : aiResponse
                      ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-800 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-600 shadow-xl hover:scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8" />
                      <span>Stop Speaking</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8" />
                      <span>Replay Response</span>
                    </>
                  )}
                </button>
              </div>

              {/* Stunning Instructions */}
              <div className="text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl p-6 md:p-8 lg:p-10 xl:p-12 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-700 dark:text-gray-300">How to use Voice Shopping</h4>
                </div>
                
                <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-400 font-medium mb-4">
                  {isRecording
                    ? '🎤 Click the microphone again to stop recording'
                    : !isConnected
                    ? '🔌 Connecting to real-time voice service...'
                    : '🎤 Click the microphone to start live conversation with AI'
                  }
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 Try saying:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Find me electronics"</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Show me fashion items"</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🎯 Examples:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Best deals on phones"</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Affordable laptops"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
