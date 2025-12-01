"use client"

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Protein } from '@/components/visualizations/types';

// Dynamically import MSWrapper with SSR turned off
const MSWrapper = dynamic(() =>
    import('@/components/visualizations/MSWrapper').then(mod => mod.MSWrapper),
    { ssr: false }
);

interface ProteinComparisonProps {
    jobId: string;
    originalPdbData: string;
    optimizedPdbData: string;
    className?: string;
}


export function ProteinComparison({
    jobId,
    originalPdbData,
    optimizedPdbData,
    className = ""
}: ProteinComparisonProps) {
    const [isClient, setIsClient] = useState(false);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [optimizedFile, setOptimizedFile] = useState<File | null>(null);

    useEffect(() => {
        // This effect runs only on the client, after initial render
        setIsClient(true);
        const createFileFromData = (data: string, filename: string): File => {
            const blob = new Blob([data], { type: 'chemical/x-pdb' }); // Correct MIME type for PDB
            return new File([blob], filename, { type: 'chemical/x-cif' });
        };

        // Use the dummy data for testing instead of the props
        setOriginalFile(createFileFromData(originalPdbData, 'original.pdb'));
        setOptimizedFile(createFileFromData(optimizedPdbData, 'optimized.cif'));
    }, []); // Note: Removed dependencies to only run once with dummy data

    const originalProtein = useMemo<Protein | null>(() => {
        if (!originalFile) return null;
        return {
            structure: originalFile,
            chain: undefined,
            superposition: {
                rotation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                translation: [0, 0, 0]
            }
        };
    }, [originalFile]);

    const optimizedProtein = useMemo<Protein | null>(() => {
        if (!optimizedFile) return null;
        return {
            structure: optimizedFile,
            chain: undefined,
            superposition: {
                rotation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                translation: [0, 0, 0]
            }
        };
    }, [optimizedFile]);

    const originalProteinForOverlay = useMemo<Protein | null>(() => {
        if (!originalProtein) return null;
        return {
            ...originalProtein,
            representation: {
                color: 'element_symbol',
                type: 'b',
                opacity: 0.7
            }
        };
    }, [originalProtein]);

    const optimizedProteinForOverlay = useMemo<Protein | null>(() => {
        if (!optimizedProtein) return null;
        return {
            ...optimizedProtein,
            representation: {
                color: 'element_symbol',
                type: 'ball_and_stick',
                opacity: 1
            }
        };
    }, [optimizedProtein]);

    // Fallback component for SSR or when client-side rendering is not ready
    const FallbackViewer = ({ title }: { title: string }) => (
        <div className="h-96 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <span className="text-2xl">!</span>
                <p>Error loading 3D structure</p>
            </div>
        </div>
    );

    return (
        <div className={`space-y-8 ${className}`}>



            {/* Combined View */}
            {isClient && originalProteinForOverlay && optimizedProteinForOverlay && (
                <div className="space-y-4">
                    <div className="text-center">
                        <h3 className="text-2xl mb-2 font-semibold text-gray-900 dark:text-gray-100">
                            Overlay Comparison
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Original (gray, transparent) vs Optimized (colored)
                        </p>
                    </div>

                    <div className="h-full border rounded-lg overflow-hidden">
                        <MSWrapper
                            proteins={[originalProteinForOverlay, optimizedProteinForOverlay]}
                            height={600}
                            showUI={true}
                            bgColor="#ffffff"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}