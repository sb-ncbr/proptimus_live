import type { Matrix3D, Vector3D } from "@/lib/types";

export type Protein = {
  structure: string | File; // UniProt ID as string or PDB/mmCIF file
  chain?: string; // Optional chain identifier
  superposition?: {
    rotation: Matrix3D;
    translation: Vector3D;
  };
};
