'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Sun, Moon, Cloud, Star, Zap, Coffee, Clock } from 'lucide-react';

type View = 'home' | 'todos' | 'calendar' | 'reports';

interface AnimatedHeroProps {
  greeting: string;
  motivationalMessage: string;
  todaysTodos: number;
  completedToday: number;
  totalTodos: number;
  onNavigate: (view: View) => void;
}

export default function AnimatedHero({
  greeting,
  motivationalMessage,
  todaysTodos,
  completedToday,
  totalTodos,
  onNavigate
}: AnimatedHeroProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'dusk';
    return 'night';
  };

  const timeOfDay = getTimeOfDay();

  const getBackgroundStyle = () => {
    switch (timeOfDay) {
      case 'dawn':
        return {
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
          animation: 'dawnGlow 8s ease-in-out infinite alternate'
        };
      case 'morning':
        return {
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          animation: 'morningRise 6s ease-in-out infinite alternate'
        };
      case 'afternoon':
        return {
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          animation: 'afternoonFlow 7s ease-in-out infinite alternate'
        };
      case 'evening':
        return {
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
          animation: 'eveningGlow 9s ease-in-out infinite alternate'
        };
      case 'dusk':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          animation: 'duskShift 10s ease-in-out infinite alternate'
        };
      case 'night':
        return {
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          animation: 'nightPulse 12s ease-in-out infinite alternate'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          animation: 'defaultFlow 8s ease-in-out infinite alternate'
        };
    }
  };

  const getFloatingIcons = () => {
    const icons = [];
    const iconCount = 8;
    
    for (let i = 0; i < iconCount; i++) {
      const delay = i * 0.5;
      const duration = 3 + (i % 3);
      const size = 20 + (i % 3) * 8;
      const left = 10 + (i * 12);
      const top = 20 + (i % 4) * 20;
      
      let IconComponent;
      let iconClass = '';
      
      switch (timeOfDay) {
        case 'dawn':
          IconComponent = Sun;
          iconClass = 'text-yellow-300';
          break;
        case 'morning':
          IconComponent = Coffee;
          iconClass = 'text-amber-600';
          break;
        case 'afternoon':
          IconComponent = Zap;
          iconClass = 'text-blue-400';
          break;
        case 'evening':
          IconComponent = Cloud;
          iconClass = 'text-orange-300';
          break;
        case 'dusk':
          IconComponent = Star;
          iconClass = 'text-purple-300';
          break;
        case 'night':
          IconComponent = Moon;
          iconClass = 'text-blue-200';
          break;
        default:
          IconComponent = Clock;
          iconClass = 'text-white';
      }
      
      icons.push(
        <div
          key={i}
          className={`absolute ${iconClass} opacity-60 animate-float`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            fontSize: `${size}px`
          }}
        >
          <IconComponent className="w-6 h-6" />
        </div>
      );
    }
    
    return icons;
  };

  return (
    <>
      <style jsx>{`
        @keyframes dawnGlow {
          0% { filter: hue-rotate(0deg) brightness(1); }
          100% { filter: hue-rotate(10deg) brightness(1.1); }
        }
        
        @keyframes morningRise {
          0% { filter: brightness(1) saturate(1); }
          100% { filter: brightness(1.2) saturate(1.3); }
        }
        
        @keyframes afternoonFlow {
          0% { filter: hue-rotate(0deg) saturate(1); }
          100% { filter: hue-rotate(15deg) saturate(1.2); }
        }
        
        @keyframes eveningGlow {
          0% { filter: brightness(1) hue-rotate(0deg); }
          100% { filter: brightness(1.1) hue-rotate(-10deg); }
        }
        
        @keyframes duskShift {
          0% { filter: hue-rotate(0deg) brightness(1); }
          100% { filter: hue-rotate(20deg) brightness(0.9); }
        }
        
        @keyframes nightPulse {
          0% { filter: brightness(0.8) saturate(0.8); }
          100% { filter: brightness(1.1) saturate(1.2); }
        }
        
        @keyframes defaultFlow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
          75% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes drift {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(-5px) translateY(-10px); }
          75% { transform: translateX(-10px) translateY(5px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 8s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative overflow-hidden text-white px-4 py-8 md:py-12"
        style={getBackgroundStyle()}
      >
        {/* Floating Background Icons */}
        {getFloatingIcons()}
        
        {/* Sparkle Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 animate-drift">
              {greeting}
            </h2>
            <p className="text-white/90 text-lg mb-6 animate-drift" style={{ animationDelay: '0.5s' }}>
              {motivationalMessage}
            </p>
          </div>
          
          {/* Quick Stats with enhanced animations */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold animate-drift" style={{ animationDelay: '1s' }}>
                {todaysTodos}
              </div>
              <div className="text-sm text-white/80">Today&apos;s Tasks</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold animate-drift" style={{ animationDelay: '1.2s' }}>
                {completedToday}
              </div>
              <div className="text-sm text-white/80">Completed</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold animate-drift" style={{ animationDelay: '1.4s' }}>
                {totalTodos}
              </div>
              <div className="text-sm text-white/80">Total Todos</div>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => onNavigate('todos')}
              className="mobile-button bg-white text-gray-800 hover:bg-white/90 focus-ring transform hover:scale-105 transition-all duration-300 shadow-lg animate-drift"
              style={{ animationDelay: '1.6s' }}
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Add New Todo
            </button>
          </div>
        </div>
        
        {/* Time-specific decorative elements */}
        {timeOfDay === 'dawn' && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200/20 rounded-full animate-pulse" />
            <div className="absolute top-20 right-20 w-24 h-24 bg-orange-200/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        
        {timeOfDay === 'night' && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-16 left-1/4 w-2 h-2 bg-white rounded-full animate-sparkle" />
            <div className="absolute top-24 right-1/3 w-1 h-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-32 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-sparkle" style={{ animationDelay: '1s' }} />
            <div className="absolute top-20 right-1/4 w-1 h-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '1.5s' }} />
          </div>
        )}
        
        {timeOfDay === 'afternoon' && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-12 right-12 w-20 h-20 bg-blue-200/30 rounded-full animate-float" />
            <div className="absolute top-24 left-16 w-16 h-16 bg-cyan-200/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          </div>
        )}
      </div>
    </>
  );
}
