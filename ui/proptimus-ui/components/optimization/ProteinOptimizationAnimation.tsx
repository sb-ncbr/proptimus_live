"use client"

import React from 'react';

interface ProteinOptimizationAnimationProps {
  className?: string;
}

export function ProteinOptimizationAnimation({ className = "" }: ProteinOptimizationAnimationProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-32 h-32">
        {/* Protein structure representation */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Alpha helix representation */}
          <div className="relative">
            <div className="w-8 h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-1/2 -left-3 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        
        {/* Rotating rings around the protein */}
        <div className="absolute inset-0 border-2 border-blue-200 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
        <div className="absolute inset-2 border-2 border-green-200 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
        <div className="absolute inset-4 border-2 border-purple-200 rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>
        
        {/* Optimization particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping"
              style={{
                top: `${20 + (i * 10)}%`,
                left: `${15 + (i * 8)}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
