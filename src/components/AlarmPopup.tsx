'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock, Volume2, VolumeX } from 'lucide-react';

interface AlarmPopupProps {
  isVisible: boolean;
  title: string;
  body?: string;
  todoId?: string;
  duration?: number; // Duration in minutes
  repeatCount?: number; // Number of times to repeat
  onDismiss: () => void;
  onComplete?: (todoId: string) => void;
  onSnooze?: (todoId: string, minutes: number) => void;
}

export default function AlarmPopup({
  isVisible,
  title,
  body,
  todoId,
  duration = 5, // Default 5 minutes
  repeatCount = 3, // Default 3 repeats
  onDismiss,
  onComplete,
  onSnooze
}: AlarmPopupProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alarmInterval, setAlarmInterval] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);

  useEffect(() => {
    if (isVisible) {
      // Request notification permission when alarm shows
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Start playing alarm sound with proper duration
      startAlarmSequence();
      
      // Focus the window to bring it to front
      window.focus();
    } else {
      // Stop alarm when popup is dismissed
      stopAlarmSequence();
    }

    // Cleanup on unmount
    return () => {
      stopAlarmSequence();
    };
  }, [isVisible]);

  // Start the full alarm sequence
  const startAlarmSequence = () => {
    if (isMuted) return;
    
    // Calculate interval between alarm sounds
    const totalDurationMs = duration * 60 * 1000; // Convert minutes to milliseconds
    const intervalMs = totalDurationMs / repeatCount; // Distribute repeats over duration
    
    setRemainingTime(duration * 60); // Set remaining time in seconds
    setCurrentRepeat(0);
    
    let currentRepeatCount = 0;
    
    const playNextAlarm = () => {
      if (currentRepeatCount >= repeatCount || isMuted) {
        return;
      }
      
      playAlarmSound();
      currentRepeatCount++;
      setCurrentRepeat(currentRepeatCount);
      
      // Schedule next alarm
      if (currentRepeatCount < repeatCount) {
        const interval = setTimeout(playNextAlarm, intervalMs);
        setAlarmInterval(interval);
      }
    };
    
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start the first alarm immediately
    playNextAlarm();
  };

  // Stop the alarm sequence
  const stopAlarmSequence = () => {
    if (alarmInterval) {
      clearTimeout(alarmInterval);
      setAlarmInterval(null);
    }
    setIsPlaying(false);
  };

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
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      // Stop alarm when muting
      stopAlarmSequence();
    } else {
      // Restart alarm when unmuting
      startAlarmSequence();
    }
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {body}
            </p>
          )}

          {/* Alarm Status */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Bell className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-red-600' : 'text-red-500'}`} />
                <span className="font-medium text-red-800 dark:text-red-200">
                  Alarm Active
                </span>
              </div>
              <div className="text-red-600 dark:text-red-400">
                {currentRepeat}/{repeatCount} repeats
              </div>
            </div>
            <div className="mt-2 text-xs text-red-700 dark:text-red-300">
              Duration: {duration} minutes • Remaining: {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </div>
          </div>

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
