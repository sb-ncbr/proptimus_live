"use client";

import React from "react";
import { useMolstar } from "@/components/context/MolstarContext";
import { WarningsDialog } from "./WarningsDialog";
import type { Warnings } from "@/lib/molstar/types";

interface WarningsDialogWrapperProps {
  warnings: Warnings | undefined;
  isLoading?: boolean;
}

export function WarningsDialogWrapper({ warnings, isLoading }: WarningsDialogWrapperProps) {
  const { viewer } = useMolstar();

  const handleFocusResidue = React.useCallback(
    (chainId: string, residueId: number, residueName: string) => {
      viewer!.focusResidue(chainId, residueId, residueName);
    },
    [viewer]
  );

  const handleFocusInteraction = React.useCallback(
    (
      chainId1: string,
      residueId1: number,
      residueName1: string,
      chainId2: string,
      residueId2: number,
      residueName2: string
    ) => {
      viewer!.focusResidues(
        chainId1,
        residueId1,
        residueName1,
        chainId2,
        residueId2,
        residueName2
      );
    },
    [viewer]
  );

  return (
    <WarningsDialog
      warnings={warnings}
      isLoading={isLoading}
      onFocusResidue={handleFocusResidue}
      onFocusInteraction={handleFocusInteraction}
    />
  );
}
