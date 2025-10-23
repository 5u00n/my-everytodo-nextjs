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
    const minute = currentTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    // Midnight: 12:00 AM - 5:30 AM
    if (timeInMinutes >= 0 && timeInMinutes < 330) return 'midnight';
    
    // Dawn: 5:30 AM - 7:30 AM
    if (timeInMinutes >= 330 && timeInMinutes < 450) return 'dawn';
    
    // Early Morning: 7:31 AM - 9:30 AM
    if (timeInMinutes >= 451 && timeInMinutes < 570) return 'early-morning';
    
    // Late Morning: 9:30 AM - 12:00 PM
    if (timeInMinutes >= 570 && timeInMinutes < 720) return 'late-morning';
    
    // Afternoon: 12:01 PM - 3:00 PM
    if (timeInMinutes >= 721 && timeInMinutes < 900) return 'afternoon';
    
    // Evening: 3:31 PM - 5:30 PM
    if (timeInMinutes >= 931 && timeInMinutes < 1050) return 'evening';
    
    // Sunset: 5:30 PM - 6:30 PM
    if (timeInMinutes >= 1050 && timeInMinutes < 1170) return 'sunset';
    
    // After Sunset: 6:31 PM - 7:00 PM
    if (timeInMinutes >= 1171 && timeInMinutes < 1200) return 'aftersunset';
    
    // Early Night: 7:00 PM - 9:00 PM
    if (timeInMinutes >= 1200 && timeInMinutes < 1320) return 'early-night';
    
    // Late Night: 9:00 PM - 11:00 PM
    if (timeInMinutes >= 1320 && timeInMinutes < 1440) return 'late-night';
    
    // Night: 11:00 PM - 12:00 PM (next day)
    return 'night';
  };

  const timeOfDay = getTimeOfDay();

  const getBackgroundImage = () => {
    switch (timeOfDay) {
      case 'midnight':
        return '/images/backgrounds/midnight-12_00am-5_30am.jpg';
      case 'dawn':
        return '/images/backgrounds/dawn-5_30am-7_30am.jpg';
      case 'early-morning':
        return '/images/backgrounds/morning-7_31am-9_30am.jpg';
      case 'late-morning':
        return '/images/backgrounds/morning-9_30am-12_00pm.jpg';
      case 'afternoon':
        return '/images/backgrounds/afternoon-12_01pm-3_00pm.jpg';
      case 'evening':
        return '/images/backgrounds/evening-3_31pm-5_30pm.jpg';
      case 'sunset':
        return '/images/backgrounds/sunset-5_30pm-6_30pm.jpg';
      case 'aftersunset':
        return '/images/backgrounds/aftersunset-6_31pm-7_00pm.jpg';
      case 'early-night':
        return '/images/backgrounds/night-7_00pm-9_00pm.jpg';
      case 'late-night':
        return '/images/backgrounds/night-9_00pm-11_00pm.jpg';
      case 'night':
        return '/images/backgrounds/night-11_00pm-12_pm.jpg';
      default:
        return '/images/backgrounds/morning-7_31am-9_30am.jpg';
    }
  };

  const getColorOverlay = () => {
    switch (timeOfDay) {
      case 'midnight':
        return 'linear-gradient(135deg, rgba(25, 25, 50, 0.6) 0%, rgba(75, 0, 130, 0.4) 100%)';
      case 'dawn':
        return 'linear-gradient(135deg, rgba(255, 154, 158, 0.3) 0%, rgba(254, 207, 239, 0.2) 100%)';
      case 'early-morning':
        return 'linear-gradient(135deg, rgba(255, 236, 210, 0.4) 0%, rgba(252, 182, 159, 0.3) 100%)';
      case 'late-morning':
        return 'linear-gradient(135deg, rgba(255, 245, 200, 0.3) 0%, rgba(255, 200, 100, 0.2) 100%)';
      case 'afternoon':
        return 'linear-gradient(135deg, rgba(168, 237, 234, 0.3) 0%, rgba(254, 214, 227, 0.2) 100%)';
      case 'evening':
        return 'linear-gradient(135deg, rgba(255, 154, 158, 0.4) 0%, rgba(250, 208, 196, 0.3) 100%)';
      case 'sunset':
        return 'linear-gradient(135deg, rgba(255, 100, 100, 0.5) 0%, rgba(255, 150, 50, 0.3) 100%)';
      case 'aftersunset':
        return 'linear-gradient(135deg, rgba(255, 50, 100, 0.4) 0%, rgba(150, 50, 150, 0.3) 100%)';
      case 'early-night':
        return 'linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.3) 100%)';
      case 'late-night':
        return 'linear-gradient(135deg, rgba(44, 62, 80, 0.5) 0%, rgba(52, 152, 219, 0.3) 100%)';
      case 'night':
        return 'linear-gradient(135deg, rgba(25, 25, 50, 0.6) 0%, rgba(75, 0, 130, 0.4) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(255, 236, 210, 0.4) 0%, rgba(252, 182, 159, 0.3) 100%)';
    }
  };

  const getBackgroundStyle = () => {
    const backgroundImage = getBackgroundImage();
    const colorOverlay = getColorOverlay();
    
    return {
      backgroundImage: `${colorOverlay}, url('${backgroundImage}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      animation: 'panZoom 60s ease-in-out infinite'
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
        case 'midnight':
          IconComponent = Star;
          iconClass = 'text-purple-400';
          break;
        case 'dawn':
          IconComponent = Sun;
          iconClass = 'text-yellow-300';
          break;
        case 'early-morning':
          IconComponent = Coffee;
          iconClass = 'text-amber-600';
          break;
        case 'late-morning':
          IconComponent = Sun;
          iconClass = 'text-orange-400';
          break;
        case 'afternoon':
          IconComponent = Zap;
          iconClass = 'text-blue-400';
          break;
        case 'evening':
          IconComponent = Cloud;
          iconClass = 'text-orange-300';
          break;
        case 'sunset':
          IconComponent = Sun;
          iconClass = 'text-red-400';
          break;
        case 'aftersunset':
          IconComponent = Star;
          iconClass = 'text-pink-400';
          break;
        case 'early-night':
          IconComponent = Star;
          iconClass = 'text-purple-300';
          break;
        case 'late-night':
          IconComponent = Moon;
          iconClass = 'text-blue-200';
          break;
        case 'night':
          IconComponent = Moon;
          iconClass = 'text-indigo-300';
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
            background-position: 0% 50%;
            background-size: cover;
            filter: brightness(1) contrast(1);
          }
          12.5% { 
            background-position: 25% 25%;
            background-size: cover;
            filter: brightness(1.02) contrast(1.02);
          }
          25% { 
            background-position: 50% 0%;
            background-size: cover;
            filter: brightness(1.05) contrast(1.05);
          }
          37.5% { 
            background-position: 75% 25%;
            background-size: cover;
            filter: brightness(1.02) contrast(1.02);
          }
          50% { 
            background-position: 100% 50%;
            background-size: cover;
            filter: brightness(1) contrast(1);
          }
          62.5% { 
            background-position: 75% 75%;
            background-size: cover;
            filter: brightness(1.02) contrast(1.02);
          }
          75% { 
            background-position: 50% 100%;
            background-size: cover;
            filter: brightness(1.05) contrast(1.05);
          }
          87.5% { 
            background-position: 25% 75%;
            background-size: cover;
            filter: brightness(1.02) contrast(1.02);
          }
          100% { 
            background-position: 0% 50%;
            background-size: cover;
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
        {timeOfDay === 'midnight' && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-16 left-1/4 w-3 h-3 bg-purple-400 rounded-full animate-sparkle" />
            <div className="absolute top-24 right-1/3 w-2 h-2 bg-purple-300 rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-32 left-1/2 w-2.5 h-2.5 bg-purple-500 rounded-full animate-sparkle" style={{ animationDelay: '0.8s' }} />
            <div className="absolute top-20 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-sparkle" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-40 left-1/3 w-2 h-2 bg-purple-300 rounded-full animate-sparkle" style={{ animationDelay: '0.6s' }} />
            <div className="absolute top-28 right-1/2 w-1 h-1 bg-purple-500 rounded-full animate-sparkle" style={{ animationDelay: '1.8s' }} />
          </div>
        )}
        
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