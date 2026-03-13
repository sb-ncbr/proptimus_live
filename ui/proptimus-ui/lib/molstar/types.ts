export type SceneKind = "original" | "prepared" | "trajectory" | "optimised";

export type Scene =
  | {
      kind: "original";
      label: "Original Structure & Optimised Structure";
    }
  | {
      kind: "prepared";
      label: "Prepared Structure & Optimised Structure";
    }
  | {
      kind: "trajectory";
      label: "Trajectory Structure & Optimised Structure";
    }
  | {
      kind: "optimised";
      label: "Optimised Structure";
    };

export type Coloring =
  | {
      kind: "element-symbol";
      label: "Element Symbol";
    }
  | {
      kind: "optimization-difference";
      label: "Optimization Difference";
    };

export type StructureUrls = Record<Scene["kind"], string | null>;
export type StructureRefs = Partial<Record<Scene["kind"], string>>;

export interface ResidueWarning {
  chain_id: string;
  residue_id: number;
  residue_name: string;
  message: string;
}

export interface InteractionWarning {
  chain_id_1: string;
  residue_id_1: number;
  residue_name_1: string;
  chain_id_2: string;
  residue_id_2: number;
  residue_name_2: string;
  message: string;
}

export interface WarningSection<T> {
  title: string;
  no_data_message: string;
  data: T[];
}

export interface Warnings {
  repair: WarningSection<ResidueWarning>;
  optimisation: WarningSection<ResidueWarning>;
  interactions: WarningSection<InteractionWarning>;
}
