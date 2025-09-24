"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff } from 'lucide-react';
import VoiceAI from './VoiceAI';
import VoiceWelcomePopup from './VoiceWelcomePopup';
import VoiceShoppingBanner from './VoiceShoppingBanner';
import VoiceNotificationBadge from './VoiceNotificationBadge';
import VoiceTooltip from './VoiceTooltip';

interface VoiceAITriggerProps {
  className?: string;
}

export default function VoiceAITrigger({ className = '' }: VoiceAITriggerProps) {
  const { t } = useTranslation();
  const [showVoiceAI, setShowVoiceAI] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    // Check if voice features are supported
    const checkSupport = () => {
      const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const speechSynthesisSupported = 'speechSynthesis' in window;
      
      setIsSupported(speechRecognitionSupported && speechSynthesisSupported);
      
      // Show banner for first-time users
      const hasSeenBanner = localStorage.getItem('excom_voice_banner_seen');
      const voiceEnabled = localStorage.getItem('excom_voice_enabled');
      
      if (speechRecognitionSupported && speechSynthesisSupported && !hasSeenBanner && !voiceEnabled) {
        setTimeout(() => {
          setShowBanner(true);
        }, 3000); // Show banner after 3 seconds
      }
    };

    checkSupport();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setShowPermissionPrompt(false);
      setShowVoiceAI(true);
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setShowPermissionPrompt(false);
    }
  };

  const handleVoiceClick = () => {
    if (!isSupported) {
      return;
    }

    if (!hasPermission) {
      setShowPermissionPrompt(true);
    } else {
      setShowVoiceAI(true);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    localStorage.setItem('excom_voice_welcome_seen', 'true');
  };

  const handleEnableVoice = () => {
    handleWelcomeClose();
    handleVoiceClick();
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Voice Shopping Banner */}
      {showBanner && (
        <VoiceShoppingBanner
          onEnableVoice={handleVoiceClick}
          onDismiss={handleBannerDismiss}
        />
      )}

      {/* Voice Notification Badge */}
      <VoiceNotificationBadge onEnableVoice={handleVoiceClick} />

      {/* Voice AI Trigger Button */}
      <VoiceTooltip>
        <button
          onClick={handleVoiceClick}
          className={`fixed bottom-20 right-4 z-40 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group voice-pulse ${className}`}
          title={t('voiceAI.enableVoice', 'Enable Voice Shopping')}
        >
          <Mic className="w-7 h-7 group-hover:scale-110 transition-transform" />
          
          {/* Enhanced pulse animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-30"></div>
          
          {/* Voice indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </button>
      </VoiceTooltip>

      {/* Permission Prompt */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('voiceAI.microphonePermission', 'Microphone permission required')}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('voiceAI.permissionDenied', 'Microphone permission denied')}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={requestMicrophonePermission}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('voiceAI.grantPermission', 'Grant Permission')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <VoiceWelcomePopup
          onClose={handleWelcomeClose}
          onEnableVoice={handleEnableVoice}
        />
      )}

      {/* Voice AI Popup */}
      {showVoiceAI && (
        <VoiceAI
          onClose={() => setShowVoiceAI(false)}
          onMessage={(message) => {
            console.log('Voice AI message:', message);
            // You can add additional handling here if needed
          }}
        />
      )}
    </>
  );
}
