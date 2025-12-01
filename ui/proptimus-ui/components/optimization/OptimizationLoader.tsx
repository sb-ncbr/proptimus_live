"use client"

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ProteinOptimizationAnimation } from './ProteinOptimizationAnimation';

interface OptimizationLoaderProps {
  progress: number;
  status: 'running' | 'finished' | 'error';
  message?: string;
  className?: string;
}

export function OptimizationLoader({
  progress,
  status,
  message,
  className = ""
}: OptimizationLoaderProps) {
  const getStatusMessage = () => {
    if (status === 'error') return 'Optimization failed';
    if (status === 'finished') return 'Optimization complete!';
    if (message) return message;

    if (progress < 20) return 'Initializing protein structure...';
    if (progress < 40) return 'Analyzing molecular bonds...';
    if (progress < 60) return 'Optimizing geometry...';
    if (progress < 80) return 'Refining structure...';
    if (progress < 95) return 'Finalizing optimization...';
    return 'Completing optimization...';
  };

  const getProgressColor = () => {
    if (status === 'error') return 'bg-red-600';
    if (status === 'finished') return 'bg-green-600';
    return 'bg-blue-600';
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-8 p-8 ${className}`}>
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

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Protein Structure Optimization
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {getStatusMessage()}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <Progress
            value={progress}
            className="h-3"
          />
        </div>
      </div>

      {/* Additional status information */}
      {status === 'running' && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This process may take several minutes, if we don`t have it it our database calculation can take some time.</p>
          <p>We are optimizing it in the background you can leave and check the final result later.</p>
        </div>
      )}
    </div>
  );
}
