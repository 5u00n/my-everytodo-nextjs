'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DynamicTextColorProps {
  children: React.ReactNode;
  className?: string;
  lightClassName?: string;
  darkClassName?: string;
  threshold?: number; // 0-255, default 128
}

export function DynamicTextColor({ 
  children, 
  className = '', 
  lightClassName = 'text-gray-900',
  darkClassName = 'text-white',
  threshold = 128 
}: DynamicTextColorProps) {
  const [textColor, setTextColor] = useState(lightClassName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTextColor = () => {
      if (!containerRef.current) return;

      // Get the computed background color
      const computedStyle = window.getComputedStyle(containerRef.current);
      const backgroundColor = computedStyle.backgroundColor;
      
      // If background is transparent, check parent elements
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        let parent = containerRef.current.parentElement;
        let parentBg = '';
        
        while (parent && (!parentBg || parentBg === 'rgba(0, 0, 0, 0)' || parentBg === 'transparent')) {
          const parentStyle = window.getComputedStyle(parent);
          parentBg = parentStyle.backgroundColor;
          parent = parent.parentElement;
        }
        
        if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
          const brightness = getBrightness(parentBg);
          setTextColor(brightness > threshold ? lightClassName : darkClassName);
        }
      } else {
        const brightness = getBrightness(backgroundColor);
        setTextColor(brightness > threshold ? lightClassName : darkClassName);
      }
    };

    // Initial check
    updateTextColor();

    // Set up ResizeObserver to watch for background changes
    const resizeObserver = new ResizeObserver(updateTextColor);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for style changes
    const mutationObserver = new MutationObserver(updateTextColor);
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Listen for scroll events (in case background changes on scroll)
    const handleScroll = () => {
      requestAnimationFrame(updateTextColor);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lightClassName, darkClassName, threshold]);

  return (
    <div ref={containerRef} className={`${className} ${textColor}`}>
      {children}
    </div>
  );
}

// Helper function to calculate brightness of a color
function getBrightness(color: string): number {
  // Convert color to RGB values
  let r: number, g: number, b: number;
  
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    } else {
      return 128; // Default threshold
    }
  } else if (color.startsWith('#')) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return 128; // Default threshold
  }
  
  // Calculate relative luminance using the standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance;
}

// Hook for using dynamic text color
export function useDynamicTextColor(
  lightClassName: string = 'text-gray-900',
  darkClassName: string = 'text-white',
  threshold: number = 128
) {
  const [textColor, setTextColor] = useState(lightClassName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTextColor = () => {
      if (!containerRef.current) return;

      const computedStyle = window.getComputedStyle(containerRef.current);
      const backgroundColor = computedStyle.backgroundColor;
      
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        let parent = containerRef.current.parentElement;
        let parentBg = '';
        
        while (parent && (!parentBg || parentBg === 'rgba(0, 0, 0, 0)' || parentBg === 'transparent')) {
          const parentStyle = window.getComputedStyle(parent);
          parentBg = parentStyle.backgroundColor;
          parent = parent.parentElement;
        }
        
        if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
          const brightness = getBrightness(parentBg);
          setTextColor(brightness > threshold ? lightClassName : darkClassName);
        }
      } else {
        const brightness = getBrightness(backgroundColor);
        setTextColor(brightness > threshold ? lightClassName : darkClassName);
      }
    };

    updateTextColor();

    const resizeObserver = new ResizeObserver(updateTextColor);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const mutationObserver = new MutationObserver(updateTextColor);
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    const handleScroll = () => {
      requestAnimationFrame(updateTextColor);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lightClassName, darkClassName, threshold]);

  return { textColor, containerRef };
}
