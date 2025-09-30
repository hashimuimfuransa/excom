"use client";
import React, { useEffect, useRef, useState } from 'react';

interface VoiceWaveformVisualizerProps {
  isRecording: boolean;
  audioStream?: MediaStream | null;
  className?: string;
}

export default function VoiceWaveformVisualizer({
  isRecording,
  audioStream,
  className = ''
}: VoiceWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isRecording && audioStream && !isInitialized) {
      initializeAudioContext();
    } else if (!isRecording && isInitialized) {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isRecording, audioStream, isInitialized]);

  const initializeAudioContext = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream!);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      setIsInitialized(true);
      startVisualization();
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  };

  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      if (!isRecording || !analyser || !dataArray) return;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.6)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.4)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    setIsInitialized(false);
  };

  if (!isRecording) {
    return (
      <div className={`flex items-center justify-center h-16 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {audioStream ? 'Ready to record' : 'No audio stream'}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={64}
        className="w-full h-16 bg-gray-900 rounded-lg"
      />
      
      {/* Overlay with recording indicator */}
      <div className="absolute top-2 left-2 flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-white font-medium">Recording</span>
      </div>

      {/* Audio level indicator */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full opacity-60"
              style={{
                height: `${8 + i * 2}px`,
                animation: isRecording ? `pulse ${0.5 + i * 0.1}s infinite` : 'none'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
