'use client';

import { useEffect, useState } from 'react';

export default function ResultsLoading() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div
            className={`fixed inset-0 bg-white/80 backdrop-blur-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Loading progress bar under header */}
            <div className="fixed top-16 left-0 right-0 h-1 bg-gray-200 z-50 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 animate-shimmer"></div>
            </div>

            {/* Fullpage loading content */}
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-gray-600 text-xl font-medium">
                        Loading results
                        <span className="inline-flex ml-1">
                            <span className="animate-pulse animation-delay-0">.</span>
                            <span className="animate-pulse animation-delay-200">.</span>
                            <span className="animate-pulse animation-delay-400">.</span>
                        </span>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
                .animation-delay-0 {
                    animation-delay: 0s;
                }
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
            `}</style>
        </div>
    );
}