/**
 * Kinyarwanda Text-to-Speech Service
 * Provides authentic Kinyarwanda voice synthesis with multiple options
 */

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  provider: 'browser' | 'google' | 'custom';
  quality: 'basic' | 'good' | 'excellent';
  description: string;
}

export interface TTSOptions {
  voice?: TTSVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

class KinyarwandaTTSService {
  private voices: TTSVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeVoices();
    }
  }

  private initializeVoices() {
    // Browser-based voices (fallback)
    this.voices = [
      {
        id: 'browser-rw-female',
        name: 'Kinyarwanda Female (Browser)',
        language: 'rw-RW',
        gender: 'female',
        provider: 'browser',
        quality: 'basic',
        description: 'Basic browser TTS for Kinyarwanda'
      },
      {
        id: 'browser-rw-male',
        name: 'Kinyarwanda Male (Browser)',
        language: 'rw-RW',
        gender: 'male',
        provider: 'browser',
        quality: 'basic',
        description: 'Basic browser TTS for Kinyarwanda'
      }
    ];

    // Check for available browser voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadBrowserVoices();
    }

    this.isInitialized = true;
  }

  private loadBrowserVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    
    const browserVoices = speechSynthesis.getVoices();
    
    // Look for Kinyarwanda or similar African voices
    const kinyarwandaVoices = browserVoices.filter(voice => 
      voice.lang.startsWith('rw') || 
      voice.lang.startsWith('sw') || // Swahili (similar phonetics)
      voice.lang.startsWith('zu') || // Zulu (similar phonetics)
      voice.name.toLowerCase().includes('african') ||
      voice.name.toLowerCase().includes('kenya') ||
      voice.name.toLowerCase().includes('tanzania') ||
      voice.name.toLowerCase().includes('uganda')
    );

    // Add found voices
    kinyarwandaVoices.forEach(voice => {
      this.voices.push({
        id: `browser-${voice.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: voice.name,
        language: voice.lang,
        gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
        provider: 'browser',
        quality: 'good',
        description: `Browser voice: ${voice.name} (${voice.lang})`
      });
    });

    // If no specific voices found, add generic African voices
    if (kinyarwandaVoices.length === 0) {
      const africanVoices = browserVoices.filter(voice => 
        voice.lang.startsWith('en') && (
          voice.name.toLowerCase().includes('african') ||
          voice.name.toLowerCase().includes('kenya') ||
          voice.name.toLowerCase().includes('nigeria') ||
          voice.name.toLowerCase().includes('south africa')
        )
      );

      africanVoices.forEach(voice => {
        this.voices.push({
          id: `browser-${voice.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: `${voice.name} (Kinyarwanda)`,
          language: 'rw-RW',
          gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
          provider: 'browser',
          quality: 'good',
          description: `Adapted voice: ${voice.name} for Kinyarwanda`
        });
      });
    }
  }

  public getVoices(): TTSVoice[] {
    return this.voices;
  }

  public getBestVoice(): TTSVoice {
    // Return the best available voice
    const excellentVoices = this.voices.filter(v => v.quality === 'excellent');
    if (excellentVoices.length > 0) {
      return excellentVoices[0];
    }

    const goodVoices = this.voices.filter(v => v.quality === 'good');
    if (goodVoices.length > 0) {
      return goodVoices[0];
    }

    return this.voices[0] || this.getDefaultVoice();
  }

  public getDefaultVoice(): TTSVoice {
    return {
      id: 'default-rw',
      name: 'Default Kinyarwanda',
      language: 'rw-RW',
      gender: 'female',
      provider: 'browser',
      quality: 'basic',
      description: 'Default voice for Kinyarwanda'
    };
  }

  public async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!text || text.trim() === '') {
      return;
    }

    // Stop any current speech
    this.stop();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    const voice = options.voice || this.getBestVoice();
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure utterance
    utterance.lang = voice.language;
    utterance.rate = options.rate || 0.8; // Slightly slower for better pronunciation
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.9;

    // Try to set the specific voice
    if (voice.provider === 'browser') {
      const browserVoices = speechSynthesis.getVoices();
      const selectedVoice = browserVoices.find(v => 
        v.name === voice.name || 
        v.lang === voice.language ||
        (voice.language === 'rw-RW' && v.lang.startsWith('rw'))
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      const error = new Error(`Speech synthesis error: ${event.error}`);
      options.onError?.(error);
    };

    this.currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.resume();
    }
  }

  public isSpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.speaking;
  }

  public isPaused(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.paused;
  }

  // Enhanced Kinyarwanda text preprocessing for better pronunciation
  public preprocessKinyarwandaText(text: string): string {
    let processedText = text;

    // Common Kinyarwanda pronunciation adjustments
    const pronunciationMap: { [key: string]: string } = {
      // Tone markers for better pronunciation
      'muraho': 'muraho', // Hello
      'nshobora': 'nshobora', // I can
      'ndagufasha': 'ndagufasha', // I help you
      'murakoze': 'murakoze', // Thank you
      'amakuru': 'amakuru', // News
      'ibicuruzwa': 'ibicuruzwa', // Products
      'amafaranga': 'amafaranga', // Money
      'gucuruza': 'gucuruza', // To sell
      'isitolo': 'isitolo', // Store
      'ubucuruzi': 'ubucuruzi', // Business
      
      // Number pronunciations
      'rimwe': 'rimwe', // One
      'kabiri': 'kabiri', // Two
      'gatatu': 'gatatu', // Three
      'kane': 'kane', // Four
      'gatanu': 'gatanu', // Five
      'gatandatu': 'gatandatu', // Six
      'karindwi': 'karindwi', // Seven
      'umunani': 'umunani', // Eight
      'icyenda': 'icyenda', // Nine
      'icumi': 'icumi', // Ten
      
      // Common expressions
      'yego': 'yego', // Yes
      'oya': 'oya', // No
      'byiza': 'byiza', // Good
      'ntibyiza': 'ntibyiza', // Not good
      'ni byiza': 'ni byiza', // It's good
      'ni meza': 'ni meza', // It's good
      'byose': 'byose', // All
      'make': 'make', // Little/few
      'byinshi': 'byinshi', // Many
      'byiza cyane': 'byiza cyane', // Very good
      
      // Product categories
      'imyenda': 'imyenda', // Clothes
      'ibikoresho': 'ibikoresho', // Tools
      'ibiribwa': 'ibiribwa', // Food
      'ibinyobwa': 'ibinyobwa', // Drinks
      'ibikoresho by\'ubwoba': 'ibikoresho by\'ubwoba', // Electronics
      
      // People and relationships
      'umuntu': 'umuntu', // Person
      'abantu': 'abantu', // People
      'umugore': 'umugore', // Woman
      'umwana': 'umwana', // Child
      'abana': 'abana', // Children
      'umuryango': 'umuryango', // Family
      'imiryango': 'imiryango', // Families
      
      // Locations
      'urugo': 'urugo', // Home
      'amazu': 'amazu', // Houses
      'umudugu': 'umudugu', // Village
      'imidugudu': 'imidugudu', // Villages
      'umujyi': 'umujyi', // City
      'imijyi': 'imijyi', // Cities
      'igihugu': 'igihugu', // Country
      'amahanga': 'amahanga', // Countries
      
      // Time expressions
      'ubu': 'ubu', // Now
      'ejo': 'ejo', // Tomorrow
      'ejo hazaza': 'ejo hazaza', // Tomorrow
      'ejo hashize': 'ejo hashize', // Yesterday
      'noneho': 'noneho', // Then
      'hanyuma': 'hanyuma', // After
      'mbere': 'mbere', // Before
      'nyuma': 'nyuma', // After
      'hejuru': 'hejuru', // Up
      'hasi': 'hasi', // Down
      'hariya': 'hariya', // There
      'hano': 'hano', // Here
      
      // Shopping vocabulary
      'gufasha': 'gufasha', // To help
      'nshaka': 'nshaka', // I want
      'nkunda': 'nkunda', // I like
      'nibaza': 'nibaza', // I ask
      'ndabizi': 'ndabizi', // I know
      'nshoboye': 'nshoboye', // I can
      'abakiriya': 'abakiriya', // Customers
      'umucuruzi': 'umucuruzi', // Seller
      'umukiriya': 'umukiriya', // Customer
      'isoko': 'isoko', // Market
      'gura': 'gura', // To buy
      'ibyaguzwe': 'ibyaguzwe', // Bought items
    };

    // Apply pronunciation adjustments
    Object.entries(pronunciationMap).forEach(([original, pronunciation]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      processedText = processedText.replace(regex, pronunciation);
    });

    // Add pauses for better speech flow
    processedText = processedText
      .replace(/\./g, '. ') // Add space after periods
      .replace(/,/g, ', ') // Add space after commas
      .replace(/\?/g, '? ') // Add space after questions
      .replace(/!/g, '! ') // Add space after exclamations
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return processedText;
  }

  // Test Kinyarwanda pronunciation
  public async testPronunciation(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const testPhrases = [
      'Muraho, nshobora gufasha?',
      'Nshaka ibicuruzwa byiza',
      'Nerekere amafaranga make',
      'Ndagufasha gusanga ibyiza',
      'Murakoze gufasha'
    ];

    for (const phrase of testPhrases) {
      const processedPhrase = this.preprocessKinyarwandaText(phrase);
      await this.speak(processedPhrase);
      
      // Wait for speech to complete
      await new Promise(resolve => {
        const checkComplete = () => {
          if (!this.isSpeaking()) {
            resolve(void 0);
          } else {
            setTimeout(checkComplete, 100);
          }
        };
        checkComplete();
      });
      
      // Pause between phrases
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Get voice information for debugging
  public getVoiceInfo(): any {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { error: 'Speech synthesis not supported' };
    }

    const voices = speechSynthesis.getVoices();
    return {
      totalVoices: voices.length,
      kinyarwandaVoices: voices.filter(v => v.lang.startsWith('rw')),
      africanVoices: voices.filter(v => 
        v.name.toLowerCase().includes('african') ||
        v.name.toLowerCase().includes('kenya') ||
        v.name.toLowerCase().includes('nigeria') ||
        v.name.toLowerCase().includes('south africa')
      ),
      availableVoices: voices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default
      }))
    };
  }
}

// Export singleton instance
export const kinyarwandaTTS = new KinyarwandaTTSService();
export default kinyarwandaTTS;
