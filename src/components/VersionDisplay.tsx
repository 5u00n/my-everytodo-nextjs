'use client';

import React from 'react';
import { VERSION_INFO } from '@/lib/version';
import { Info } from 'lucide-react';

interface VersionDisplayProps {
  showDetails?: boolean;
  className?: string;
}

export default function VersionDisplay({ showDetails = false, className = '' }: VersionDisplayProps) {
  if (!showDetails) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        v{VERSION_INFO.appVersion}
      </div>
    );
  }

  return (
    <div className={`space-y-1 text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center space-x-1">
        <Info className="w-3 h-3" />
        <span>v{VERSION_INFO.appVersion}</span>
      </div>
      <div className="text-xs opacity-75">
        Build {VERSION_INFO.buildNumber}
      </div>
      <div className="text-xs opacity-75">
        PWA {VERSION_INFO.pwaVersion}
      </div>
    </div>
  );
}
