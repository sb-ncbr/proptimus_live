import { useMolstar } from "../context/MolstarContext";
import { useBehavior } from "@/hooks/useBehavior";
import { Skeleton } from "../common/Skeleton";
import { Spinner } from "../ui/spinner";
import { Layout } from "./MolstarLayout";
import { PluginReactContext } from "molstar/lib/mol-plugin-ui/base";
import "molstar/lib/mol-plugin-ui/skin/light.scss";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { MolstarModel } from "@/lib/molstar/molstar-model";

interface MolstarViewerProps {
  jobId: string;
}

export function MolstarViewer({ jobId }: MolstarViewerProps) {
  const { viewer } = useMolstar();

  if (!viewer) {
    return <Skeleton className="relative h-175 w-full" />;
  }

  return <MolstarViewerInner viewer={viewer} jobId={jobId} />;
}

function MolstarViewerInner({
  viewer,
  jobId,
}: {
  viewer: MolstarModel;
  jobId: string;
}) {
  const isInitialized = useBehavior(viewer.state.isInitialized);
  const isLoading = useBehavior(viewer.state.isLoading);
  const isExpanded = useBehavior(viewer.state.isExpanded);

  useEffect(() => {
    if (!isInitialized) return;
    viewer.setup(jobId);
  }, [isInitialized, viewer, jobId]);

  if (!isInitialized) {
    return <Skeleton className="relative h-175 w-full" />;
  }

  return (
    <div className={cn("relative h-175 w-full", isExpanded && "z-51")}>
      {isLoading && (
        <Spinner className="absolute top-1/2 left-1/2 size-8 z-10" />
      )}
      <PluginReactContext.Provider value={viewer.plugin}>
        <Layout />
      </PluginReactContext.Provider>
    </div>
  );
}
