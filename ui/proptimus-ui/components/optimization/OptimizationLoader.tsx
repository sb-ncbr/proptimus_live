"use client"

import React from 'react';
import { ProteinOptimizationAnimation } from './ProteinOptimizationAnimation';
import { Loader2 } from 'lucide-react';

interface OptimizationLoaderProps {
  status: 'running' | 'finished' | 'queued' | 'unsubmitted' | 'error';
  message?: string;
  remaining_time?: string;
  className?: string;
}

export function OptimizationLoader({
  status,
  message,
  remaining_time,
  className = ""
}: OptimizationLoaderProps) {
  const getStatusMessage = () => {
    if (status === 'error') return 'Optimization failed';
    if (status === 'finished') return 'Optimization complete!';
    if (status === 'queued') return 'Your job is in the queue...';
    if (status === 'unsubmitted') return 'Preparing optimization...';
    if (message) return message;
    return 'Optimizing your protein structure...';
  };

  const getProgressColor = () => {
    if (status === 'error') return 'bg-red-600';
    if (status === 'finished') return 'bg-green-600';
    return 'bg-blue-600';
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-8 p-8 animate-in fade-in duration-300 ${className}`}>
      {/* Animation */}
      <div className="relative">
        <ProteinOptimizationAnimation />
        {status === 'finished' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl">✅</div>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl">❌</div>
          </div>
        )}
      </div>

      {/* Status message with spinner */}
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Protein Structure Optimization
          </h3>
          <div className="flex items-center justify-center gap-2 mt-4">
            {(status === 'running' || status === 'queued' || status === 'unsubmitted') && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getStatusMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Additional status information */}
      {(status === 'running' || status === 'queued') && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
          {remaining_time && (
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              ⏱️ Estimated maximum remaining time: {remaining_time}
            </p>
          )}
          {status === 'queued' && (
            <p className="text-yellow-600 dark:text-yellow-400 font-medium">
              ⏳ Your optimization is queued and will start shortly
            </p>
          )}
          <p>If you want to leave the page, save the URL for later access to the optimization results.</p>
        </div>
      )}
    </div>
  );
}
