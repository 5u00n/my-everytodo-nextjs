'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          setUpdateInfo(event.data);
          setShowUpdate(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    // Reload the page to get the new version
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[70] bg-blue-600 text-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">New Version Available!</h3>
            <p className="text-sm text-blue-100 mt-1">
              A new version of EveryTodo is ready. Update now to get the latest features.
            </p>
            {updateInfo?.version && (
              <p className="text-xs text-blue-200 mt-1">
                Version: {updateInfo.version}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUpdate}
            className="flex items-center space-x-1 bg-white text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Update</span>
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
