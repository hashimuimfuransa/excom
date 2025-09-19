"use client";
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/utils/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Load translations dynamically
        const [enCommon, rwCommon] = await Promise.all([
          fetch('/locales/en/common.json').then(res => res.json()),
          fetch('/locales/rw/common.json').then(res => res.json())
        ]);

        // Add resources to i18n
        i18n.addResourceBundle('en', 'common', enCommon, true, true);
        i18n.addResourceBundle('rw', 'common', rwCommon, true, true);

        // Check for saved language preference
        const savedLanguage = localStorage.getItem('excom_language');
        if (savedLanguage && ['en', 'rw'].includes(savedLanguage)) {
          await i18n.changeLanguage(savedLanguage);
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setIsReady(true); // Set ready anyway to prevent blocking
      }
    };

    initializeI18n();
  }, []);

  if (!isReady) {
    return <div>Loading...</div>; // Simple loading state
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}