"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/common/Skeleton";

const MolstarViewer = dynamic(
  async () =>
    import("@/components/molstar/MolstarViewer").then(
      (mod) => mod.MolstarViewer
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-175 w-full" />,
  }
);

const MolstarControls = dynamic(
  async () =>
    import("@/components/molstar/MolstarControls").then(
      (mod) => mod.MolstarControls
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full max-w-105" />,
  }
);

interface ProteinComparisonProps {
  jobId: string;
}

export function ProteinComparison({ jobId }: ProteinComparisonProps) {
  return (
    <div className="space-y-4">
      <MolstarControls />
      <MolstarViewer jobId={jobId} />
    </div>
  );
}
