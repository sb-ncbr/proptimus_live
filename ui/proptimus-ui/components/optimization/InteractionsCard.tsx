"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface InteractionsData {
    ID: string;
    code: string;
    ph: string;
    "hbonds original"?: number;
    "hbonds optimised"?: number;
    "pipi original"?: number;
    "pipi optimised"?: number;
    "catpi original"?: number;
    "catpi optimised"?: number;
}

interface InteractionsCardProps {
    data?: InteractionsData;
    isLoading?: boolean;
}

export function InteractionsCard({ data, isLoading }: InteractionsCardProps) {
    if (isLoading) {
        return (
            <Card className="p-6 bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    Inter-residual Interactions
                </h3>
                <div className="space-y-3">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                </div>
            </Card>
        );
    }

    if (!data || data["hbonds original"] === undefined) {
        return (
            <Card className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    Inter-residual Interactions
                </h3>
                <p className="text-gray-500 text-sm">Data not yet available</p>
            </Card>
        );
    }

    const getChangeIcon = (original: number, optimised: number) => {
        const diff = optimised - original;
        if (diff > 0) {
            return <span className="text-green-600 text-sm">+{diff}</span>;
        } else if (diff < 0) {
            return <span className="text-red-600 text-sm">{diff}</span>;
        }
        return <span className="text-gray-500 text-sm">±0</span>;
    };

    const interactions = [
        {
            label: "Hydrogen bonds",
            original: data["hbonds original"] || 0,
            optimised: data["hbonds optimised"] || 0,
        },
        {
            label: "π–π interactions",
            original: data["pipi original"] || 0,
            optimised: data["pipi optimised"] || 0,
        },
        {
            label: "Cation–π interactions",
            original: data["catpi original"] || 0,
            optimised: data["catpi optimised"] || 0,
        },
    ];

    return (
        <Card className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Inter-residual Interactions
            </h3>

            <div className="space-y-3">
                {interactions.map((interaction, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                        <span className="text-gray-700 font-medium text-sm">
                            {interaction.label}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-semibold min-w-[2rem] text-center">
                                {interaction.original}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-bold min-w-[2rem] text-center">
                                {interaction.optimised}
                            </span>
                            <div className="min-w-[3rem] text-right">
                                {getChangeIcon(interaction.original, interaction.optimised)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
