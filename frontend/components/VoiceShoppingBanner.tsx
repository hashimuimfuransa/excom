"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, X, Volume2, Zap } from 'lucide-react';

interface VoiceShoppingBannerProps {
  onEnableVoice: () => void;
  onDismiss: () => void;
}

export default function VoiceShoppingBanner({ onEnableVoice, onDismiss }: VoiceShoppingBannerProps) {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if voice features are supported
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    
    setIsSupported(speechRecognitionSupported && speechSynthesisSupported);
    
    // Show banner for first-time users or if not enabled
    const hasSeenBanner = localStorage.getItem('excom_voice_banner_seen');
    const voiceEnabled = localStorage.getItem('excom_voice_enabled');
    
    if (speechRecognitionSupported && speechSynthesisSupported && !hasSeenBanner && !voiceEnabled) {
      setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds
    }
  }, []);

  const handleEnable = () => {
    localStorage.setItem('excom_voice_enabled', 'true');
    onEnableVoice();
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('excom_voice_banner_seen', 'true');
    onDismiss();
  };

  if (!isSupported || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {i18n.language === 'rw' ? '🎤 Gucuruza mu Jwi!' : '🎤 Voice Shopping!'}
              </h3>
              <p className="text-sm opacity-90">
                {i18n.language === 'rw' 
                  ? 'Vuga kugira ngo ugure ibicuruzwa byiza na AI'
                  : 'Speak to shop with AI - Try it now!'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEnable}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <Zap className="w-4 h-4" />
              <span>{i18n.language === 'rw' ? 'Tangira' : 'Try Now'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick features */}
        <div className="mt-3 flex items-center space-x-4 text-xs opacity-80">
          <div className="flex items-center space-x-1">
            <Mic className="w-3 h-3" />
            <span>{i18n.language === 'rw' ? 'Ijwi' : 'Voice'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Volume2 className="w-3 h-3" />
            <span>{i18n.language === 'rw' ? 'Gusubiza' : 'Response'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🌐</span>
            <span>{i18n.language === 'rw' ? 'Ururimi rwose' : 'Multi-Language'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
