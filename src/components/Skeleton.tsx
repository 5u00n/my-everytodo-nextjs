'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Predefined skeleton components for common use cases
export function TodoSkeleton() {
  return (
    <div className="macos-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TodoListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <TodoSkeleton key={i} />
      ))}
    </div>
  );
}

export function HomeViewSkeleton() {
  return (
    <div className="min-h-full bg-background">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
          <div className="flex justify-center space-x-8 mt-8">
            <div className="text-center">
              <Skeleton className="h-12 w-12 mx-auto rounded-full" />
              <Skeleton className="h-4 w-16 mt-2" />
            </div>
            <div className="text-center">
              <Skeleton className="h-12 w-12 mx-auto rounded-full" />
              <Skeleton className="h-4 w-16 mt-2" />
            </div>
            <div className="text-center">
              <Skeleton className="h-12 w-12 mx-auto rounded-full" />
              <Skeleton className="h-4 w-16 mt-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upcoming Tasks Skeleton */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <TodoListSkeleton />
        </section>

        {/* Quick Actions Skeleton */}
        <section>
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="macos-card p-6 text-center space-y-2">
              <Skeleton className="h-8 w-8 mx-auto rounded" />
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
            <div className="macos-card p-6 text-center space-y-2">
              <Skeleton className="h-8 w-8 mx-auto rounded" />
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="macos-card p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
