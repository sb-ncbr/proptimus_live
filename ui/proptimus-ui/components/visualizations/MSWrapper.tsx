"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./molstar-wrapper.css";
import type { Protein } from "./types";
import { Loader } from "./Loader";
import { ErrorDisplay } from "./ErrorDisplay";
import type { Matrix3D, Matrix3DFlattened, Vector3D } from "@/lib/types";
import { debug, error, warning } from "@/lib/clientLogger/logger";

function transposeAndFlatten(matrix: Matrix3D): Matrix3DFlattened {
  return matrix[0].flatMap((_, colIndex) =>
    matrix.map((row) => row[colIndex])
  ) as Matrix3DFlattened;
}

// Component props type definition
type MSWrapperProps = {
  proteins: Protein[];
  height?: number;
  bgColor?: string;
  showUI?: boolean;
  className?: string;
};

// MolStar type definitions
interface MolStarViewer {
  plugin: {
    dispose: () => void;
    clear: () => Promise<void>;
    canvas3d?: {
      setProps: (props: { renderer: { backgroundColor: string } }) => void;
    };
  };
}

interface MolStarViewerOptions {
  layoutIsExpanded: boolean;
  layoutShowControls: boolean;
  viewportShowControls: boolean;
  collapseLeftPanel: boolean;
  collapseRightPanel: boolean;
  disableAntialiasing: boolean;
  disablePreservation: boolean;
  pixelScale: number;
  allowMajorUpdate: boolean;
}

interface MVSSpecification {
  kind: string;
  root: {
    kind: string;
    children: unknown[];
  };
  metadata: {
    timestamp: string;
    version: string;
    title: string;
    description: string;
  };
}

// Global MolStar declarations
declare global {
  interface Window {
    molstar: {
      Viewer: {
        create: (
          container: HTMLElement,
          options: MolStarViewerOptions
        ) => Promise<MolStarViewer>;
      };
      ExtensionMap?: {
        mvs?: unknown;
      };
      PluginExtensions?: {
        mvs?: {
          loadMVSData: (
            plugin: unknown,
            mvsSpec: MVSSpecification,
            format: string
          ) => Promise<void>;
        };
      };
    };
    __molstarInitialized?: boolean;
  }
}

enum ViewerState {
  Loading = 0,
  Success = 1,
  Error = 2,
}

// Global state to track Molstar initialization
let molstarGloballyInitialized = false;

// MolStar Viewer Manager class
class MolStarViewerManager {
  private static instance: MolStarViewerManager;
  private viewers: Map<HTMLElement, MolStarViewer> = new Map();
  private initializingContainers: Set<HTMLElement> = new Set();
  private objectUrls: Set<string> = new Set(); // Track object URLs for cleanup

  static getInstance(): MolStarViewerManager {
    if (!MolStarViewerManager.instance) {
      MolStarViewerManager.instance = new MolStarViewerManager();
    }
    return MolStarViewerManager.instance;
  }

