"use client";
import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

export default function VoiceDebugPanel() {
  const [events, setEvents] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOpenVoiceAI = () => {
      setEvents(prev => [...prev, `Voice AI event triggered at ${new Date().toLocaleTimeString()}`]);
    };

    const handleVoiceButtonClick = (event: any) => {
      if (event.target.closest('[data-voice-trigger]')) {
        setEvents(prev => [...prev, `Voice button clicked at ${new Date().toLocaleTimeString()}`]);
      }
    };

    window.addEventListener('openVoiceAI', handleOpenVoiceAI);
    document.addEventListener('click', handleVoiceButtonClick);

    return () => {
      window.removeEventListener('openVoiceAI', handleOpenVoiceAI);
      document.removeEventListener('click', handleVoiceButtonClick);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center"
        title="Debug Panel"
      >
        <Mic className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Voice Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => {
            console.log('Manual trigger test');
            window.dispatchEvent(new CustomEvent('openVoiceAI'));
          }}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm"
        >
          Test Voice AI Trigger
        </button>
        
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p>Events ({events.length}):</p>
          <div className="max-h-32 overflow-y-auto">
            {events.slice(-5).map((event, index) => (
              <div key={index} className="text-xs">{event}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
