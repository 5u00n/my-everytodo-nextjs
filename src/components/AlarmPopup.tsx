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
  alarmSoundType?: 'normal' | 'extreme'; // Alarm sound type
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
  alarmSoundType = 'normal', // Default to normal alarm sound
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
  const [activeOscillator, setActiveOscillator] = useState<OscillatorNode | null>(null);
  const [vibrationId, setVibrationId] = useState<number | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

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
    stopAlarmSound();
    stopVibration();
    setIsPlaying(false);
  };

  // Stop the current alarm sound
  const stopAlarmSound = () => {
    if (activeOscillator) {
      try {
        activeOscillator.stop();
        activeOscillator.disconnect();
      } catch (error) {
        // Oscillator might already be stopped
      }
      setActiveOscillator(null);
    }
  };

  // Stop vibration
  const stopVibration = () => {
    if (vibrationId) {
      clearTimeout(vibrationId);
      setVibrationId(null);
    }
    // Try to stop any ongoing vibration (only if user has interacted)
    if ('vibrate' in navigator && userHasInteracted) {
      try {
        navigator.vibrate(0); // Stop vibration
      } catch (error) {
        // Ignore vibration errors
      }
    }
  };

  const playAlarmSound = async () => {
    if (isMuted) return;
    
    // Stop any existing alarm sound
    stopAlarmSound();
    
    try {
      let context = audioContext;
      if (!context) {
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        console.log('AudioContext created:', context.state);
      }

      if (context.state === 'suspended') {
        console.log('AudioContext suspended, attempting to resume...');
        await context.resume();
        console.log('AudioContext resumed:', context.state);
      }

      // Calculate how long each repeat should play
      const repeatDurationMs = (duration * 60 * 1000) / repeatCount; // Duration per repeat in ms
      const repeatDurationSeconds = repeatDurationMs / 1000;
      
      console.log(`Playing ${alarmSoundType} alarm sound for ${repeatDurationSeconds}s`);
      
      // Play alarm sound based on type
      if (alarmSoundType === 'extreme') {
        playAggressiveWakeUpSound(context, repeatDurationSeconds);
      } else {
        playNormalWakeUpSound(context, repeatDurationSeconds);
      }
      
      setIsPlaying(true);
      
      // Stop playing indicator after this repeat
      setTimeout(() => {
        setIsPlaying(false);
        setActiveOscillator(null);
      }, repeatDurationMs);
      
      // Enhanced vibration pattern for locked phones (only after user interaction)
      if ('vibrate' in navigator && !isMuted && userHasInteracted) {
        const startVibration = () => {
          try {
            // More aggressive vibration pattern for locked phones
            const vibrationPattern = [500, 200, 500, 200, 500, 200, 500, 200, 500];
            navigator.vibrate(vibrationPattern);
            
            // Schedule next vibration cycle
            const vibrationTimeout = setTimeout(() => {
              if (!isMuted) {
                startVibration();
              }
            }, 1500); // Every 1.5 seconds for more aggressive pattern
            
            setVibrationId(vibrationTimeout as unknown as number);
          } catch (error) {
            // Ignore vibration errors
          }
        };
        
        startVibration();
      }
    } catch (error) {
      console.error('Audio alarm failed:', error);
      // Try to show a visual indicator that sound failed
      console.log('Alarm sound failed - check browser audio permissions and user interaction');
    }
  };

  const playNormalWakeUpSound = (context: AudioContext, duration: number) => {
    // Create traditional alarm sound pattern (beep-beep-beep)
    const beepDuration = 0.3; // 300ms beep
    const pauseDuration = 0.2; // 200ms pause
    const cycleDuration = beepDuration + pauseDuration; // 500ms total cycle
    const cycles = Math.floor(duration / cycleDuration);
    
    // Traditional alarm frequencies (pleasant but noticeable)
    const lowFreq = 440; // A4 note
    const highFreq = 523; // C5 note
    
    // Create oscillators array to store references
    const oscillators: OscillatorNode[] = [];
    
    for (let i = 0; i < cycles; i++) {
      const cycleStart = context.currentTime + (i * cycleDuration);
      
      // Create oscillator for first beep (low tone)
      const oscillator1 = context.createOscillator();
      const gainNode1 = context.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(context.destination);
      
      oscillator1.type = 'sine'; // Gentle sine wave
      oscillator1.frequency.setValueAtTime(lowFreq, cycleStart);
      gainNode1.gain.setValueAtTime(0.4, cycleStart);
      gainNode1.gain.setValueAtTime(0.4, cycleStart + beepDuration);
      gainNode1.gain.setValueAtTime(0.01, cycleStart + beepDuration + 0.01);
      
      oscillator1.start(cycleStart);
      oscillator1.stop(cycleStart + beepDuration);
      
      // Store first oscillator for potential stopping
      if (i === 0) {
        oscillators.push(oscillator1);
      }
      
      // Create oscillator for second beep (high tone) - start after pause
      const secondBeepStart = cycleStart + beepDuration + pauseDuration;
      const oscillator2 = context.createOscillator();
      const gainNode2 = context.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(context.destination);
      
      oscillator2.type = 'sine'; // Gentle sine wave
      oscillator2.frequency.setValueAtTime(highFreq, secondBeepStart);
      gainNode2.gain.setValueAtTime(0.4, secondBeepStart);
      gainNode2.gain.setValueAtTime(0.4, secondBeepStart + beepDuration);
      gainNode2.gain.setValueAtTime(0.01, secondBeepStart + beepDuration + 0.01);
      
      oscillator2.start(secondBeepStart);
      oscillator2.stop(secondBeepStart + beepDuration);
    }
    
    // Store first oscillator for potential stopping
    if (oscillators.length > 0) {
      setActiveOscillator(oscillators[0]);
    }
  };

  const playAggressiveWakeUpSound = (context: AudioContext, duration: number) => {
    // Create multiple oscillators for chaotic, wake-up inducing sound
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    
    // Create 6 oscillators with different frequencies for maximum chaos
    for (let i = 0; i < 6; i++) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillators.push(oscillator);
      gainNodes.push(gainNode);
    }
    
    // Set up chaotic frequency patterns
    const frequencies = [150, 300, 600, 900, 1200, 1500]; // Low to high frequencies
    const startTime = context.currentTime;
    
    oscillators.forEach((oscillator, index) => {
      oscillator.type = 'sawtooth'; // More aggressive than sine wave
      oscillator.frequency.setValueAtTime(frequencies[index], startTime);
      
      // Create chaotic frequency modulation
      for (let t = 0; t < duration; t += 0.05) {
        const randomFreq = frequencies[index] + (Math.random() - 0.5) * 300;
        oscillator.frequency.setValueAtTime(Math.max(50, randomFreq), startTime + t);
      }
      
      // Aggressive volume envelope with random modulation
      gainNodes[index].gain.setValueAtTime(0, startTime);
      gainNodes[index].gain.linearRampToValueAtTime(0.5, startTime + 0.05); // Very quick attack
      
      // Random volume modulation for chaos
      for (let t = 0.05; t < duration - 0.05; t += 0.1) {
        const randomVolume = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
        gainNodes[index].gain.setValueAtTime(randomVolume, startTime + t);
      }
      
      gainNodes[index].gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
    // Store first oscillator for potential stopping
    setActiveOscillator(oscillators[0]);
    
    // Add emergency siren effect after 2 seconds
    setTimeout(() => {
      playEmergencySiren(context, duration - 2);
    }, 2000);
  };

  const playEmergencySiren = (context: AudioContext, duration: number) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'square'; // Harsh square wave
    const startTime = context.currentTime;
    
    // Create siren effect (rising and falling frequency)
    const sirenDuration = duration;
    const cycles = 8; // Number of siren cycles
    
    for (let i = 0; i < cycles; i++) {
      const cycleStart = startTime + (i * sirenDuration / cycles);
      const cycleDuration = sirenDuration / cycles;
      
      // Rising frequency
      oscillator.frequency.setValueAtTime(200, cycleStart);
      oscillator.frequency.linearRampToValueAtTime(1200, cycleStart + cycleDuration / 2);
      
      // Falling frequency
      oscillator.frequency.linearRampToValueAtTime(200, cycleStart + cycleDuration);
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0.6, cycleStart);
      gainNode.gain.setValueAtTime(0.6, cycleStart + cycleDuration);
    }
    
    oscillator.start(startTime);
    oscillator.stop(startTime + sirenDuration);
  };

  const handleComplete = () => {
    setUserHasInteracted(true); // Enable vibration for future interactions
    stopAlarmSequence(); // Stop alarm sound
    if (todoId && onComplete) {
      onComplete(todoId);
    }
    onDismiss();
  };

  const handleSnooze = (minutes: number) => {
    setUserHasInteracted(true); // Enable vibration for future interactions
    stopAlarmSequence(); // Stop alarm sound
    if (todoId && onSnooze) {
      onSnooze(todoId, minutes);
    }
    onDismiss();
  };

  const handleDismiss = () => {
    setUserHasInteracted(true); // Enable vibration for future interactions
    stopAlarmSequence(); // Stop alarm sound
    if (onDismiss) {
      onDismiss();
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Mark user as interacted for vibration
    setUserHasInteracted(true);
    
    if (newMutedState) {
      // Stop alarm when muting
      stopAlarmSequence();
    } else {
      // Restart alarm when unmuting
      startAlarmSequence();
    }
  };

  // Handle user interaction to enable vibration and audio
  const handleUserInteraction = async () => {
    setUserHasInteracted(true);
    
    // Try to resume AudioContext if it's suspended
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('AudioContext resumed after user interaction:', audioContext.state);
        
        // If alarm is playing but no sound, try to restart
        if (isPlaying && !activeOscillator) {
          console.log('Restarting alarm sound after user interaction');
          playAlarmSound();
        }
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {/* Elegant Header with gradient and glow effect */}
        <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white p-8 text-center overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          
          <div className="relative flex items-center justify-center space-x-4">
            <div className={`p-3 rounded-full bg-white/20 backdrop-blur-sm ${isPlaying ? 'animate-pulse' : ''}`}>
              <Bell className={`w-8 h-8 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-wide">ALARM</h2>
              <p className="text-red-100 text-sm font-medium">Time to wake up!</p>
            </div>
            <button
              onClick={toggleMute}
              className="p-3 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Content with elegant spacing */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            {body && (
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {body}
              </p>
            )}
          </div>

          {/* Elegant status card with glassmorphism */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-red-100 dark:bg-red-900/30 ${isPlaying ? 'animate-pulse' : ''}`}>
                  <Bell className={`w-5 h-5 ${isPlaying ? 'animate-bounce text-red-600' : 'text-red-500'}`} />
                </div>
                <span className="font-semibold text-red-800 dark:text-red-200 text-lg">
                  Alarm Active
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {currentRepeat}/{repeatCount}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                  repeats
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-red-200 dark:bg-red-800/30 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentRepeat / repeatCount) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-red-700 dark:text-red-300 font-medium">
              <span>Duration: {duration} min</span>
              <span>Remaining: {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Elegant action buttons */}
          <div className="space-y-4">
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-green-500/25"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg">Mark as Complete</span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSnooze(5)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-amber-500/25"
              >
                <Clock className="w-5 h-5" />
                <span>Snooze 5min</span>
              </button>
              
              <button
                onClick={() => handleSnooze(10)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-orange-500/25"
              >
                <Clock className="w-5 h-5" />
                <span>Snooze 10min</span>
              </button>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-gray-500/25"
            >
              <X className="w-5 h-5" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
