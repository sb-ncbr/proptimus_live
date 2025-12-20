"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useOptimizationProgress } from "@/hooks/useOptimizationProgress";
import {
  useOptimisedStructure,
  useOriginalStructure,
  useDownloadFiles,
} from "@/hooks/useProptimusApi";
import {
  OptimizationLoader,
  ProteinComparison,
} from "@/components/optimization";
import { ErrorDisplay } from "@/components/visualizations/ErrorDisplay";
import Header from "@/components/layout/Header";
import ProteinResultsCard from "@/components/optimization/ProteinResultsCard";
import { InteractionsCard } from "@/components/optimization/InteractionsCard";
import { Button } from "@/components/common/Button";
import { HardDriveDownload } from "lucide-react";
import { useInteractionsData } from "@/hooks/useInteractionsData";
import { toast } from "sonner";

function ResultsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("query");
  const [showResults, setShowResults] = React.useState(false);

  // Parse job ID to extract UniProt ID and pH value
  const [optimisation_id, phValue] = jobId ? jobId.split('_') : ['', ''];

  // Fetch optimization progress
  const {
    data: progressData,
    isLoading: progressLoading,
    error: progressError,
  } = useOptimizationProgress(jobId || "");

  // Fetch PDB structures when optimization is finished
  const {
    data: originalPdbData,
    isLoading: originalLoading,
    error: originalError,
  } = useOriginalStructure(jobId || "", {
    enabled: progressData?.status === "finished",
  });

  const {
    data: optimizedPdbData,
    isLoading: optimizedLoading,
    error: optimizedError,
  } = useOptimisedStructure(jobId || "", {
    enabled: progressData?.status === "finished",
  });

  // Download files hook - disabled by default, will be triggered on demand
  const {
    data: downloadData,
    isLoading: downloadLoading,
    error: downloadError,
    refetch: downloadFiles,
  } = useDownloadFiles(jobId || "", { enabled: false });

  // Fetch interactions data
  const {
    data: interactionsData,
    isLoading: interactionsLoading,
  } = useInteractionsData(jobId || "");

  // Only show results when both PDB structures are loaded
  React.useEffect(() => {
    if (originalPdbData && optimizedPdbData && progressData?.status === "finished") {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setShowResults(true), 150);
      return () => clearTimeout(timer);
    }
  }, [originalPdbData, optimizedPdbData, progressData?.status]);

  // Handle download
  const handleDownload = async () => {
    try {
      const result = await downloadFiles();
      if (result.data && result.data instanceof Blob) {
        const blob = result.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `optimized_structure_${jobId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Invalid download data received');
        toast.error('Failed to download files: Invalid data received');
      }
    } catch (error) {
      console.error('Download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Download failed: ${errorMessage}`);
    }
  };

  // Handle missing job ID
  if (!jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            No Query Parameter Provided
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please provide a valid query parameter to view results.
          </p>
        </div>
      </div>
    );
  }

  // Handle progress loading error
  if (progressError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center border border-gray-200">
          <h1 className="text-4xl font-bold text-primary mb-10">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-600 text-primary mb-10">
            {progressError instanceof Error ? progressError.message : 'Failed to load optimization progress'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-200 cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle optimization error
  if (progressData?.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Optimization Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {progressData.message ||
              "An error occurred during protein optimization."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show loading animation ONLY while optimization is actively running or queued
  if (progressData && (progressData.status === "running" || progressData.status === "queued")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <OptimizationLoader
          status={progressData.status}
          message={progressData.message}
          remaining_time={progressData.remaining_time}
        />
      </div>
    );
  }

  // Show minimal loading while waiting for initial progress data or if loading state
  if (progressLoading || originalLoading || optimizedLoading || !originalPdbData || !optimizedPdbData || !showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <OptimizationLoader
          status="finished"
          message="Loading protein structures..."
        />
      </div>
    );
  }

  // Handle PDB data loading errors
  if (originalError || optimizedError) {
    const errorMessage = originalError instanceof Error ? originalError.message :
      optimizedError instanceof Error ? optimizedError.message :
        'Unknown error';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center border border-gray-200">
          <h1 className="text-4xl font-bold text-primary mb-10">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-600 text-primary mb-10">
            Failed to load protein structures: {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-200 cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show results when everything is loaded
  return (
    <main className="min-h-screen bg-gray-50 opacity-0 animate-fade-in" style={{ animation: 'fadeIn 0.6s ease-in forwards' }}>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <Header />
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-8">
          Optimisation Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare the original and optimized protein structures
        </p>
      </div>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-6 flex justify-between items-center">

            {/* Protein Information Table */}
            <div className="w-full max-w-md">
              <table className="w-full text-xl">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                      Optimisation ID:
                    </td>
                    <td className="py-3">
                        {optimisation_id}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                      pH:
                    </td>
                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {phValue || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <InteractionsCard data={interactionsData} isLoading={interactionsLoading} />
          </div>
          <div className="flex justify-between  items-center">
            <div>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleDownload}
                disabled={downloadLoading}
                className="text-primary-foreground"
              >
                <div className="flex items-center gap-2 text-primary-foreground">
                  <HardDriveDownload className="w-4 h-4" />
                  {downloadLoading ? "Downloading..." : "Download Optimized Structure"}
                </div>

              </Button>
            </div>
            <div>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => window.location.href = "/"}
                className="text-primary-foreground"
              >
                Back to Main Page
              </Button>
            </div>
          </div>
          {/* Visualization Section */}
          <div className="mb-6">
            <ProteinComparison
              jobId={jobId}
              originalPdbData={originalPdbData}
              optimizedPdbData={optimizedPdbData}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
