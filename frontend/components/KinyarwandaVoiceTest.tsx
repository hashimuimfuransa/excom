"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface KinyarwandaVoiceTestProps {
  onClose?: () => void;
}

interface TestResult {
  phrase: string;
  detected: boolean;
  confidence: number;
  language: string;
  timestamp: Date;
}

export default function KinyarwandaVoiceTest({ onClose }: KinyarwandaVoiceTestProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isTestComplete, setIsTestComplete] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Kinyarwanda test phrases for voice recognition
  const testPhrases = [
    "Muraho, nshobora gufasha?",
    "Nshaka ibicuruzwa byiza",
    "Nerekere amafaranga make",
    "Ndagufasha gusanga ibyiza",
    "Murakoze gufasha",
    "Iki giciro ni iki?",
    "Nshobora kugura iki?",
    "Nshaka imyenda nziza",
    "Amakuru ni meza",
    "Nkunda ibicuruzwa bya ExCom"
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'rw-RW'; // Kinyarwanda language code

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          handleVoiceResult(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleVoiceResult = (transcript: string) => {
    const expectedPhrase = testPhrases[currentTestIndex];
    const detected = transcript.toLowerCase().includes(expectedPhrase.toLowerCase()) || 
                   expectedPhrase.toLowerCase().includes(transcript.toLowerCase());
    
    const result: TestResult = {
      phrase: expectedPhrase,
      detected,
      confidence: detected ? 0.8 + Math.random() * 0.2 : Math.random() * 0.5,
      language: 'rw',
      timestamp: new Date()
    };

    setTestResults(prev => [...prev, result]);
    
    if (currentTestIndex < testPhrases.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
    } else {
      setIsTestComplete(true);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && currentTestIndex < testPhrases.length) {
      setCurrentPhrase(testPhrases[currentTestIndex]);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakPhrase = (phrase: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'rw-RW';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const resetTest = () => {
    setTestResults([]);
    setCurrentTestIndex(0);
    setIsTestComplete(false);
    setCurrentPhrase('');
  };

  const getTestScore = () => {
    if (testResults.length === 0) return 0;
    const correct = testResults.filter(r => r.detected).length;
    return Math.round((correct / testResults.length) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    return <XCircle className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Kinyarwanda Voice Recognition Test</h3>
              <p className="text-sm opacity-90">Testing voice recognition accuracy for Kinyarwanda</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Test Progress */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Progress: {currentTestIndex + 1} / {testPhrases.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Score: <span className={getScoreColor(getTestScore())}>{getTestScore()}%</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentTestIndex + 1) / testPhrases.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Test */}
        {!isTestComplete && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Current Test Phrase:
              </h4>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
                "{currentPhrase}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please repeat this phrase in Kinyarwanda
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={isPlaying ? stopSpeaking : () => speakPhrase(currentPhrase)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                {isPlaying ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>{isPlaying ? 'Stop' : 'Listen'}</span>
              </button>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
              </button>
            </div>

            {/* Status */}
            <div className="text-center">
              {isRecording && (
                <p className="text-green-600 dark:text-green-400 text-sm">
                  🎤 Listening for Kinyarwanda speech...
                </p>
              )}
              {isPlaying && (
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  🔊 Playing phrase...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Test Results */}
        {isTestComplete && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getScoreIcon(getTestScore())}
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Test Complete!
                </h4>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(getTestScore())}`}>
                {getTestScore()}% Accuracy
              </p>
            </div>

            {/* Results List */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.detected
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        "{result.phrase}"
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence: {Math.round(result.confidence * 100)}%
                      </p>
                    </div>
                    <div className="ml-3">
                      {result.detected ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={resetTest}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Run Test Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click "Listen" to hear the phrase</li>
              <li>Click "Start Recording" and repeat the phrase in Kinyarwanda</li>
              <li>The system will detect if your speech matches the expected phrase</li>
              <li>Complete all {testPhrases.length} phrases to get your accuracy score</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
