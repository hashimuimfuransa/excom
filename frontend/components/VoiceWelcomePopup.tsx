"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, X, Volume2, Languages } from 'lucide-react';

interface VoiceWelcomePopupProps {
  onClose: () => void;
  onEnableVoice: () => void;
}

export default function VoiceWelcomePopup({ onClose, onEnableVoice }: VoiceWelcomePopupProps) {
  const { t, i18n } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if voice features are supported
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    setIsSupported(speechRecognitionSupported && speechSynthesisSupported);
  }, []);

  const handleEnableVoice = () => {
    onEnableVoice();
    onClose();
  };

  if (!isSupported) {
    return null;
  }

  return (
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
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t('voiceAI.voiceCommands.findProducts', 'Find products')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {i18n.language === 'rw' 
                      ? 'Vuga "shakisha ibyuma by\'amashanyarazi"'
                      : 'Say "find electronics"'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t('voiceAI.voiceCommands.comparePrices', 'Compare prices')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {i18n.language === 'rw' 
                      ? 'Vuga "gereranya ibiguzi"'
                      : 'Say "compare prices"'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t('voiceAI.changeLanguage', 'Change Language')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {i18n.language === 'rw' 
                      ? 'Vuga mu Kinyarwanda cyangwa mu Cyongereza'
                      : 'Speak in Kinyarwanda or English'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {i18n.language === 'rw' ? 'Aho byiza:' : 'Benefits:'}
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• {i18n.language === 'rw' ? 'Gucuruza byihuse' : 'Faster shopping'}</li>
                <li>• {i18n.language === 'rw' ? 'Gukoresha ijwi ryihariye' : 'Hands-free experience'}</li>
                <li>• {i18n.language === 'rw' ? 'Ibyemezo bya AI' : 'AI recommendations'}</li>
                <li>• {i18n.language === 'rw' ? 'Guhindura ururimi' : 'Language switching'}</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {i18n.language === 'rw' ? 'Hanyuma' : 'Maybe Later'}
            </button>
            <button
              onClick={handleEnableVoice}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              {i18n.language === 'rw' ? 'Tangira' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
