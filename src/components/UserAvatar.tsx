'use client';

import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export default function UserAvatar({ 
  name, 
  size = 'md', 
  className = '', 
  onClick 
}: UserAvatarProps) {
  // Extract first letter of each word
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2); // Limit to 2 characters max
  };

  const initials = getInitials(name);
  
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const baseClasses = `
    rounded-full 
    bg-primary 
    text-primary-foreground 
    flex 
    items-center 
    justify-center 
    font-semibold 
    select-none
    ${sizeClasses[size]}
    ${onClick ? 'cursor-pointer hover:bg-primary/90 transition-colors' : ''}
    ${className}
  `.trim();

  return (
    <div 
      className={baseClasses}
      onClick={onClick}
      title={name}
    >
      {initials || <User className="w-4 h-4" />}
    </div>
  );
}
