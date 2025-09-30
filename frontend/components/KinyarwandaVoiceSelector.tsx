"use client";
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { kinyarwandaTTS, TTSVoice, TTSOptions } from '../services/kinyarwandaTTS';

interface KinyarwandaVoiceSelectorProps {
  onVoiceChange?: (voice: TTSVoice) => void;
  onClose?: () => void;
  className?: string;
}

export default function KinyarwandaVoiceSelector({ 
  onVoiceChange, 
  onClose, 
  className = '' 
}: KinyarwandaVoiceSelectorProps) {
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [testText, setTestText] = useState('Muraho, nshobora gufasha?');
  const [voiceInfo, setVoiceInfo] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [ttsOptions, setTtsOptions] = useState({
    rate: 0.8,
    pitch: 1.0,
    volume: 0.9
  });

  useEffect(() => {
    loadVoices();
    loadVoiceInfo();
  }, []);

  const loadVoices = () => {
    const availableVoices = kinyarwandaTTS.getVoices();
    setVoices(availableVoices);
    
    if (availableVoices.length > 0) {
      const bestVoice = kinyarwandaTTS.getBestVoice();
      setSelectedVoice(bestVoice);
      onVoiceChange?.(bestVoice);
    }
  };

  const loadVoiceInfo = () => {
    const info = kinyarwandaTTS.getVoiceInfo();
    setVoiceInfo(info);
  };

  const handleVoiceSelect = (voice: TTSVoice) => {
    setSelectedVoice(voice);
    onVoiceChange?.(voice);
  };

  const handleTestVoice = async () => {
    if (!selectedVoice) return;

    setIsPlaying(true);
    setIsPaused(false);

    const options: TTSOptions = {
      voice: selectedVoice,
      rate: ttsOptions.rate,
      pitch: ttsOptions.pitch,
      volume: ttsOptions.volume,
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      onError: (error) => {
        console.error('TTS Error:', error);
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    try {
      const processedText = kinyarwandaTTS.preprocessKinyarwandaText(testText);
      await kinyarwandaTTS.speak(processedText, options);
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      kinyarwandaTTS.resume();
      setIsPaused(false);
    } else {
      kinyarwandaTTS.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    kinyarwandaTTS.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleTestAllVoices = async () => {
    for (const voice of voices) {
      setSelectedVoice(voice);
      onVoiceChange?.(voice);
      
      await new Promise(resolve => {
        const options: TTSOptions = {
          voice,
          rate: ttsOptions.rate,
          pitch: ttsOptions.pitch,
          volume: ttsOptions.volume,
          onEnd: resolve
        };
        
        kinyarwandaTTS.speak(testText, options);
      });
      
      // Wait between voices
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'basic': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'basic': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Kinyarwanda Voice Selection
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the best voice for Kinyarwanda text-to-speech
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Voice Settings</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Rate</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={ttsOptions.rate}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{ttsOptions.rate.toFixed(1)}x</span>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Pitch</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={ttsOptions.pitch}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{ttsOptions.pitch.toFixed(1)}x</span>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={ttsOptions.volume}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(ttsOptions.volume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Text Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Test Text (Kinyarwanda)
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          rows={2}
          placeholder="Enter Kinyarwanda text to test..."
        />
      </div>

      {/* Voice List */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Available Voices ({voices.length})
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedVoice?.id === voice.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleVoiceSelect(voice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getQualityIcon(voice.quality)}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {voice.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getQualityColor(voice.quality)} bg-opacity-20`}>
                      {voice.quality}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {voice.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {voice.gender} • {voice.provider}
                    </span>
                    <span className="text-xs text-gray-500">
                      {voice.language}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  {selectedVoice?.id === voice.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestVoice}
            disabled={!selectedVoice || isPlaying}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Test Voice</span>
          </button>

          {isPlaying && (
            <button
              onClick={handlePauseResume}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
            >
              <VolumeX className="w-4 h-4" />
              <span>Stop</span>
            </button>
          )}
        </div>

        <button
          onClick={handleTestAllVoices}
          disabled={voices.length === 0}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Test All</span>
        </button>
      </div>

      {/* Voice Info */}
      {voiceInfo && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Voice Information
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>Total voices: {voiceInfo.totalVoices}</p>
            <p>Kinyarwanda voices: {voiceInfo.kinyarwandaVoices?.length || 0}</p>
            <p>African voices: {voiceInfo.africanVoices?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
