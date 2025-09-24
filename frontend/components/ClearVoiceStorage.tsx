"use client";
import React, { useEffect } from 'react';

export default function ClearVoiceStorage() {
  useEffect(() => {
    // Clear voice-related localStorage for testing
    localStorage.removeItem('excom_voice_welcome_seen');
    localStorage.removeItem('excom_voice_banner_seen');
    localStorage.removeItem('excom_voice_enabled');
    localStorage.removeItem('excom_voice_badge_dismissed');
    
    console.log('Voice storage cleared for testing');
  }, []);

  return null;
}
