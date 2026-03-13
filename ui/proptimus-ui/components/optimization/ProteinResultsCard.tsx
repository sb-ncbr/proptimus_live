"use client";

import React from 'react';
import { CheckCircle, Clock, Play } from 'lucide-react';
import { useResultsStats, ResultsStatsResponse } from '../../hooks/useProptimusApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from "@/lib/utils"

interface ProteinResultsCardProps {
    className?: string;
}

export default function ProteinResultsCard({ className = "", compact = false }: ProteinResultsCardProps & { compact?: boolean }) {
    const { data: results, isLoading, error } = useResultsStats();

    if (isLoading) {
        return (
            <Card className={cn("w-56", className)}>
                <CardHeader>
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !results) {
        return (
            <Card className={cn("w-56 border-red-200", className)}>
                <CardContent>
                    <div className="text-red-600 text-sm">
                        Failed to load results
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Compact mobile version
    if (compact) {
        return (
            <div className={cn("flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-md", className)}>
                <div className="flex items-center gap-1" title="Calculated">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-gray-900">{results.calculated}</span>
                </div>
                <div className="flex items-center gap-1" title="Queued">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs font-semibold text-gray-900">{results.queued}</span>
                </div>
                <div className="flex items-center gap-1" title="Running">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-900">{results.running}</span>
                </div>
            </div>
        );
    }

    // Full desktop version
    return (
        <Card className={cn("w-56", className)}>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Job Statistics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Calculated */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">Calculated</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                            {results.calculated}
                        </span>
                    </div>

                    {/* Queued */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-gray-600">Queued</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                            {results.queued}
                        </span>
                    </div>

                    {/* Running */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-600">Running</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                            {results.running}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
