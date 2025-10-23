'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, TestTube, CheckCircle, XCircle, X } from 'lucide-react';
import pushNotificationService from '@/lib/pushNotificationService';

export default function PushNotificationTest() {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    checkPushNotificationStatus();
    
    // Check if user has previously dismissed the debug popup
    const isDismissed = localStorage.getItem('pushNotificationDebugDismissed');
    if (isDismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that user dismissed it
    localStorage.setItem('pushNotificationDebugDismissed', 'true');
  };

  const checkPushNotificationStatus = async () => {
    const supported = pushNotificationService.isSupported();
    const permission = pushNotificationService.hasPermission();
    const subscription = await pushNotificationService.getSubscription();
    
    setIsSupported(supported);
    setHasPermission(permission);
    setIsSubscribed(!!subscription);
  };

  const handleEnablePushNotifications = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      await pushNotificationService.initialize();
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        await pushNotificationService.subscribe();
        setTestResult('✅ Push notifications enabled successfully!');
        await checkPushNotificationStatus();
      } else {
        setTestResult('❌ Push notification permission denied');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      await pushNotificationService.unsubscribe();
      setTestResult('✅ Push notifications disabled');
      await checkPushNotificationStatus();
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      await pushNotificationService.sendTestNotification();
      setTestResult('✅ Test notification sent! Check your notifications.');
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              Push notifications are not supported in this browser
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Push Notifications
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Status indicators */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Permission:</span>
          <div className="flex items-center space-x-1">
            {hasPermission ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {hasPermission ? 'Granted' : 'Not granted'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Subscription:</span>
          <div className="flex items-center space-x-1">
            {isSubscribed ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isSubscribed ? 'Active' : 'Not active'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          {!hasPermission || !isSubscribed ? (
            <button
              onClick={handleEnablePushNotifications}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>{isLoading ? 'Enabling...' : 'Enable Push Notifications'}</span>
            </button>
          ) : (
            <button
              onClick={handleDisablePushNotifications}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <BellOff className="w-4 h-4" />
              <span>{isLoading ? 'Disabling...' : 'Disable'}</span>
            </button>
          )}

          {hasPermission && isSubscribed && (
            <button
              onClick={handleTestNotification}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <TestTube className="w-4 h-4" />
              <span>Test</span>
            </button>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${
            testResult.startsWith('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {testResult}
          </div>
        )}

        {/* Info text */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Push notifications work even when the app is closed. They're essential for alarm functionality.
        </div>
      </div>
    </div>
  );
}
