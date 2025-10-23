'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { Todo } from '@/types';
import TaskDetailModal from './TaskDetailModal';
import TodoModal from './TodoModal';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  CheckCircle2, 
  Circle,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  X
} from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarView() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    if (!user || !database) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const todosRef = ref(database, `todos/${user.id}`);
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      const loadedTodos: Todo[] = [];
      if (data) {
        for (const todoId in data) {
          loadedTodos.push({ id: todoId, ...data[todoId] });
        }
      }
      setTodos(loadedTodos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching todos:", error);
      setLoading(false);
    });

    return () => off(todosRef, 'value', unsubscribe);
  }, [user]);

  const openTaskDetail = (todo: Todo) => {
    setSelectedTask(todo);
    setShowTaskDetailModal(true);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setShowTaskDetailModal(false);
  };

  const toggleTodo = async (todoId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const now = Date.now();
    const updatedTodo = {
      ...todo,
      isCompleted: !todo.isCompleted,
      updatedAt: now,
      completedAt: !todo.isCompleted ? now : undefined
    };

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, updatedTodo);
  };

  const toggleTask = async (todoId: string, taskId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo || !todo.tasks) return;

    const updatedTasks = todo.tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );

    const allTasksCompleted = updatedTasks.every(task => task.isCompleted);
    const now = Date.now();
    const updatedTodo = {
      ...todo,
      tasks: updatedTasks,
      isCompleted: allTasksCompleted,
      updatedAt: now,
      completedAt: allTasksCompleted ? now : undefined,
    };

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, updatedTodo);
  };

  const deleteTodo = async (todoId: string) => {
    if (!user || !database) return;

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await remove(todoRef);
  };

  const updateTodo = async (todoId: string, updatedFields: Partial<Todo>) => {
    if (!user || !database) return;

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, { ...updatedFields, updatedAt: Date.now() });
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else { // day view
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else { // day view
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const getTodosForDay = (date: Date) => {
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      return isSameDay(todoDate, date);
    }).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

  const renderMonthView = () => {
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(startMonth, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(endMonth, { weekStartsOn: 1 }); // Monday end

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-full flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted flex-shrink-0">
          {dayNames.map(day => (
            <div key={day} className="text-center font-medium text-muted-foreground py-2 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid - Maximized */}
        <div className="grid grid-cols-7 flex-1 min-h-0">
          {days.map((day, index) => {
            const dayTodos = getTodosForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isTodayDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`relative p-1 text-left border-r border-b border-border last:border-r-0 transition-colors flex flex-col min-h-[100px] md:min-h-[120px] ${
                  isCurrentMonth ? 'bg-card' : 'bg-muted/50 text-muted-foreground'
                } ${
                  isTodayDay ? 'bg-primary/10' : ''
                } ${
                  isSelected ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDay ? 'text-primary' : isCurrentMonth ? 'text-card-foreground' : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {/* Todo indicators */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayTodos.slice(0, 2).map(todo => (
                    <div key={todo.id} className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 truncate cursor-pointer hover:bg-primary/20" onClick={() => openTaskDetail(todo)}>
                      <Bell className="inline-block w-2 h-2 mr-1" /> 
                      {format(new Date(todo.scheduledTime), 'HH:mm')} {todo.title}
                    </div>
                  ))}
                  {dayTodos.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayTodos.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startWeek, end: endWeek });

    return (
      <div className="space-y-3 h-full overflow-y-auto">
        {days.map(day => {
          const dayTodos = getTodosForDay(day);
          const isTodayDay = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div 
              key={format(day, 'yyyy-MM-dd')} 
              className={`macos-card p-4 ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  isTodayDay ? 'text-primary' : 'text-card-foreground'
                }`}>
                  {format(day, 'EEE, MMM d')} {isTodayDay && '(Today)'}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {dayTodos.length} {dayTodos.length === 1 ? 'task' : 'tasks'}
                </div>
              </div>
              
              <div className="space-y-2">
                {dayTodos.length > 0 ? (
                  dayTodos.map(todo => (
                    <div key={todo.id} className="flex items-center text-sm cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => openTaskDetail(todo)}>
                      <Bell className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-muted-foreground mr-2">
                        {format(new Date(todo.scheduledTime), 'HH:mm')}
                      </span>
                      <span className="text-card-foreground">{todo.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No todos scheduled</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTodos = getTodosForDay(currentDate);
    const isTodayDay = isToday(currentDate);

    return (
      <div className="macos-card p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${
            isTodayDay ? 'text-primary' : 'text-card-foreground'
          }`}>
            {format(currentDate, 'EEEE, MMMM d, yyyy')} {isTodayDay && '(Today)'}
          </h2>
          <div className="text-sm text-muted-foreground">
            {dayTodos.length} {dayTodos.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
        
        <div className="space-y-4">
          {dayTodos.length > 0 ? (
            dayTodos.map(todo => (
              <div key={todo.id} className="border-b border-border pb-4 last:border-b-0 cursor-pointer hover:bg-muted/30 p-3 rounded" onClick={() => openTaskDetail(todo)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 mr-3 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{todo.title}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(todo.scheduledTime), 'h:mm a')}
                  </div>
                </div>
                
                {todo.description && (
                  <p className="text-muted-foreground ml-8 mb-3">{todo.description}</p>
                )}
                
                <div className="ml-8 space-y-2">
                  {todo.tasks && todo.tasks.length > 0 ? (
                    todo.tasks.map((task, index) => (
                      <div key={index} className="flex items-center">
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 mr-2 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${
                          task.isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'
                        }`}>
                          {task.text}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tasks defined</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No todos scheduled for this day.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col calendar-maximized">
      {/* Header - Compact for desktop */}
      <div className="bg-background shadow-sm border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">Calendar</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* View Mode Selector and Date - Inline for desktop */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                viewMode === 'month'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                viewMode === 'week'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4 mr-1" />
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                viewMode === 'day'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-1" />
              Day
            </button>
          </div>

          {/* Date Display - Inline */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
              {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
              {viewMode === 'day' && format(currentDate, 'MMM d, yyyy')}
            </h3>
          </div>
        </div>
      </div>

      {/* Calendar Content - Maximized for desktop */}
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Selected Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-card rounded-t-2xl md:rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto slide-up">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'EEEE, MMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 text-muted-foreground hover:text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {getTodosForDay(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getTodosForDay(selectedDate).map(todo => (
                    <div key={todo.id} className="macos-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{todo.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(todo.scheduledTime), 'h:mm a')}
                        </div>
                      </div>
                      {todo.description && (
                        <p className="text-sm text-muted-foreground mb-2">{todo.description}</p>
                      )}
                      {todo.tasks && todo.tasks.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {todo.tasks.filter(task => !task.isCompleted).length} of {todo.tasks.length} tasks remaining
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No todos scheduled for this day</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskDetailModal}
        onClose={closeTaskDetail}
        task={selectedTask}
        onToggleTask={toggleTodo}
        onToggleSubTask={toggleTask}
        onEditTask={(task) => {
          setEditingTodo(task);
          setShowEditModal(true);
          closeTaskDetail();
        }}
        onDeleteTask={deleteTodo}
      />

      {/* Edit Todo Modal */}
      <TodoModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTodo(null);
        }}
        onSubmit={(updatedFields) => {
          if (editingTodo) {
            updateTodo(editingTodo.id, updatedFields);
          }
        }}
        title="Edit Todo"
        initialData={editingTodo}
      />
    </div>
  );
}