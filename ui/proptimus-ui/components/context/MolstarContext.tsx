"use client";

import { MolstarModel } from "@/lib/molstar/molstar-model";
import { createContext, useContext, useEffect, useRef, useState } from "react";

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
    // Create a fresh instance on mount
    const viewer = new MolstarModel();
    viewerRef.current = viewer;

    // Mount it
    viewer.mount().then(() => {
      setIsReady(true);
    });

    // Cleanup on unmount
    return () => {
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
