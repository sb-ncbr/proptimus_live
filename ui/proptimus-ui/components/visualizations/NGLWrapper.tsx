"use client";

import { type Component, Stage, StructureComponent, superpose } from "ngl";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
import type { Protein } from "./types";
import { Loader } from "./Loader";
import { ErrorDisplay } from "./ErrorDisplay";

export enum Representation {
  Cartoon = "cartoon",
  Tube = "tube",
  Surface = "surface",
  BallAndStick = "ball+stick",
  Spacefill = "spacefill",
  Trace = "trace",
  Licorice = "licorice",
  All = "_",
}

export type ColorHEX = string;

const defaultColors: ColorHEX[] = ["#FD9D0D", "#0D6EFD"];

enum PreviewState {
  Loading = 0,
  Success = 1,
  Error = 2,
}

function makeProteinNames(proteins: Protein[]) {
  return proteins.map((p) =>
    typeof p.structure === "string"
      ? `${p.structure} ${p.chain ?? ""}`
      : `${p.structure.name} ${p.chain ?? ""}`
  );
}

function makeColorTransitions(count: number): ColorHEX[] {
  // Simple color generation for multiple proteins
  const colors: ColorHEX[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

function makeTransparencyTransitions(count: number): number[] {
  const transparencies: number[] = [];
  for (let i = 0; i < count; i++) {
    transparencies.push(0.8 - (i * 0.2) / count);
  }
  return transparencies;
}

function setupComponent(
  component: Component,
  chain: string | undefined,
  name: string,
  color: ColorHEX,
  transparency: number,
  defaultRepresentation: Representation
) {
  component.setName(name);

  if (defaultRepresentation === Representation.BallAndStick) {
    component.addRepresentation("ball+stick", {
      sele: chain ? `:${chain}` : undefined,
      color: color,
      visible: true,
      opacity: transparency,
      multipleBond: "symmetric",
    });

    component.autoView();
    return component;
  }

  if (defaultRepresentation === Representation.Tube) {
    component.addRepresentation("tube", {
      sele: chain ? `:${chain}` : undefined,
      color: color,
      visible: true,
      opacity: transparency,
    });

    component.autoView();
    return component;
  }

  component.addRepresentation("cartoon", {
    sele: chain ? `:${chain}` : undefined,
    color: color,
    visible: true,
  });

  return component;
}

function setupStructures(
  proteins: Protein[],
  stage: Stage,
  defaultRepresentation: Representation
) {
  const colors =
    proteins.length === 2
      ? defaultColors
      : [defaultColors[0], ...makeColorTransitions(proteins.length)];
  const transparencies =
    proteins.length === 2
      ? [1, 1]
      : [1, ...makeTransparencyTransitions(proteins.length - 1).reverse()];
  const names = makeProteinNames(proteins);

  const promises: Promise<Component>[] = [];
  for (let i = 0; i < proteins.length; i++) {
    const protein = proteins[i];
    if (!protein) {
      continue;
    }

    let promise: Promise<undefined | Component>;

    if (typeof protein.structure === "string") {
      promise = stage.loadFile(
        `https://alphafold.ebi.ac.uk/files/AF-${protein.structure}-F1-model_v3.pdb`
      ) as Promise<undefined | Component>;
    } else {
      promise = stage.loadFile(protein.structure) as Promise<
        undefined | Component
      >;
    }

    if (promise === undefined) {
      continue;
    }

    const processedPromise = promise.then((o: undefined | Component) => {
      if (!o) {
        throw new Error("Failed to load protein structure");
      }
      const name = names[i] || "";
      const color = colors[i] || defaultColors[0] || "#3b82f6";
      const transparency = transparencies[i] || 1;
      return setupComponent(
        o,
        protein.chain,
        name,
        color,
        transparency,
        defaultRepresentation
      );
    });

    promises.push(processedPromise);
  }

  return promises;
}

function performSuperposition(components: Component[]) {
  const native = components[0];
  // There preconditions are necessary to ensure component posesses structure property
  if (!(native instanceof StructureComponent)) {
    return;
  }

  for (let i = 1; i < components.length; i++) {
    const target = components[i];
    if (!(target instanceof StructureComponent)) {
      continue;
    }

    // Last param 'true' - whether to use sequence alignment
    superpose(native.structure, target.structure, true);
  }
}

function setupVisualizer(
  stage: Stage,
  proteins: Protein[],
  setPreviewState: React.Dispatch<React.SetStateAction<PreviewState>>,
  defaultRepresentation: Representation
) {
  const promisedComponents = setupStructures(
    proteins,
    stage,
    defaultRepresentation
  );

  Promise.all(promisedComponents)
    .then((components) => {
      if (components.length > 1) {
        performSuperposition(components);
      }

      const firstComponent = components[0];
      if (firstComponent) {
        firstComponent.updateRepresentations({
          position: true,
        });
      }
      // Focus and center on object or the whole scene
      stage.autoView();

      setTimeout(() => {
        setPreviewState(PreviewState.Success);
      }, 500);
    })
    .catch((_error) => {
      setPreviewState(PreviewState.Error);
    });
}

type Props = {
  proteins: Protein[];
  height?: number;
  bgColor?: ColorHEX;
  defaultRepresentation?: Representation | "cartoon" | "ball+stick";
  spin?: boolean;
  className?: string;
};

export function NGLWrapper({
  proteins,
  height,
  bgColor = "#ffffff",
  defaultRepresentation = Representation.BallAndStick,
  spin = false,
  className = "",
}: Props) {
  const [previewState, setPreviewState] = useState(PreviewState.Loading);
  const [stage, setStage] = useState<Stage | null>(null);

  // Normalize representation prop to enum, allowing string inputs "cartoon" or "ball+stick"
  const normalizedRepresentation: Representation =
    defaultRepresentation === "cartoon"
      ? Representation.Cartoon
      : defaultRepresentation === "ball+stick"
        ? Representation.BallAndStick
        : (defaultRepresentation as Representation);

  const elementRef = useCallback(
    (e: HTMLDivElement) => {
      if (!e) {
        return;
      }

      const newStage = new Stage(e, {
        backgroundColor: bgColor,
      });

      newStage.setSpin(spin);
      setStage(newStage);
      setPreviewState(PreviewState.Success);
    },
    [bgColor, spin]
  );

  useEffect(() => {
    return () => {
      if (stage === null) {
        return;
      }

      window.removeEventListener("resize", stage.handleResize);
      stage.removeAllComponents();
      stage.dispose();
      setStage(null);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === null) {
      return;
    }

    stage.setSpin(spin);
  }, [stage, spin]);

  useEffect(() => {
    if (stage === null) {
      return;
    }

    stage.setParameters({
      backgroundColor: bgColor,
    });
  }, [stage, bgColor]);

  useEffect(() => {
    if (stage === null) {
      return;
    }

    setPreviewState(PreviewState.Loading);
    stage.removeAllComponents();

    setupVisualizer(stage, proteins, setPreviewState, normalizedRepresentation);
  }, [stage, normalizedRepresentation, proteins]);

  const style: CSSProperties = {
    height: height ? `${height}px` : "100%",
  };

  let classes = "w-full relative";
  if (!height) {
    classes += " h-full";
  }
  if (className) {
    classes += ` ${className}`;
  }

  return (
    <div className={classes} style={style}>
      <div
        ref={elementRef}
        className="w-full h-full"
        style={{
          opacity: previewState === PreviewState.Success ? 1 : 0.4,
        }}
      />

      {previewState === PreviewState.Loading && <Loader />}

      {previewState === PreviewState.Error && <ErrorDisplay />}
    </div>
  );
}

export default NGLWrapper;
