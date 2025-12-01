"use client";

import React from 'react';
import { CheckCircle, Clock, Play } from 'lucide-react';
import { useResults, useResultsStats } from '../../hooks/useProptimusApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from "@/lib/utils"

interface ProteinResultsCardProps {
    className?: string;
}

interface ResultsData {
    calculated: number;
    queued: number;
    running: number;
}

export default function ProteinResultsCard({ className = "" }: ProteinResultsCardProps) {
    const { data, isLoading, error } = useResultsStats();

    // Parse the results data if it's a JSON string
    let results: ResultsData | null = null;
    if (data) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(data);
            if (parsed.calculated !== undefined && parsed.queued !== undefined && parsed.running !== undefined) {
                results = parsed;
            }
        } catch {
            // If not JSON, try to extract from HTML or other format
            // This is a fallback - you might need to adjust based on your actual data format
            results = { calculated: 0, queued: 0, running: 0 };
        }
    }

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

    return (
        <Card className={cn("w-56", className)}>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Job Status</CardTitle>
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
