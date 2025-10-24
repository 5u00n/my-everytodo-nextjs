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
  const lastUpdateTime = useRef<number>(0);

  useEffect(() => {
    const sampleBackgroundImage = async () => {
      if (!containerRef.current) return;

      // Sampling background image for dynamic text color

      try {
        // Find the AnimatedHero main div specifically
        let heroElement = document.querySelector('.relative.overflow-hidden.text-white.px-4.py-8') as HTMLElement;
        
        // If not found, try the md:py-12 variant
        if (!heroElement) {
          heroElement = document.querySelector('.relative.overflow-hidden.text-white.px-4') as HTMLElement;
        }
        
        // If still not found, look for any div with the specific classes
        if (!heroElement) {
          const allDivs = document.querySelectorAll('div');
          for (const div of allDivs) {
            if (div.classList.contains('relative') && 
                div.classList.contains('overflow-hidden') && 
                div.classList.contains('text-white')) {
              const style = (div as HTMLElement).style;
              if (style.backgroundImage && style.backgroundImage !== 'none') {
                heroElement = div as HTMLElement;
                break;
              }
            }
          }
        }
        
        if (!heroElement) {
          updateTextColorFromCSS();
          return;
        }

        // Get the background image URL
        const computedStyle = window.getComputedStyle(heroElement);
        const backgroundImage = computedStyle.backgroundImage;
        
        if (!backgroundImage || backgroundImage === 'none') {
          updateTextColorFromCSS();
          return;
        }

        // Extract image URL from CSS - handle multiple backgrounds (gradients + image)
        const urlMatches = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/g);
        if (!urlMatches || urlMatches.length === 0) {
          updateTextColorFromCSS();
          return;
        }
        
        // Get the last URL (the actual image, not the gradient)
        const lastUrlMatch = urlMatches[urlMatches.length - 1];
        const imageUrl = lastUrlMatch.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
        
        if (!imageUrl) {
          updateTextColorFromCSS();
          return;
        }

        // Create image element to sample colors
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Create canvas to sample the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Calculate text position relative to background
            const heroRect = heroElement.getBoundingClientRect();
            const textRect = containerRef.current?.getBoundingClientRect();
            
            if (!textRect) {
              return;
            }
            
            // Get current animation state from computed styles
            const computedStyle = window.getComputedStyle(heroElement);
            const backgroundPosition = computedStyle.backgroundPosition;
            const backgroundSize = computedStyle.backgroundSize;
            
            // Parse background position and size to understand the current animation state
            const bgPos = backgroundPosition.split(' ').map(p => p.replace('%', ''));
            const bgSize = backgroundSize.split(' ').map(s => s.replace('%', ''));
            
            const bgX = parseFloat(bgPos[0]) || 0;
            const bgY = parseFloat(bgPos[1]) || 0;
            const bgWidth = parseFloat(bgSize[0]) || 100;
            const bgHeight = parseFloat(bgSize[1]) || 100;
            
            // Calculate the actual image dimensions being displayed
            const displayWidth = (img.width * bgWidth) / 100;
            const displayHeight = (img.height * bgHeight) / 100;
            
            // Calculate the offset of the current viewport
            const offsetX = (img.width - displayWidth) * (bgX / 100);
            const offsetY = (img.height - displayHeight) * (bgY / 100);
            
            // Set canvas size to match the entire text div area
            const divWidth = textRect.width;
            const divHeight = textRect.height;
            canvas.width = Math.min(200, divWidth);
            canvas.height = Math.min(200, divHeight);

            // Calculate where the text appears relative to the background
            const textRelativeX = (textRect.left - heroRect.left) / heroRect.width;
            const textRelativeY = (textRect.top - heroRect.top) / heroRect.height;
            
            // Map the text div area to the background image coordinates considering animation
            const textDivToImageX = (textRelativeX * displayWidth) + offsetX;
            const textDivToImageY = (textRelativeY * displayHeight) + offsetY;
            const textDivToImageWidth = (divWidth / heroRect.width) * displayWidth;
            const textDivToImageHeight = (divHeight / heroRect.height) * displayHeight;

            // Draw the mapped area from the image to canvas (considering current animation state)
            ctx.drawImage(
              img,
              textDivToImageX, textDivToImageY, // Source position (mapped to current animation state)
              textDivToImageWidth, textDivToImageHeight, // Source size
              0, 0, // Destination position
              canvas.width, canvas.height // Destination size
            );

            // Note: Visual indicators removed to avoid interfering with color calculations

            // Sample pixels across the entire canvas (representing the entire div)
            let totalR = 0, totalG = 0, totalB = 0;
            let sampleCount = 0;

            // Sample every 5th pixel across the entire canvas for performance
            const step = 5;
            for (let x = 0; x < canvas.width; x += step) {
              for (let y = 0; y < canvas.height; y += step) {
                const pixelData = ctx.getImageData(x, y, 1, 1).data;
                totalR += pixelData[0];
                totalG += pixelData[1];
                totalB += pixelData[2];
                sampleCount++;
              }
            }

            if (sampleCount > 0) {
              const avgR = totalR / sampleCount;
              const avgG = totalG / sampleCount;
              const avgB = totalB / sampleCount;
              
              // Calculate brightness using perceptual luminance
              const brightness = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
              
              // Calculate high-contrast inverted color (same hue, dramatic brightness change)
              const isBright = brightness > threshold;
              const contrastMultiplier = isBright ? 0.3 : 2.5; // Much more dramatic contrast
              
              // Apply dramatic brightness inversion to each RGB channel
              const invertedR = Math.max(0, Math.min(255, avgR * contrastMultiplier));
              const invertedG = Math.max(0, Math.min(255, avgG * contrastMultiplier));
              const invertedB = Math.max(0, Math.min(255, avgB * contrastMultiplier));
              
              // Create dynamic text color using the brightness-inverted RGB values
              const dynamicTextColor = `rgb(${Math.round(invertedR)}, ${Math.round(invertedG)}, ${Math.round(invertedB)})`;
              
              // Apply the dynamic color directly as inline style
              if (containerRef.current) {
                const currentColor = containerRef.current.style.color;
                const newTextShadow = brightness > threshold 
                  ? '2px 2px 4px rgba(0,0,0,0.8)' 
                  : '1px 1px 2px rgba(255,255,255,0.8)';
                
                // Only update if the color actually changed and enough time has passed to prevent flickering
                const now = Date.now();
                if (currentColor !== dynamicTextColor && (now - lastUpdateTime.current) > 500) {
                  lastUpdateTime.current = now;
                  // Apply smooth, slow color transitions
                  containerRef.current.style.transition = 'color 3s ease-in-out, text-shadow 3s ease-in-out';
                  containerRef.current.style.color = dynamicTextColor;
                  containerRef.current.style.textShadow = newTextShadow;
                }
              }
              
              // Visual sampling indicators removed for clean UI

              // Console logging removed for clean output
              
              // Color is applied directly via inline styles above
            }
          } catch (error) {
            updateTextColorFromCSS();
          }
        };

        img.onerror = () => {
          updateTextColorFromCSS();
        };

        img.src = imageUrl;
      } catch (error) {
        updateTextColorFromCSS();
      }
    };

    const updateTextColorFromCSS = () => {
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
          const rgbMatch = parentBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch.map(Number);
            const bgBrightness = (0.299 * r + 0.587 * g + 0.114 * b);
            const isBright = bgBrightness > threshold;
            const contrastMultiplier = isBright ? 0.3 : 2.5; // Much more dramatic contrast
            
            const invertedR = Math.max(0, Math.min(255, r * contrastMultiplier));
            const invertedG = Math.max(0, Math.min(255, g * contrastMultiplier));
            const invertedB = Math.max(0, Math.min(255, b * contrastMultiplier));
            const dynamicColor = `rgb(${Math.round(invertedR)}, ${Math.round(invertedG)}, ${Math.round(invertedB)})`;
            
            if (containerRef.current) {
              const currentColor = containerRef.current.style.color;
              const now = Date.now();
              if (currentColor !== dynamicColor && (now - lastUpdateTime.current) > 500) {
                lastUpdateTime.current = now;
                containerRef.current.style.transition = 'color 3s ease-in-out, text-shadow 3s ease-in-out';
                containerRef.current.style.color = dynamicColor;
                containerRef.current.style.textShadow = bgBrightness > threshold 
                  ? '2px 2px 4px rgba(0,0,0,0.8)' 
                  : '1px 1px 2px rgba(255,255,255,0.8)';
              }
            }
          } else {
            setTextColor(brightness > threshold ? lightClassName : darkClassName);
          }
        }
      } else {
        const brightness = getBrightness(backgroundColor);
        const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          const bgBrightness = (0.299 * r + 0.587 * g + 0.114 * b);
          const invertedBrightness = 255 - bgBrightness;
          const brightnessRatio = invertedBrightness / bgBrightness;
          
          const invertedR = Math.max(0, Math.min(255, r * brightnessRatio));
          const invertedG = Math.max(0, Math.min(255, g * brightnessRatio));
          const invertedB = Math.max(0, Math.min(255, b * brightnessRatio));
          const dynamicColor = `rgb(${Math.round(invertedR)}, ${Math.round(invertedG)}, ${Math.round(invertedB)})`;
          
          if (containerRef.current) {
            containerRef.current.style.transition = 'color 3s ease-in-out, text-shadow 3s ease-in-out';
            containerRef.current.style.color = dynamicColor;
            containerRef.current.style.textShadow = bgBrightness > threshold 
              ? '2px 2px 4px rgba(0,0,0,0.8)' 
              : '1px 1px 2px rgba(255,255,255,0.8)';
          }
        } else {
          setTextColor(brightness > threshold ? lightClassName : darkClassName);
        }
      }
    };

    // Initial check
    sampleBackgroundImage();

    // Set up observers for dynamic updates
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(sampleBackgroundImage);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(sampleBackgroundImage);
    });
    
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Listen for scroll events to update as background changes
    const handleScroll = () => {
      requestAnimationFrame(sampleBackgroundImage);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Update at a moderate rate to allow color changes while avoiding jittering
    const interval = setInterval(sampleBackgroundImage, 2000); // Every 2 seconds

    // Disabled requestAnimationFrame sampling to prevent jittering
    // Only using setInterval for minimal impact on background animation

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
      // No animationId to cancel since requestAnimationFrame is disabled
    };
  }, [lightClassName, darkClassName, threshold]);

  return (
    <div 
      ref={containerRef} 
      className={`${className} ${textColor} transition-colors duration-300`}
      style={{
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
}

// Helper function to calculate brightness of a color
function getBrightness(color: string): number {
  let r: number, g: number, b: number;
  
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    } else {
      return 128;
    }
  } else if (color.startsWith('#')) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return 128;
  }
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance;
}