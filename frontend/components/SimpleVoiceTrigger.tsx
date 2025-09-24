"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, X } from 'lucide-react';
import VoiceAI from './VoiceAI';

interface SimpleVoiceTriggerProps {
  className?: string;
}

export default function SimpleVoiceTrigger({ className = '' }: SimpleVoiceTriggerProps) {
  const { t } = useTranslation();
  const [showVoiceAI, setShowVoiceAI] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    // Always show welcome popup for testing
    const hasSeenWelcome = localStorage.getItem('excom_voice_welcome_seen');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        setShowWelcomePopup(true);
      }, 2000);
    }
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    localStorage.setItem('excom_voice_welcome_seen', 'true');
  };

  const handleEnableVoice = () => {
    handleWelcomeClose();
    setShowVoiceAI(true);
  };

  return (
    <>
      {/* Welcome Popup - Always show for testing */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {t('voiceAI.enableVoice', 'Enable Voice Shopping')}
                    </h3>
                    <p className="text-sm opacity-90">
                      {t('voiceAI.speakToShop', 'Speak to shop with AI')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleWelcomeClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    🎤 Voice Shopping Features:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Speak to search for products</li>
                    <li>• AI responds with voice</li>
                    <li>• Works in English & Kinyarwanda</li>
                    <li>• Hands-free shopping experience</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleWelcomeClose}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleEnableVoice}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice AI Trigger Button - Always visible */}
      <button
        onClick={() => setShowVoiceAI(true)}
        className={`fixed bottom-20 right-4 z-40 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${className}`}
        title="Enable Voice Shopping"
      >
        <Mic className="w-7 h-7 group-hover:scale-110 transition-transform" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-30"></div>
        
        {/* Voice indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </button>

      {/* Voice AI Popup */}
      {showVoiceAI && (
        <VoiceAI
          onClose={() => setShowVoiceAI(false)}
          onMessage={(message) => {
            console.log('Voice AI message:', message);
          }}
        />
      )}
    </>
  );
}
