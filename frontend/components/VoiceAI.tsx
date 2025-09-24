"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, VolumeX, X, Languages, Translate } from 'lucide-react';

interface VoiceAIProps {
  onMessage?: (message: string) => void;
  onClose?: () => void;
}

interface VoiceMessage {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isUser: boolean;
}

export default function VoiceAI({ onMessage, onClose }: VoiceAIProps) {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = currentLanguage === 'rw' ? 'rw-RW' : 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
        if (transcript.trim()) {
          handleVoiceMessage(transcript);
        }
      };
    }
  }, [currentLanguage, transcript]);

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      text: message,
      language: currentLanguage,
      timestamp: new Date(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Send message to AI backend
      const response = await fetch('/api/ai/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          language: currentLanguage,
          context: {
            userId: localStorage.getItem('excom_token') ? 
              JSON.parse(atob(localStorage.getItem('excom_token')!.split('.')[1])).userId : undefined,
            recentMessages: messages.slice(-5).map(m => `${m.isUser ? 'user' : 'ai'}: ${m.text}`)
          }
        })
      });

      const data = await response.json();
      
      const aiMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        language: data.detectedLanguage || currentLanguage,
        timestamp: new Date(),
        isUser: false
      };

      setMessages(prev => [...prev, aiMessage]);
      setAiResponse(data.reply);

      // Speak the AI response
      speakText(data.reply, data.detectedLanguage || currentLanguage);

      // Call parent callback if provided
      if (onMessage) {
        onMessage(data.reply);
      }

    } catch (error) {
      console.error('Voice AI error:', error);
      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: t('voiceAI.errorMessage', 'Sorry, I had trouble processing your request. Please try again.'),
        language: currentLanguage,
        timestamp: new Date(),
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string, language: string = currentLanguage) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'rw' ? 'rw-RW' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'rw' : 'en';
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('excom_language', newLanguage);
  };

  const translateMessage = async (message: VoiceMessage) => {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.text,
          fromLanguage: message.language,
          toLanguage: currentLanguage === 'en' ? 'rw' : 'en'
        })
      });

      const data = await response.json();
      
      const translatedMessage: VoiceMessage = {
        ...message,
        text: data.translatedText,
        language: data.toLanguage
      };

      setMessages(prev => 
        prev.map(m => m.id === message.id ? translatedMessage : m)
      );
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {t('voiceAI.title', 'Voice AI Assistant')}
                </h3>
                <p className="text-sm opacity-90">
                  {t('voiceAI.subtitle', 'Speak to shop with AI')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                title={t('voiceAI.changeLanguage', 'Change Language')}
              >
                <Languages className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        {showLanguageSelector && (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('voiceAI.selectLanguage', 'Select Language')}:
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrentLanguage('en');
                    i18n.changeLanguage('en');
                    setShowLanguageSelector(false);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    currentLanguage === 'en'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setCurrentLanguage('rw');
                    i18n.changeLanguage('rw');
                    setShowLanguageSelector(false);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    currentLanguage === 'rw'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Ikinyarwanda
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-60">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('voiceAI.startSpeaking', 'Start speaking to begin shopping with AI')}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.language === 'rw' ? 'Kinyarwanda' : 'English'}
                    </span>
                    {!message.isUser && message.language !== currentLanguage && (
                      <button
                        onClick={() => translateMessage(message)}
                        className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1"
                      >
                        <Translate className="w-3 h-3" />
                        <span>{t('voiceAI.translate', 'Translate')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Voice Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-center space-x-4">
            {/* Recording Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {/* Play/Stop Button */}
            <button
              onClick={isPlaying ? stopSpeaking : () => speakText(aiResponse)}
              disabled={!aiResponse}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isPlaying
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300'
              } ${!aiResponse ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPlaying ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center mt-3">
            {isProcessing && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {t('voiceAI.processing', 'AI is processing your request...')}
              </p>
            )}
            {isListening && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('voiceAI.listening', 'Listening...')}
              </p>
            )}
            {isPlaying && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {t('voiceAI.speaking', 'AI is speaking...')}
              </p>
            )}
            {!isProcessing && !isListening && !isPlaying && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('voiceAI.ready', 'Ready to listen')}
              </p>
            )}
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div className="mt-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{t('voiceAI.heard', 'Heard:')}</span> {transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