  async initializeViewer(
    container: HTMLElement,
    showUI = true
  ): Promise<MolStarViewer> {
    // Check if we already have a viewer for this container
    const existingViewer = this.viewers.get(container);
    if (existingViewer) {
      return existingViewer;
    }

    // Additional check: if container already has molstar content, don't reinitialize
    if (container.querySelector(".msp-plugin")) {
      // Try to find the existing viewer in our map
      for (const [containerEl, viewer] of this.viewers.entries()) {
        if (containerEl === container) {
          return viewer;
        }
      }
    }

    // Check if we're already initializing this container
    if (this.initializingContainers.has(container)) {
      // Wait for initialization to complete
      while (this.initializingContainers.has(container)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const viewer = this.viewers.get(container);
      if (!viewer) {
        throw new Error("Viewer not found after initialization");
      }
      return viewer;
    }

    try {
      this.initializingContainers.add(container);

      // Only clear container if it doesn't already have molstar content
      if (!container.querySelector(".msp-plugin")) {
        container.innerHTML = "";
      }

      if (!window.molstar) {
        throw new Error(
          "MolStar not loaded. Please include molstar.js script."
        );
      }

      // Set global flag to prevent re-initialization issues
      if (!molstarGloballyInitialized) {
        window.__molstarInitialized = true;
        molstarGloballyInitialized = true;
      }

      const viewer = await window.molstar.Viewer.create(container, {
        layoutIsExpanded: false,
        layoutShowControls: false, // Hide large UI controls
        viewportShowControls: showUI, // Keep small viewport controls
        collapseLeftPanel: true, // Always collapse large left panel
        collapseRightPanel: true, // Always collapse large right panel
        disableAntialiasing: false,
        disablePreservation: false,
        pixelScale: 1,
        allowMajorUpdate: true,
      });

      this.viewers.set(container, viewer);
      return viewer;
    } finally {
      this.initializingContainers.delete(container);
    }
  }

  getViewer(container: HTMLElement): MolStarViewer | undefined {
    return this.viewers.get(container);
  }

  disposeViewer(container: HTMLElement) {
    const viewer = this.viewers.get(container);
    if (viewer) {
      if (viewer.plugin?.dispose) {
        viewer.plugin.dispose();
      }
      this.viewers.delete(container);
      container.innerHTML = "";
    }

    // Clean up object URLs
    this.cleanupObjectUrls();
  }

  /**
   * Clean up all tracked object URLs to prevent memory leaks
   */
  cleanupObjectUrls() {
    for (const url of this.objectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch (_error) {
        warning(`Failed to revoke object URL: ${url}`, "MSWRAPPER");
      }
    }
    this.objectUrls.clear();
  }

  /**
   * Creates a custom MVS (MolStar Visualization Specification) for protein visualization
   *
   * @param proteins - Array of protein objects to visualize
   * @returns MVS specification object or null if creation fails
   */
  createCustomMVS(proteins: Protein[]): MVSSpecification | null {
    if (!window.molstar?.ExtensionMap?.mvs) {
      return null;
    }

    debug(
      `Starting MVS creation with proteins: ${proteins.map((p) => p.structure.toString()).join(", ")}`,
      "MSWRAPPER"
    );

    try {
      const children = [];

      // Define color scheme based on number of proteins
      let colors: string[];
      if (proteins.length === 1) {
        // Single protein: orange
        colors = ["#FD9D0D"];
      } else if (proteins.length === 2) {
        // Two proteins: orange and blue
        colors = ["#CCCCCC", "#FD9D0D"];
      } else {
        // Three or more proteins: orange for first, light gray for rest
        colors = ["#CCCCCC", ...Array(proteins.length - 1).fill("#FD9D0D")];
      }

      for (let i = 0; i < proteins.length; i++) {
        const protein = proteins[i];

        if (!protein) {
          warning(
            `createCustomMVS - Protein at index ${i} is undefined, skipping`,
            "MSWRAPPER"
          );
          continue;
        }

        debug(`Processing protein ${i}:`, "MSWRAPPER");

        let structureUrl: string;

        // Handle structure URL generation
        if (typeof protein.structure === "string") {
          // Handle UniProt ID
          const proteinId = protein.structure;
          const isAlphaFoldId =
            proteinId.length >= 6 &&
            (proteinId.startsWith("AF-") || /^[A-Z0-9]{6,}$/.test(proteinId));

          if (isAlphaFoldId) {
            const cleanId = proteinId.replace("AF-", "").replace("-F1", "");
            structureUrl = `https://alphafold.ebi.ac.uk/files/AF-${cleanId}-F1-model_v4.cif`;
          } else {
            structureUrl = `https://files.rcsb.org/download/${proteinId.toLowerCase()}.cif`;
          }
        } else {
          // Handle File objects
          const file = protein.structure as File;

          // Create a URL for the uploaded file
          structureUrl = URL.createObjectURL(file);

          // Track object URL for cleanup
          this.objectUrls.add(structureUrl);

          debug(
            `createCustomMVS - Created object URL for file: ${file.name}`,
            "MSWRAPPER"
          );
        }

        debug(
          `createCustomMVS - Using structure URL: ${structureUrl}`,
          "MSWRAPPER"
        );

        // Create component selector based on chain specification
        // For file objects, use label_asym_id if chain is specified, otherwise use auth_asym_id or "all"
        let selector: string | Record<string, string>;
        if (protein.chain) {
          if (typeof protein.structure !== "string") {
            // For uploaded files, use label_asym_id as per MolViewSpec pattern
            selector = { label_asym_id: protein.chain };
          } else {
            // For UniProt/PDB IDs, use auth_asym_id
            selector = { auth_asym_id: protein.chain };
          }
        } else {
          selector = "all";
        }

        // Create the component
        const component = {
          kind: "component",
          params: {
            selector: selector,
          },
          children: [
            {
              kind: "representation",
              params: {
                type: "ball_and_stick",
                ...(typeof protein.structure !== "string"
                  ? {
                    size_factor: 0.2,
                  }
                  : {}),
              },
              children: [
                // Apply element symbol coloring to second protein, fixed color to others
                ...(i === 1
                  ? [
                    // Define comprehensive element colors for second protein (keeping carbon green)
                    {
                      kind: "color",
                      params: {
                        color: "#1B9E77", // Carbon - green (custom, overriding standard gray)
                        selector: { type_symbol: "C" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFFFFF", // Hydrogen - white
                        selector: { type_symbol: "H" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFFFC0", // Deuterium - light yellow
                        selector: { type_symbol: "D" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFFFA0", // Tritium - light yellow
                        selector: { type_symbol: "T" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#D9FFFF", // Helium - light cyan
                        selector: { type_symbol: "HE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#CC80FF", // Lithium - light purple
                        selector: { type_symbol: "LI" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#C2FF00", // Beryllium - yellow-green
                        selector: { type_symbol: "BE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFB5B5", // Boron - light red
                        selector: { type_symbol: "B" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#3050F8", // Nitrogen - blue
                        selector: { type_symbol: "N" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FF0D0D", // Oxygen - red
                        selector: { type_symbol: "O" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#90E050", // Fluorine - light green
                        selector: { type_symbol: "F" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#B3E3F5", // Neon - light blue
                        selector: { type_symbol: "NE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#AB5CF2", // Sodium - purple
                        selector: { type_symbol: "NA" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#8AFF00", // Magnesium - green
                        selector: { type_symbol: "MG" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#BFA6A6", // Aluminum - gray
                        selector: { type_symbol: "AL" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#F0C8A0", // Silicon - orange
                        selector: { type_symbol: "SI" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FF8000", // Phosphorus - orange
                        selector: { type_symbol: "P" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFFF30", // Sulfur - yellow
                        selector: { type_symbol: "S" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#1FF01F", // Chlorine - green
                        selector: { type_symbol: "CL" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#80D1E3", // Argon - light blue
                        selector: { type_symbol: "AR" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#8F40D4", // Potassium - purple
                        selector: { type_symbol: "K" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#3DFF00", // Calcium - green
                        selector: { type_symbol: "CA" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#E6E6E6", // Scandium - light gray
                        selector: { type_symbol: "SC" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#BFC2C7", // Titanium - gray
                        selector: { type_symbol: "TI" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#A6A6AB", // Vanadium - gray
                        selector: { type_symbol: "V" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#8A99C7", // Chromium - blue-gray
                        selector: { type_symbol: "CR" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#9C7AC7", // Manganese - purple
                        selector: { type_symbol: "MN" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#E06633", // Iron - orange-red
                        selector: { type_symbol: "FE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#F090A0", // Cobalt - pink
                        selector: { type_symbol: "CO" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#50D050", // Nickel - green
                        selector: { type_symbol: "NI" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#C88033", // Copper - brown
                        selector: { type_symbol: "CU" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#7D80B0", // Zinc - blue-gray
                        selector: { type_symbol: "ZN" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#C28F8F", // Gallium - pink-gray
                        selector: { type_symbol: "GA" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#668F8F", // Germanium - blue-gray
                        selector: { type_symbol: "GE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#BD80E3", // Arsenic - purple
                        selector: { type_symbol: "AS" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFA100", // Selenium - orange
                        selector: { type_symbol: "SE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#A62929", // Bromine - dark red
                        selector: { type_symbol: "BR" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#5CB8D1", // Krypton - light blue
                        selector: { type_symbol: "KR" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#702EB0", // Rubidium - purple
                        selector: { type_symbol: "RB" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#00FF00", // Strontium - green
                        selector: { type_symbol: "SR" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#94FFFF", // Yttrium - cyan
                        selector: { type_symbol: "Y" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#94E0E0", // Zirconium - light cyan
                        selector: { type_symbol: "ZR" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#73C2C9", // Niobium - light blue
                        selector: { type_symbol: "NB" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#54B5B5", // Molybdenum - teal
                        selector: { type_symbol: "MO" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#3B9E9E", // Technetium - teal
                        selector: { type_symbol: "TC" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#248F8F", // Ruthenium - dark teal
                        selector: { type_symbol: "RU" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#0A7D8C", // Rhodium - dark teal
                        selector: { type_symbol: "RH" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#006985", // Palladium - dark blue
                        selector: { type_symbol: "PD" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#C0C0C0", // Silver - silver
                        selector: { type_symbol: "AG" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#FFD98F", // Cadmium - light orange
                        selector: { type_symbol: "CD" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#A67573", // Indium - brown
                        selector: { type_symbol: "IN" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#668080", // Tin - blue-gray
                        selector: { type_symbol: "SN" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#9E63B5", // Antimony - purple
                        selector: { type_symbol: "SB" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#D47A00", // Tellurium - orange
                        selector: { type_symbol: "TE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#940094", // Iodine - purple
                        selector: { type_symbol: "I" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#940094", // Xenon - purple
                        selector: { type_symbol: "XE" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#57178F", // Cesium - dark purple
                        selector: { type_symbol: "CS" },
                      },
                    },
                    {
                      kind: "color",
                      params: {
                        color: "#00C900", // Barium - green
                        selector: { type_symbol: "BA" },
                      },
                    },
                    // Default fallback for any other elements
                    {
                      kind: "color",
                      params: {
                        color: "#FFFFFF", // Default - white
                        selector: { type_symbol: "*" },
                      },
                    },
                  ]
                  : [
                    {
                      kind: "color",
                      params: {
                        color: i === 0 ? "#CCCCCC" : "#FD9D0D",
                        selector: "all",
                      },
                    },
                  ]),
                // Apply opacity only for the first protein
                ...(i === 0
                  ? [
                    {
                      kind: "opacity",
                      params: {
                        opacity: 0.5,
                      },
                    },
                  ]
                  : []),
              ],
            },
          ],
        };

        // Apply superposition transform - use defaults if not provided
        const defaultRotation: Matrix3D = [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ];
        const defaultTranslation: Vector3D = [0, 0, 0];

        const rotation = protein.superposition?.rotation || defaultRotation;
        const translation =
          protein.superposition?.translation || defaultTranslation;

        // Determine format based on file type for File objects
        let parseFormat = "mmcif"; // Default for UniProt IDs
        if (typeof protein.structure !== "string") {
          const file = protein.structure as File;
          parseFormat = file.name.endsWith(".pdb") ? "pdb" : "mmcif";
        }

        // Create structure chain: download -> parse -> structure
        const structureChain: unknown[] = [
          {
            kind: "parse",
            params: {
              format: parseFormat,
            },
            children: [
              {
                kind: "structure",
                params: {
                  type: "model",
                  ...(typeof protein.structure !== "string"
                    ? {
                      block_header: null,
                      block_index: 0,
                      model_index: 0,
                    }
                    : {}),
                },
                children: [
                  {
                    kind: "transform",
                    params: {
                      // Flatten the 3x3 matrix to a 9-element array for MolStar
                      rotation: transposeAndFlatten(rotation),
                      translation: translation,
                    },
                  },
                  component,
                ],
              },
            ],
          },
        ];

        debug("Apply superposition transform", "MSWRAPPER");

        const proteinStructure = {
          kind: "download",
          params: {
            url: structureUrl,
          },
          children: structureChain,
        };

        children.push(proteinStructure);
      }

      const mvsSpec = {
        kind: "single",
        root: {
          kind: "root",
          children: children,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.4",
          title:
            proteins.length > 1
              ? "Protein Comparison"
              : "Protein Visualization",
          description: `Visualization of ${proteins.length} protein(s)`,
        },
      };

      debug("Successfully created MVS specification", "MSWRAPPER");
      debug(`MVS spec: ${JSON.stringify(mvsSpec, null, 2)}`, "MSWRAPPER");
      return mvsSpec;
    } catch (e) {
      error(`Error creating MVS: ${e}`, "MSWRAPPER");
      return null;
    }
  }

  async loadMVSUsingExtension(
    viewer: MolStarViewer,
    mvsSpec: MVSSpecification
  ): Promise<boolean> {
    if (!mvsSpec) {
      return false;
    }

    try {
      const mvsPlugin = window.molstar.PluginExtensions?.mvs;
      const plugin = viewer.plugin;

      if (
        mvsPlugin &&
        typeof (mvsPlugin as { loadMVSData?: unknown }).loadMVSData ===
        "function"
      ) {
        await (
          mvsPlugin as {
            loadMVSData: (
              plugin: unknown,
              mvsSpec: MVSSpecification,
              format: string
            ) => Promise<void>;
          }
        ).loadMVSData(plugin, mvsSpec, "mvsj");
        return true;
      }

      return false;
    } catch (e) {
      error(`Error loading MVS: ${e}`, "MSWRAPPER");
      return false;
    }
  }
}

export function MSWrapper({
  proteins,
  bgColor = "#ffffff",
  showUI = false,
  height,
  className = "",
}: MSWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerState, setViewerState] = useState(ViewerState.Loading);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || proteins.length === 0) {
      return;
    }

    let mounted = true;
    setViewerState(ViewerState.Loading);

    async function init() {
      try {
        if (!containerRef.current || !mounted || !mountedRef.current) {
          return;
        }

        const manager = MolStarViewerManager.getInstance();
        let viewer = manager.getViewer(containerRef.current);

        // If viewer exists, clear existing content to reload with new data
        if (viewer && mounted && mountedRef.current) {
          if (viewer.plugin?.clear) {
            await viewer.plugin.clear();
          }
        } else {
          // Create new viewer if none exists
          viewer = await manager.initializeViewer(containerRef.current, showUI);
        }

        if (!mounted || !mountedRef.current) {
          return;
        }

        // Set background color if specified
        if (bgColor && viewer.plugin && viewer.plugin.canvas3d) {
          viewer.plugin.canvas3d.setProps({
            renderer: {
              backgroundColor: bgColor,
            },
          });
        }

        if (window.molstar?.ExtensionMap?.mvs) {
          const customMVS = manager.createCustomMVS(proteins);

          if (customMVS) {
            const mvsSuccess = await manager.loadMVSUsingExtension(
              viewer,
              customMVS
            );

            if (!mvsSuccess) {
              if (mounted && mountedRef.current) {
                setViewerState(ViewerState.Error);
              }
              return;
            }


          } else {
            if (mounted && mountedRef.current) {
              setViewerState(ViewerState.Error);
            }
            return;
          }
        } else {
          if (mounted && mountedRef.current) {
            setViewerState(ViewerState.Error);
          }
          return;
        }

        if (mounted && mountedRef.current) {
          setViewerState(ViewerState.Success);
        }
      } catch (e) {
        error(`Error initializing MolStar viewer: ${e}`, "MSWRAPPER");
        if (mounted && mountedRef.current) {
          setViewerState(ViewerState.Error);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [proteins, bgColor, showUI]);

  // Cleanup on unmount
  useEffect(() => {
    const currentContainer = containerRef.current;
    return () => {
      if (currentContainer) {
        const manager = MolStarViewerManager.getInstance();
        manager.disposeViewer(currentContainer);
      }
      mountedRef.current = false;
    };
  }, []);

  const containerStyle: CSSProperties = {
    height: height ? `${height}px` : "100%",
  };

  let classes = `w-full relative molstar-wrapper ${showUI ? "" : "molstar-no-ui"}`;
  if (!height) {
    classes += " h-full";
  }
  if (className) {
    classes += ` ${className}`;
  }

  return (
    <div className={classes} style={containerStyle}>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          position: "relative",
          opacity: viewerState === ViewerState.Success ? 1 : 0.4,
        }}
      />

      {viewerState === ViewerState.Loading && <Loader />}

      {viewerState === ViewerState.Error && <ErrorDisplay />}
    </div>
  );
}
