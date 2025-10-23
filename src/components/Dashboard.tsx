'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Calendar, BarChart3, Plus, Menu, User, LogOut } from 'lucide-react';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';
import CreateTodoModal from './CreateTodoModal';
import { useRouter } from 'next/navigation';

type ViewType = 'todos' | 'calendar' | 'reports';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view);
    // Update URL without page reload
    const path = view === 'todos' ? '/' : `/${view}`;
    router.push(path, { scroll: false });
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
        return <TodoList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Bell className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">EveryTodo</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => handleNavigation('todos')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'todos'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    Todos
                  </div>
                </button>
                <button
                  onClick={() => handleNavigation('calendar')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'calendar'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </div>
                </button>
                <button
                  onClick={() => handleNavigation('reports')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'reports'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reports
                  </div>
                </button>
              </nav>

              {/* Add Todo Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Todo
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.displayName}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          <div className="flex space-x-1">
            <button
              onClick={() => handleNavigation('todos')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium ${
                currentView === 'todos'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="h-4 w-4 mr-2" />
              Todos
            </button>
            <button
              onClick={() => handleNavigation('calendar')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium ${
                currentView === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </button>
            <button
              onClick={() => handleNavigation('reports')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium ${
                currentView === 'reports'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>

      {/* Create Todo Modal */}
      {showCreateModal && (
        <CreateTodoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh the current view
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
