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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("@/lib/molstar/molstar-model").then(({ MolstarModel }) => {
      if (cancelled) return;

      // Create a fresh instance on mount
      const viewer = new MolstarModel();
      viewerRef.current = viewer;

      // Mount it
      viewer.mount().then(() => {
        if (!cancelled) setIsReady(true);
      });
    });

    // Cleanup on unmount
    return () => {
      cancelled = true;
      if (viewerRef.current && !viewerRef.current.state.isDisposed.value) {
        viewerRef.current.unmount();
      }
      viewerRef.current = null;
      setIsReady(false);
    };
  }, []); // Empty deps - runs once per mount

  const value = {
    viewer: viewerRef.current,
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
