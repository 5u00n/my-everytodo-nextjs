'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Plus, Calendar, BarChart3, List, Home } from 'lucide-react';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';

type View = 'home' | 'todos' | 'calendar' | 'reports';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'todos':
        return <TodoList />;
      case 'calendar':
        return <CalendarView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">EveryTodo</h1>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-1">
                <button
                  onClick={() => setCurrentView('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'home' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2 inline" />
                  Home
                </button>
                <button
                  onClick={() => setCurrentView('todos')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'todos' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4 mr-2 inline" />
                  Todos
                </button>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'calendar' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2 inline" />
                  Calendar
                </button>
                <button
                  onClick={() => setCurrentView('reports')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'reports' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2 inline" />
                  Reports
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.displayName}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
}

// Home View Component
function HomeView({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to EveryTodo</h2>
          <p className="text-xl text-gray-600">Your personal alarm & task manager with persistent notifications</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl card-hover">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Create New Todo</h3>
                  <p className="text-gray-600">Add alarm & tasks</p>
                </div>
              </div>
              <p className="text-gray-500 mb-6">
                Create todos with persistent alarms that won't stop until all tasks are completed.
              </p>
              <button 
                onClick={() => onNavigate('todos')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Todos →
              </button>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl card-hover">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Calendar View</h3>
                  <p className="text-gray-600">View all todos</p>
                </div>
              </div>
              <p className="text-gray-500 mb-6">
                See your todos and alarms in calendar format with month, week, and day views.
              </p>
              <button 
                onClick={() => onNavigate('calendar')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Open Calendar →
              </button>
            </div>
          </div>

          {/* Reports */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl card-hover">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Activity Reports</h3>
                  <p className="text-gray-600">View statistics</p>
                </div>
              </div>
              <p className="text-gray-500 mb-6">
                Track your productivity and task completion with detailed analytics and reports.
              </p>
              <button 
                onClick={() => onNavigate('reports')}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Reports →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
