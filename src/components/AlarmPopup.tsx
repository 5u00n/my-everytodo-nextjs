'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock, Volume2, VolumeX } from 'lucide-react';

interface AlarmPopupProps {
  isVisible: boolean;
  title: string;
  body?: string;
  todoId?: string;
  onDismiss: () => void;
  onComplete?: (todoId: string) => void;
  onSnooze?: (todoId: string, minutes: number) => void;
}

export default function AlarmPopup({
  isVisible,
  title,
  body,
  todoId,
  onDismiss,
  onComplete,
  onSnooze
}: AlarmPopupProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Request notification permission when alarm shows
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Start playing alarm sound
      playAlarmSound();
      
      // Focus the window to bring it to front
      window.focus();
    }
  }, [isVisible]);

  const playAlarmSound = async () => {
    if (isMuted) return;
    
    try {
      let context = audioContext;
      if (!context) {
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      }

      if (context.state === 'suspended') {
        await context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Create urgent alarm pattern
      const frequencies = [800, 600, 800, 600, 800, 1000];
      frequencies.forEach((freq, index) => {
        oscillator.frequency.setValueAtTime(freq, context.currentTime + index * 0.15);
      });
      
      gainNode.gain.setValueAtTime(0.6, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.9);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.9);
      
      setIsPlaying(true);
      
      // Stop playing indicator after sound
      setTimeout(() => setIsPlaying(false), 1000);
    } catch (error) {
      console.log('Audio alarm not supported:', error);
    }
  };

  const handleComplete = () => {
    if (todoId && onComplete) {
      onComplete(todoId);
    }
    onDismiss();
  };

  const handleSnooze = (minutes: number) => {
    if (todoId && onSnooze) {
      onSnooze(todoId, minutes);
    }
    onDismiss();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-pulse">
        {/* Header with alarm icon */}
        <div className="bg-red-500 text-white p-6 rounded-t-2xl text-center">
          <div className="flex items-center justify-center space-x-3">
            <Bell className={`w-8 h-8 ${isPlaying ? 'animate-bounce' : ''}`} />
            <h2 className="text-2xl font-bold">ALARM</h2>
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-red-600 rounded-full transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          {body && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {body}
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Mark as Complete</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSnooze(5)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Snooze 5min</span>
              </button>
              
              <button
                onClick={() => handleSnooze(10)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Snooze 10min</span>
              </button>
            </div>

            <button
              onClick={onDismiss}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
