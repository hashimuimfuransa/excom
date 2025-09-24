"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic } from 'lucide-react';

interface VoiceTooltipProps {
  children: React.ReactNode;
}

export default function VoiceTooltip({ children }: VoiceTooltipProps) {
  const { t, i18n } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4" />
            <span>
              {i18n.language === 'rw' 
                ? 'Gucuruza mu Jwi - Tangira!'
                : 'Voice Shopping - Try Now!'
              }
            </span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
}
