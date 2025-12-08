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
import { Button } from "@/components/common/Button";
import { HardDriveDownload } from "lucide-react";

function ResultsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("query");
  const [showLoader, setShowLoader] = React.useState(false);

  // Parse job ID to extract UniProt ID and pH value
  const [uniprotId, phValue] = jobId ? jobId.split('_') : ['', ''];

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

  // Delay showing loader by 500ms to prevent flash for quick loads
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
      }
    } catch (error) {
      console.error('Download failed:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <ErrorDisplay
          message={`Failed to load optimization progress: ${progressError.message}`}
        />
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

  // Show loading animation while optimization is running or loading
  // Don't show loading screen if we're just refetching and already have finished data
  if ((progressLoading && !progressData) || (progressData && progressData.status === "running")) {
    if (!showLoader) {
      return null; // Don't show anything for the first 500ms
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 animate-in fade-in duration-300">
        <OptimizationLoader
          progress={progressData?.progress ?? 0}
          status={progressData?.status || "running"}
          message={progressData?.message}

        />
      </div>
    );
  }  // Handle PDB data loading errors
  if (originalError || optimizedError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorDisplay
          message={`Failed to load protein structures: ${originalError?.message || optimizedError?.message || "Unknown error"}`}
        />
      </div>
    );
  }

  // Show loading while fetching PDB data
  if (
    originalLoading ||
    optimizedLoading ||
    !originalPdbData ||
    !optimizedPdbData
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <OptimizationLoader
          progress={100}
          status="finished"
          message="Loading protein structures..."
        />
      </div>
    );
  }

  // Show results when everything is loaded
  return (
    <main className="min-h-screen bg-gray-50 animate-in fade-in duration-500">
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
                      UniProt Code:
                    </td>
                    <td className="py-3">
                      <a
                        href={`https://alphafold.ebi.ac.uk/entry/${uniprotId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-silver hover:text-blue-800 underline"
                      >
                        {uniprotId}
                      </a>
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
            <ProteinResultsCard />
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
