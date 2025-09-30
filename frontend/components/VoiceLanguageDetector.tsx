"use client";
import React, { useState, useEffect } from 'react';
import { Languages, Globe, Mic } from 'lucide-react';

interface VoiceLanguageDetectorProps {
  text: string;
  onLanguageDetected: (language: string) => void;
  className?: string;
}

export default function VoiceLanguageDetector({
  text,
  onLanguageDetected,
  className = ''
}: VoiceLanguageDetectorProps) {
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    if (text.trim()) {
      const language = detectLanguage(text);
      setDetectedLanguage(language.language);
      setConfidence(language.confidence);
      onLanguageDetected(language.language);
    }
  }, [text, onLanguageDetected]);

  const detectLanguage = (inputText: string): { language: string; confidence: number } => {
    const lowerText = inputText.toLowerCase();
    
    // Comprehensive Kinyarwanda language indicators
    const kinyarwandaWords = [
      // Greetings and common phrases
      'muraho', 'bite', 'murakoze', 'murabeho', 'murakaza', 'murakaza neza',
      'amakuru', 'ni meza', 'ni byiza', 'ni byose', 'ni byiza cyane',
      
      // Pronouns and basic words
      'ni', 'iki', 'icyo', 'iyi', 'iyo', 'nshobora', 'nshaka', 'nkunda', 'nibaza', 
      'ndagufasha', 'ndabizi', 'nshoboye',
      
      // Shopping and commerce vocabulary
      'gufasha', 'isitolo', 'ubucuruzi', 'ibicuruzwa', 'amafaranga', 'gucuruza',
      'abakiriya', 'umucuruzi', 'umukiriya', 'isoko', 'gura', 'ibyaguzwe',
      
      // Descriptive words
      'byiza', 'niba', 'byose', 'make', 'byinshi', 'byiza cyane',
      
      // Numbers
      'rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu', 'gatandatu', 'karindwi',
      'umunani', 'icyenda', 'icumi', 'ijana', 'igihumbi',
      
      // Time and location
      'ubu', 'ejo', 'ejo hazaza', 'ejo hashize', 'noneho', 'hanyuma',
      'mbere', 'nyuma', 'hejuru', 'hasi', 'hariya', 'hano',
      
      // Common expressions
      'yego', 'oya', 'ntibyiza', 'ni byiza',
      
      // Product categories
      'imyenda', 'ibikoresho', 'ibiribwa', 'ibinyobwa', 'ibikoresho by\'ubwoba',
      
      // Additional common words
      'umuntu', 'abantu', 'umugore', 'abagore', 'umuhungu', 'abahungu',
      'umwana', 'abana', 'umuryango', 'imiryango', 'urugo', 'amazu',
      'umudugu', 'imidugudu', 'umujyi', 'imijyi', 'igihugu', 'amahanga'
    ];
    
    // English language indicators
    const englishWords = [
      'hello', 'hi', 'help', 'find', 'show', 'buy', 'sell', 'product', 'price',
      'money', 'store', 'shop', 'customer', 'want', 'can', 'like', 'good', 'if',
      'the', 'and', 'or', 'but', 'with', 'for', 'from', 'to', 'in', 'on', 'at'
    ];
    
    // Count matches for each language
    const kinyarwandaCount = kinyarwandaWords.filter(word => lowerText.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    
    // Calculate confidence based on word matches
    const totalWords = kinyarwandaCount + englishCount;
    let language = 'en';
    let confidence = 0.5;
    
    if (totalWords > 0) {
      if (kinyarwandaCount > englishCount) {
        language = 'rw';
        confidence = Math.min(0.9, 0.5 + (kinyarwandaCount / totalWords) * 0.4);
      } else {
        language = 'en';
        confidence = Math.min(0.9, 0.5 + (englishCount / totalWords) * 0.4);
      }
    }
    
    // Strong Kinyarwanda indicators
    const strongKinyarwandaIndicators = [
      'muraho', 'nshobora', 'ndagufasha', 'murakoze', 'amakuru', 'ni meza',
      'ibicuruzwa', 'amafaranga', 'gucuruza', 'isitolo', 'ubucuruzi'
    ];
    
    const hasStrongIndicator = strongKinyarwandaIndicators.some(word => lowerText.includes(word));
    
    if (hasStrongIndicator) {
      language = 'rw';
      confidence = Math.max(confidence, 0.8);
    }
    
    // Special cases for common Kinyarwanda greetings
    if (lowerText.includes('muraho') || lowerText.includes('nshobora') || lowerText.includes('murakoze')) {
      language = 'rw';
      confidence = Math.max(confidence, 0.9);
    }
    
    return { language, confidence };
  };

  const getLanguageName = (lang: string) => {
    return lang === 'rw' ? 'Kinyarwanda' : 'English';
  };

  const getLanguageFlag = (lang: string) => {
    return lang === 'rw' ? '🇷🇼' : '🇺🇸';
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    return 'Low';
  };

  if (!text.trim()) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 dark:text-gray-400 ${className}`}>
        <Languages className="w-4 h-4" />
        <span className="text-sm">No text to analyze</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      {/* Language Icon */}
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Language:
        </span>
      </div>

      {/* Detected Language */}
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getLanguageFlag(detectedLanguage)}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {getLanguageName(detectedLanguage)}
        </span>
      </div>

      {/* Confidence Level */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
        <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
          {getConfidenceText(confidence)} ({Math.round(confidence * 100)}%)
        </span>
      </div>

      {/* Confidence Bar */}
      <div className="flex-1 max-w-20">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Analysis Details */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {text.length} chars
      </div>
    </div>
  );
}
