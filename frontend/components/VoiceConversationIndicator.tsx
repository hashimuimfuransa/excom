"use client";
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, MessageCircle, Zap } from 'lucide-react';

interface VoiceConversationIndicatorProps {
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  messageCount: number;
  currentLanguage: string;
  className?: string;
}

export default function VoiceConversationIndicator({
  isConnected,
  isRecording,
  isProcessing,
  isSpeaking,
  messageCount,
  currentLanguage,
  className = ''
}: VoiceConversationIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isRecording || isProcessing || isSpeaking) {
      setPulseAnimation(true);
    } else {
      setPulseAnimation(false);
    }
  }, [isRecording, isProcessing, isSpeaking]);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isRecording) return 'bg-green-500';
    if (isProcessing) return 'bg-yellow-500';
    if (isSpeaking) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isRecording) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'AI Speaking...';
    return 'Ready';
  };

  const getStatusIcon = () => {
    if (!isConnected) return <WifiOff className="w-3 h-3" />;
    if (isRecording) return <Mic className="w-3 h-3" />;
    if (isProcessing) return <Zap className="w-3 h-3" />;
    if (isSpeaking) return <Volume2 className="w-3 h-3" />;
    return <MicOff className="w-3 h-3" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Indicator */}
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 ${
          pulseAnimation ? 'animate-pulse' : ''
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Status Dot */}
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} flex items-center justify-center text-white`}>
          {getStatusIcon()}
        </div>
        
        {/* Status Text */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatusText()}
        </span>
        
        {/* Message Count */}
        {messageCount > 0 && (
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{messageCount}</span>
          </div>
        )}
        
        {/* Language Indicator */}
        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {currentLanguage === 'rw' ? 'RW' : 'EN'}
        </div>
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection:</span>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Recording Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recording:</span>
              <div className="flex items-center space-x-2">
                {isRecording ? (
                  <Mic className="w-4 h-4 text-green-500" />
                ) : (
                  <MicOff className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-sm ${isRecording ? 'text-green-600' : 'text-gray-600'}`}>
                  {isRecording ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Processing Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing:</span>
              <div className="flex items-center space-x-2">
                {isProcessing ? (
                  <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                )}
                <span className={`text-sm ${isProcessing ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {isProcessing ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>

            {/* Speaking Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Speaking:</span>
              <div className="flex items-center space-x-2">
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-blue-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-sm ${isSpeaking ? 'text-blue-600' : 'text-gray-600'}`}>
                  {isSpeaking ? 'Active' : 'Silent'}
                </span>
              </div>
            </div>

            {/* Conversation Stats */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Messages:</span>
                <span className="text-sm text-gray-600">{messageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language:</span>
                <span className="text-sm text-gray-600">
                  {currentLanguage === 'rw' ? 'Kinyarwanda' : 'English'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="text-xs text-gray-500 mb-2">Quick Actions:</div>
              <div className="flex space-x-2">
                <button className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                  Start Recording
                </button>
                <button className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors">
                  Stop Speaking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
