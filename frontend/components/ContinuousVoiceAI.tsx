"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, VolumeX, X, Languages, Loader2, Wifi, WifiOff, Pause, Play } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ContinuousVoiceAIProps {
  onMessage?: (message: string) => void;
  onClose?: () => void;
}

interface VoiceMessage {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isUser: boolean;
  audioData?: string;
}

export default function ContinuousVoiceAI({ onMessage, onClose }: ContinuousVoiceAIProps) {
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeSocket = () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      socketRef.current = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      socketRef.current.on('connect', () => {
        console.log('Continuous Voice WebSocket connected:', socketRef.current?.id);
        setIsConnected(true);
        setConnectionError('');
        
        // Initialize voice session
        const token = localStorage.getItem('excom_token');
        const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;
        
        socketRef.current?.emit('init-voice-session', {
          userId,
          language: currentLanguage
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('Continuous Voice WebSocket disconnected');
        setIsConnected(false);
        setConnectionError('Connection lost. Please try again.');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Continuous Voice WebSocket connection error:', error);
        setIsConnected(false);
        setConnectionError('Failed to connect to voice service. Please check your connection.');
      });

      socketRef.current.on('session-initialized', (data) => {
        console.log('Continuous voice session initialized:', data);
        setCurrentLanguage(data.language);
      });

      socketRef.current.on('message-received', (data) => {
        console.log('Message received:', data);
        setMessages(prev => [...prev, data.message]);
        setIsProcessing(true);
      });

      socketRef.current.on('ai-response', (data) => {
        console.log('AI response received:', data);
        setMessages(prev => [...prev, data.message]);
        setAiResponse(data.message.text);
        setIsProcessing(false);
        
        // Speak the AI response
        speakText(data.message.text, data.language);
        
        // Call parent callback if provided
        if (onMessage) {
          onMessage(data.message.text);
        }
      });

      socketRef.current.on('language-changed', (data) => {
        console.log('Language changed:', data);
        setCurrentLanguage(data.language);
        i18n.changeLanguage(data.language);
      });

      socketRef.current.on('error', (data) => {
        console.error('Continuous Voice WebSocket error:', data);
        setConnectionError(data.message);
        setIsProcessing(false);
      });
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('end-session');
        socketRef.current.disconnect();
      }
    };
  }, [currentLanguage, i18n, onMessage]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = isContinuousMode;
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
        
        // Send final transcript immediately
        if (finalTranscript.trim() && socketRef.current) {
          handleVoiceMessage(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
        setConnectionError('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
        
        // Restart recognition in continuous mode
        if (isContinuousMode && recognitionRef.current) {
          setTimeout(() => {
            if (isContinuousMode) {
              recognitionRef.current?.start();
            }
          }, 100);
        }
      };
    }
  }, [currentLanguage, isContinuousMode]);

  // Initialize audio context for visualization
  useEffect(() => {
    if (isRecording && audioStream) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      startAudioVisualization();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, audioStream]);

  const startAudioVisualization = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Update visualization (can be enhanced with actual visual elements)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      // Use average for visual feedback
    };

    draw();
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setAudioStream(stream);
      
      if (recognitionRef.current && isConnected) {
        setTranscript('');
        setConnectionError('');
        recognitionRef.current.start();
      } else if (!isConnected) {
        setConnectionError('Not connected to voice service. Please wait...');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setConnectionError('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  const handleVoiceMessage = async (message: string) => {
    if (!message.trim() || !socketRef.current) return;

    try {
      // Send message to WebSocket
      socketRef.current.emit('voice-message', {
        text: message,
        language: currentLanguage,
        audioData: null // Can be enhanced to send audio data
      });

      console.log('Continuous voice message sent:', message);
    } catch (error) {
      console.error('Error sending voice message:', error);
      setConnectionError('Failed to send message. Please try again.');
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

  const toggleContinuousMode = () => {
    setIsContinuousMode(!isContinuousMode);
    if (isRecording) {
      stopRecording();
    }
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'rw' : 'en';
    if (socketRef.current) {
      socketRef.current.emit('change-language', { language: newLanguage });
    }
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('excom_language', newLanguage);
  };

  const handleClose = () => {
    if (socketRef.current) {
      socketRef.current.emit('end-session');
      socketRef.current.disconnect();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {t('voiceAI.title', 'Continuous Voice AI Assistant')}
                </h3>
                <p className="text-sm opacity-90">
                  {t('voiceAI.subtitle', 'Live continuous conversation with AI')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-300" />
                )}
                <span className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                title={t('voiceAI.changeLanguage', 'Change Language')}
              >
                <Languages className="w-5 h-5" />
              </button>
              <button
                onClick={handleClose}
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
                    if (socketRef.current) {
                      socketRef.current.emit('change-language', { language: 'en' });
                    }
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
                    if (socketRef.current) {
                      socketRef.current.emit('change-language', { language: 'rw' });
                    }
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

        {/* Connection Error */}
        {connectionError && (
          <div className="bg-red-50 dark:bg-red-900/30 p-3 border-b border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{connectionError}</p>
          </div>
        )}

        {/* Continuous Mode Toggle */}
        <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Continuous Mode:
            </span>
            <button
              onClick={toggleContinuousMode}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isContinuousMode
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isContinuousMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isContinuousMode 
              ? 'AI will continuously listen and respond to your voice'
              : 'AI will listen only when you press the microphone button'
            }
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {isContinuousMode 
                  ? 'Continuous mode enabled - AI will listen and respond automatically'
                  : 'Start speaking to begin conversation with AI'
                }
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
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
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
              disabled={isProcessing || !isConnected}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } ${isProcessing || !isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isRecording ? (
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
                {isContinuousMode ? 'Continuous listening...' : t('voiceAI.listening', 'Listening...')}
              </p>
            )}
            {isPlaying && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {t('voiceAI.speaking', 'AI is speaking...')}
              </p>
            )}
            {!isProcessing && !isListening && !isPlaying && isConnected && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isContinuousMode 
                  ? 'Ready for continuous conversation'
                  : 'Ready to listen'
                }
              </p>
            )}
            {!isConnected && (
              <p className="text-sm text-red-500 dark:text-red-400">
                Connecting to voice service...
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

          {/* Audio Visualization */}
          {isRecording && (
            <div className="mt-3 flex justify-center space-x-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s'
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
