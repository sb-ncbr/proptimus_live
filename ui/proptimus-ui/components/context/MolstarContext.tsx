"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { MolstarModel } from "@/lib/molstar/molstar-model";

interface MolstarContextType {
  viewer: MolstarModel | null;
  isReady: boolean;
}

const MolstarContext = createContext<MolstarContextType | undefined>(undefined);

interface MolstarProviderProps {
  children: React.ReactNode;
}

export const MolstarProvider: React.FC<MolstarProviderProps> = ({
  children,
}) => {
  const viewerRef = useRef<MolstarModel | null>(null);
  const [viewer, setViewer] = useState<MolstarModel | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("@/lib/molstar/molstar-model")
      .then(async ({ MolstarModel }) => {
        if (cancelled) return;

        const nextViewer = new MolstarModel();
        viewerRef.current = nextViewer;
        setViewer(nextViewer);

        await nextViewer.mount();
        if (!cancelled) setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize Molstar viewer", error);
        if (!cancelled) {
          setViewer(null);
          setIsReady(false);
        }
      });

    // Cleanup on unmount
    return () => {
      cancelled = true;
      if (viewerRef.current && !viewerRef.current.state.isDisposed.value) {
        viewerRef.current.unmount();
      }
      viewerRef.current = null;
      setViewer(null);
      setIsReady(false);
    };
  }, []); // Empty deps - runs once per mount

  const value = {
    viewer,
    isReady,
  };

  return (
    <MolstarContext.Provider value={value}>{children}</MolstarContext.Provider>
  );
};

export const useMolstar = () => {
  const context = useContext(MolstarContext);
  if (context === undefined) {
    throw new Error("useMolstar must be used within a MolstarProvider");
  }
  return context;
};
