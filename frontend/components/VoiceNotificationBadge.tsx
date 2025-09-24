"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Bell } from 'lucide-react';

interface VoiceNotificationBadgeProps {
  onEnableVoice: () => void;
}

export default function VoiceNotificationBadge({ onEnableVoice }: VoiceNotificationBadgeProps) {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if voice features are supported
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    
    setIsSupported(speechRecognitionSupported && speechSynthesisSupported);
    
    // Show notification badge for users who haven't enabled voice
    const voiceEnabled = localStorage.getItem('excom_voice_enabled');
    const badgeDismissed = localStorage.getItem('excom_voice_badge_dismissed');
    
    if (speechRecognitionSupported && speechSynthesisSupported && !voiceEnabled && !badgeDismissed) {
      setTimeout(() => {
        setIsVisible(true);
      }, 5000); // Show after 5 seconds
    }
  }, []);

  const handleEnable = () => {
    localStorage.setItem('excom_voice_enabled', 'true');
    onEnableVoice();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('excom_voice_badge_dismissed', 'true');
  };

  if (!isSupported || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-down">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {i18n.language === 'rw' ? '🎤 Gucuruza mu Jwi!' : '🎤 Voice Shopping!'}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {i18n.language === 'rw' 
                ? 'Vuga kugira ngo ugure ibicuruzwa byiza'
                : 'Speak to shop with AI assistance'
              }
            </p>
            
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleEnable}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                {i18n.language === 'rw' ? 'Tangira' : 'Try Now'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {i18n.language === 'rw' ? 'Hanyuma' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
