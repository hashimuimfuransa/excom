"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Volume2, Languages, Zap, Shield, Globe } from 'lucide-react';

export default function VoiceAIDemo() {
  const { t, i18n } = useTranslation();

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: i18n.language === 'rw' ? 'Ijwi ryihariye' : 'Voice Recognition',
      description: i18n.language === 'rw' 
        ? 'Vuga kugira ngo ushakishe ibicuruzwa'
        : 'Speak to search for products'
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: i18n.language === 'rw' ? 'Gusubiza mu jwi' : 'Voice Response',
      description: i18n.language === 'rw'
        ? 'AI iravuga ibisubizo byayo'
        : 'AI speaks back with responses'
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: i18n.language === 'rw' ? 'Ururimi rwose' : 'Multi-Language',
      description: i18n.language === 'rw'
        ? 'Vuga mu Kinyarwanda cyangwa mu Cyongereza'
        : 'Speak in Kinyarwanda or English'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: i18n.language === 'rw' ? 'Byihuse' : 'Fast & Smart',
      description: i18n.language === 'rw'
        ? 'AI irakumva no gusubiza byihuse'
        : 'AI understands and responds quickly'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: i18n.language === 'rw' ? 'Umutekano' : 'Secure',
      description: i18n.language === 'rw'
        ? 'Amakuru yawe aratabaye'
        : 'Your data stays private'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: i18n.language === 'rw' ? 'Guhindura' : 'Translation',
      description: i18n.language === 'rw'
        ? 'Guhindura ibitekerezo mu rundi rurimi'
        : 'Translate messages between languages'
    }
  ];

  const voiceCommands = [
    {
      command: i18n.language === 'rw' ? 'Shakisha ibyuma by\'amashanyarazi' : 'Find electronics',
      response: i18n.language === 'rw' ? 'Nzakwerekana ibyuma by\'amashanyarazi byaboneka' : 'I\'ll show you available electronics'
    },
    {
      command: i18n.language === 'rw' ? 'Nyereka amahirwe meza' : 'Show me the best deals',
      response: i18n.language === 'rw' ? 'Nzakwerekana amahirwe meza uyu munsi' : 'I\'ll show you today\'s best deals'
    },
    {
      command: i18n.language === 'rw' ? 'Gereranya ibiguzi' : 'Compare prices',
      response: i18n.language === 'rw' ? 'Nzakugereranya ibiguzi by\'ibicuruzwa' : 'I\'ll compare product prices for you'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <Mic className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {i18n.language === 'rw' ? 'AI wo Mu Jwi' : 'Voice AI Assistant'}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {i18n.language === 'rw' 
              ? 'Gucuruza byihuse na AI rifite ubwenge bw\'ikoranabuhanga. Vuga kugira ngo ugure ibicuruzwa byiza.'
              : 'Shop faster with intelligent AI. Speak to find the best products and deals.'
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-blue-500 dark:text-blue-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Voice Commands Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {i18n.language === 'rw' ? 'Amabwiriza yo Gukoresha' : 'Voice Commands'}
          </h2>
          
          <div className="space-y-4">
            {voiceCommands.map((cmd, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mic className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {i18n.language === 'rw' ? 'Vuga:' : 'Say:'}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    "{cmd.command}"
                  </p>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Volume2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {i18n.language === 'rw' ? 'AI iravuga:' : 'AI responds:'}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    "{cmd.response}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Use */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {i18n.language === 'rw' ? 'Uburyo bwo Gukoresha' : 'How to Use'}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">
                {i18n.language === 'rw' ? 'Gukanda' : 'Click'}
              </h3>
              <p className="text-sm opacity-90">
                {i18n.language === 'rw' 
                  ? 'Gukanda ku buto bwo mu jwi'
                  : 'Click the voice button'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">
                {i18n.language === 'rw' ? 'Kuvuga' : 'Speak'}
              </h3>
              <p className="text-sm opacity-90">
                {i18n.language === 'rw' 
                  ? 'Vuga icyo ushakisha'
                  : 'Say what you\'re looking for'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">
                {i18n.language === 'rw' ? 'Kwumva' : 'Listen'}
              </h3>
              <p className="text-sm opacity-90">
                {i18n.language === 'rw' 
                  ? 'Umva ibyemezo bya AI'
                  : 'Listen to AI recommendations'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {i18n.language === 'rw' 
              ? 'Tangira gucuruza mu jwi ubu!'
              : 'Start voice shopping now!'
            }
          </p>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
