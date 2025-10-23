'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Tablet } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet'>('desktop');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect device type
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        setDeviceType('mobile');
      } else if (/ipad|android(?!.*mobile)/i.test(userAgent)) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDevice();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show install prompt after a delay if not already shown
    const timer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt) {
        setShowInstallPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [isInstalled, deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Fallback for browsers that don't support the install prompt
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const instructions = getInstallInstructions(deviceType);
    alert(instructions);
  };

  const getInstallInstructions = (device: string) => {
    switch (device) {
      case 'mobile':
        return `To install EveryTodo on your mobile device:

1. Open your browser menu (three dots)
2. Look for "Add to Home Screen" or "Install App"
3. Tap it and follow the prompts
4. The app will be added to your home screen

Alternatively, look for an install icon in your browser's address bar.`;
      
      case 'tablet':
        return `To install EveryTodo on your tablet:

1. Open your browser menu (three dots)
2. Look for "Add to Home Screen" or "Install App"
3. Tap it and follow the prompts
4. The app will be added to your home screen

Alternatively, look for an install icon in your browser's address bar.`;
      
      default:
        return `To install EveryTodo on your desktop:

Chrome/Edge:
1. Look for the install icon in the address bar
2. Click it and select "Install"

Firefox:
1. Look for the install icon in the address bar
2. Click it and select "Install"

Safari:
1. Go to File > Add to Dock
2. Or use the Share button and select "Add to Dock"`;
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                {getDeviceIcon()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Install EveryTodo
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Get quick access to your todos and alarms by installing the app on your {deviceType}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
          <button
            onClick={showManualInstallInstructions}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Instructions
          </button>
        </div>
      </div>
    </div>
  );
}
