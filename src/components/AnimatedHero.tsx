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

  const getBackgroundImage = () => {
    switch (timeOfDay) {
      case 'dawn':
        return 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      case 'morning':
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      case 'afternoon':
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      case 'evening':
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      case 'dusk':
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      case 'night':
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      default:
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
    }
  };

  const getColorOverlay = () => {
    switch (timeOfDay) {
      case 'dawn':
        return 'linear-gradient(135deg, rgba(255, 154, 158, 0.3) 0%, rgba(254, 207, 239, 0.2) 100%)';
      case 'morning':
        return 'linear-gradient(135deg, rgba(255, 236, 210, 0.4) 0%, rgba(252, 182, 159, 0.3) 100%)';
      case 'afternoon':
        return 'linear-gradient(135deg, rgba(168, 237, 234, 0.3) 0%, rgba(254, 214, 227, 0.2) 100%)';
      case 'evening':
        return 'linear-gradient(135deg, rgba(255, 154, 158, 0.4) 0%, rgba(250, 208, 196, 0.3) 100%)';
      case 'dusk':
        return 'linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.3) 100%)';
      case 'night':
        return 'linear-gradient(135deg, rgba(44, 62, 80, 0.5) 0%, rgba(52, 152, 219, 0.3) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.2) 100%)';
    }
  };

  const getBackgroundStyle = () => {
    const backgroundImage = getBackgroundImage();
    const colorOverlay = getColorOverlay();
    
    return {
      backgroundImage: `${colorOverlay}, url('${backgroundImage}')`,
      backgroundSize: '120% 120%',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      animation: 'panZoom 20s ease-in-out infinite'
    };
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
        @keyframes panZoom {
          0% { 
            background-position: 0% 0%;
            background-size: 120% 120%;
            filter: brightness(1) contrast(1);
          }
          25% { 
            background-position: 25% 25%;
            background-size: 130% 130%;
            filter: brightness(1.05) contrast(1.05);
          }
          50% { 
            background-position: 50% 50%;
            background-size: 140% 140%;
            filter: brightness(1.1) contrast(1.1);
          }
          75% { 
            background-position: 75% 25%;
            background-size: 130% 130%;
            filter: brightness(1.05) contrast(1.05);
          }
          100% { 
            background-position: 100% 0%;
            background-size: 120% 120%;
            filter: brightness(1) contrast(1);
          }
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
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {greeting}
            </h2>
            <p className="text-white/90 text-lg mb-6">
              {motivationalMessage}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold">
                {todaysTodos}
              </div>
              <div className="text-sm text-white/80">Today&apos;s Tasks</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold">
                {completedToday}
              </div>
              <div className="text-sm text-white/80">Completed</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold">
                {totalTodos}
              </div>
              <div className="text-sm text-white/80">Total Todos</div>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => onNavigate('todos')}
              className="mobile-button bg-white text-gray-800 hover:bg-white/90 focus-ring transform hover:scale-105 transition-all duration-300 shadow-lg"
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