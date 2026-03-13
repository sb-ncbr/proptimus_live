import { StructureRepresentationPresetProvider } from "molstar/lib/mol-plugin-state/builder/structure/representation-preset";
import { StructureRepresentationBuiltInProps } from "molstar/lib/mol-plugin-state/helpers/structure-representation-params";
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import {
  DefaultPluginUISpec,
  PluginUISpec,
} from "molstar/lib/mol-plugin-ui/spec";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { Color } from "molstar/lib/mol-util/color";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  Observable,
  Subscription,
} from "rxjs";
import { setSubtreeVisibility } from "molstar/lib/mol-plugin/behavior/static/state";
import {
  OptimizationDifference,
  optimizationDifferenceLabelProvider,
} from "../molstar/optimization-difference";
import { OptimizationDataEntry } from "./optimization-difference/label";
import {
  Scene,
  Coloring,
  StructureUrls,
  StructureRefs,
  Warnings,
} from "./types";
import {
  QueryContext,
  StructureSelection,
} from "molstar/lib/mol-model/structure";
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { compile } from "molstar/lib/mol-script/runtime/query/base";
import { Loci } from "molstar/lib/mol-model/loci";
import { API_URL } from "@/lib/utils";

export class MolstarModel {
  readonly plugin: PluginUIContext;
  private _subscriptions: Subscription[] = [];
  private _highlightTimeout: ReturnType<typeof setTimeout> | null = null;
  private _highlightedLoci: Loci | null = null;
  private _highlightExpiry: number = 0;
  private _pinnedHighlightLoci: Loci | null = null;

  public state = {
    isInitialized: new BehaviorSubject<boolean>(false),
    isDisposed: new BehaviorSubject<boolean>(false),
    isLoading: new BehaviorSubject<boolean>(false),
    isExpanded: new BehaviorSubject<boolean>(false),
    showControls: new BehaviorSubject<boolean>(false),

    view: {
      scene: new BehaviorSubject<Scene["kind"]>("original"),
      color: new BehaviorSubject<Coloring["kind"]>("element-symbol"),
    },

    jobId: new BehaviorSubject<string | undefined>(undefined),
    structureRefs: new BehaviorSubject<StructureRefs>({}),
    differences: new BehaviorSubject<OptimizationDataEntry[] | undefined>(
      undefined
    ),
    warnings: new BehaviorSubject<Warnings | undefined>(undefined),
    pinnedHighlight: new BehaviorSubject<boolean>(false),
  };

  constructor() {
    const defaultSpec = DefaultPluginUISpec();
    const spec: PluginUISpec = {
      ...defaultSpec,
      behaviors: [
        ...defaultSpec.behaviors,
        PluginSpec.Behavior(OptimizationDifference),
      ],
      components: {
        sequenceViewer: {
          defaultMode: "all",
        },
      },
      layout: {
        initial: {
          ...defaultSpec.layout?.initial,
          isExpanded: this.state.isExpanded.value,
          showControls: this.state.showControls.value,
          controlsDisplay: "landscape",
        },
      },
      canvas3d: {
        ...defaultSpec.canvas3d,
        renderer: {
          ...defaultSpec.canvas3d?.renderer,
          backgroundColor: Color(0xffffff),
        },
      },
      config: [
        [PluginConfig.Viewport.ShowAnimation, false],
        [PluginConfig.Viewport.ShowTrajectoryControls, false],
      ],
    };
    this.plugin = new PluginUIContext(spec);
  }

  private _subscribe<T>(observable: Observable<T>, sub: (v: T) => void) {
    this._subscriptions.push(observable.subscribe(sub));
  }

  private _sub(): void {
    this._subscribe(this.plugin!.layout.events.updated, () => {
      this.state.isExpanded.next(this.plugin.layout.state.isExpanded);
      this.state.showControls.next(this.plugin.layout.state.showControls);
    });

    this._subscribe(
      this.state.jobId.pipe(
        filter((x): x is string => !!x),
        distinctUntilChanged()
      ),
      (jobId) => this._handleJobChange(jobId)
    );

    this._subscribe(
      this.state.differences.pipe(
        filter((x) => !!x),
        distinctUntilChanged()
      ),
      (differences) => {
        optimizationDifferenceLabelProvider.setData(differences);
      }
    );

    this._subscribe(
      this.state.view.scene.pipe(distinctUntilChanged()),
      (scene) => this._handleSceneChange(scene)
    );

    this._subscribe(
      this.state.view.color.pipe(distinctUntilChanged()),
      (color) => this._handleColorChange(color)
    );

    this._subscribe(this.plugin.behaviors.interaction.hover, () => {
      this._maintainHighlight();
    });

    this._subscribe(
      this.plugin.managers.interactivity.events.propsUpdated,
      () => {
        const granularity =
          this.plugin.managers.interactivity.props.granularity;
        optimizationDifferenceLabelProvider.setGranularity(granularity);
      }
    );
  }

  private _unsub(): void {
    for (const sub of this._subscriptions) sub.unsubscribe();
    this._subscriptions = [];
  }

  async mount(): Promise<void> {
    if (this.state.isInitialized.value) return;
    await this.plugin.init();
    this._sub();
    this.plugin.behaviors.layout.leftPanelTabName.next("data");

    optimizationDifferenceLabelProvider.setColoring(
      this.state.view.color.value
    );
    optimizationDifferenceLabelProvider.setGranularity("not-atom");

    this.state.isInitialized.next(true);
  }

  unmount(): void {
    if (this.state.isDisposed.value) return;
    if (this._highlightTimeout) {
      clearTimeout(this._highlightTimeout);
      this._highlightTimeout = null;
    }
    this._highlightedLoci = null;
    this._pinnedHighlightLoci = null;
    this.state.pinnedHighlight.next(false);
    this.plugin.dispose();
    this._unsub();
    this.state.isDisposed.next(true);
  }

  private async _handleJobChange(jobId: string): Promise<void> {
    const resultUrl =
      normalizeRequestUrl(`${API_URL}/results?ID=${jobId}`) ??
      `${API_URL}/results?ID=${jobId}`;
    const differencesUrl =
      normalizeRequestUrl(`${API_URL}/differences/${jobId}`) ??
      `${API_URL}/differences/${jobId}`;
    const warningsUrl =
      normalizeRequestUrl(`${API_URL}/warnings/${jobId}`) ??
      `${API_URL}/warnings/${jobId}`;

    const result = await this._fetchData<any>(resultUrl);
    const differences = await this._fetchData<any[]>(differencesUrl);
    const warnings = await this._fetchData<Warnings>(warningsUrl);

    const structureRefs: StructureRefs = {};

    if (result) {
      const pdbFiles = result.pdb_files as StructureUrls;
      for (const id of Object.keys(pdbFiles)) {
        const sceneKind = id as Scene["kind"];
        const pdbUrl = normalizeRequestUrl(pdbFiles[sceneKind]);
        if (!pdbUrl) continue;
        const ref = await this.loadPdbFile(pdbUrl, sceneKind);
        if (ref) {
          structureRefs[sceneKind] = ref;
        }
      }
      this.state.structureRefs.next(structureRefs);
      this._handleSceneChange(this.state.view.scene.value);
    }
    if (differences) this.state.differences.next(differences);
    if (warnings) this.state.warnings.next(warnings);
  }

  private async _fetchData<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data as T;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async reset(): Promise<void> {
    this.clearPinnedHighlight();

    this.plugin.clear();

    this.state.view.scene.next("original");
    this.state.view.color.next("element-symbol");
    this.state.jobId.next(undefined);
    this.state.structureRefs.next({});
    this.state.differences.next(undefined);
    this.state.warnings.next(undefined);
  }

  async setup(jobId: string) {
    await this.reset();
    this.state.jobId.next(jobId);
  }

  async loadPdbFile(url: string, ref: Scene["kind"]): Promise<string | null> {
    this.state.isLoading.next(true);
    try {
      const data = await this.plugin.builders.data.download({
        url: url,
        isBinary: false,
        label: ref,
      });

      const trajectory = await this.plugin.builders.structure.parseTrajectory(
        data,
        "pdb"
      );

      const model =
        await this.plugin.builders.structure.createModel(trajectory);

      const structure = await this.plugin.builders.structure.createStructure(
        model,
        {
          name: "auto",
          params: {},
        }
      );

      const component =
        await this.plugin.builders.structure.tryCreateComponentStatic(
          structure,
          "all"
        );

      if (!component) {
        console.error(`Failed to create polymer component for: ${url}`);
        return null;
      }

      const props: StructureRepresentationBuiltInProps =
        ref === "optimised"
          ? {
              type: "ball-and-stick",
              typeParams: {
                alpha: 1,
              },
              color: "element-symbol",
              colorParams: {
                carbonColor: {
                  name: "uniform",
                  params: { value: Color(0x1b9e77) },
                },
              },
            }
          : {
              type: "ball-and-stick",
              typeParams: {
                alpha: 0.6,
              },
              color: "uniform",
              colorParams: { value: Color(0xd2d2d2) },
            };

      const representation =
        await this.plugin.builders.structure.representation.addRepresentation(
          component,
          props,
          { tag: ref, initialState: { isHidden: true } }
        );

      return representation.ref;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      this.state.isLoading.next(false);
    }
  }

  async updateFocusColorTheme(color: Coloring["kind"]) {
    const structures =
      this.plugin.managers.structure.hierarchy.current.structures;
    if (structures.length === 0) return;

    for (const structure of structures) {
      const struct = structure.cell.obj?.data;
      if (!struct) continue;
      await StructureRepresentationPresetProvider.updateFocusRepr(
        this.plugin,
        struct,
        color as any,
        { data: this.state.differences.value }
      );
    }
  }

  private _handleSceneChange(scene: Scene["kind"]): void {
    const showControls = scene === "trajectory";
    this.plugin.config.set(PluginConfig.Viewport.ShowAnimation, showControls);
    this.plugin.config.set(
      PluginConfig.Viewport.ShowTrajectoryControls,
      showControls
    );

    PluginCommands.Layout.Update(this.plugin, { state: {} });

    const refs = this.state.structureRefs.value;
    const visibleScenes: Scene["kind"][] =
      scene === "optimised" ? ["optimised"] : [scene, "optimised"];

    for (const [key, ref] of Object.entries(refs)) {
      if (!ref) continue;
      const isVisible = visibleScenes.includes(key as Scene["kind"]);
      setSubtreeVisibility(this.plugin.state.data, ref, !isVisible);
    }
  }

  private async _handleColorChange(color: Coloring["kind"]): Promise<void> {
    const optimisedRef = this.state.structureRefs.value.optimised;
    if (!optimisedRef) return;

    const cell = this.plugin.state.data.cells.get(optimisedRef);
    if (!cell) return;

    const colorParams =
      color === "optimization-difference"
        ? { data: this.state.differences.value || [] }
        : {
            carbonColor: {
              name: "uniform",
              params: { value: Color(0x1b9e77) },
            },
          };

    const targetColor =
      color === "optimization-difference"
        ? "optimization-difference"
        : "element-symbol";

    const update = this.plugin.build();
    update
      .to(cell)
      .update(StateTransforms.Representation.StructureRepresentation3D, (p) => {
        p.colorTheme = { name: targetColor, params: colorParams };
      });
    await update.commit();

    await this.updateFocusColorTheme(color);

    optimizationDifferenceLabelProvider.setColoring(color);
  }

  focusResidue(chainId: string, residueId: number, residueName?: string): void {
    const structureRef =
      this.plugin.managers.structure.hierarchy.current.structures[0];
    const structure = structureRef?.cell.obj?.data;
    if (!structure) {
      console.warn("No structure loaded");
      return;
    }

    const expression = MS.struct.generator.atomGroups({
      "atom-test": MS.core.logic.and([
        MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.auth_asym_id(),
          chainId,
        ]),
        MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.auth_seq_id(),
          residueId,
        ]),
      ]),
    });

    this._focusExpression(expression, structure);
  }

  focusResidues(
    chainId1: string,
    residueId1: number,
    residueName1: string,
    chainId2: string,
    residueId2: number,
    residueName2: string
  ): void {
    const structureRef =
      this.plugin.managers.structure.hierarchy.current.structures[0];
    const structure = structureRef?.cell.obj?.data;
    if (!structure) {
      console.warn("No structure loaded");
      return;
    }

    const expression = MS.struct.generator.atomGroups({
      "atom-test": MS.core.logic.or([
        MS.core.logic.and([
          MS.core.rel.eq([
            MS.struct.atomProperty.macromolecular.auth_asym_id(),
            chainId1,
          ]),
          MS.core.rel.eq([
            MS.struct.atomProperty.macromolecular.auth_seq_id(),
            residueId1,
          ]),
        ]),
        MS.core.logic.and([
          MS.core.rel.eq([
            MS.struct.atomProperty.macromolecular.auth_asym_id(),
            chainId2,
          ]),
          MS.core.rel.eq([
            MS.struct.atomProperty.macromolecular.auth_seq_id(),
            residueId2,
          ]),
        ]),
      ]),
    });

    this._focusExpression(expression, structure);
  }

  private _focusExpression(
    expression: ReturnType<typeof MS.struct.generator.atomGroups>,
    structure: any
  ): void {
    try {
      const query = compile<StructureSelection>(expression);
      const structureSelection = query(new QueryContext(structure));
      const loci = StructureSelection.toLociWithSourceUnits(structureSelection);

      this.plugin.managers.camera.focusLoci(loci);
      this.plugin.managers.structure.focus.setFromLoci(loci);

      this._highlightWithTimeout(loci);
    } catch (e) {
      console.error("Failed to focus on residue:", e);
    }
  }

  private _highlightWithTimeout(loci: Loci, timeoutMs: number = 2000): void {
    if (this._highlightTimeout) {
      clearTimeout(this._highlightTimeout);
    }

    this._pinnedHighlightLoci = null;

    this._highlightedLoci = loci;
    this._highlightExpiry = Date.now() + timeoutMs;

    this.state.pinnedHighlight.next(true);

    this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });

    this._highlightTimeout = setTimeout(() => {
      this._pinnedHighlightLoci = this._highlightedLoci;
      this._highlightedLoci = null;
      this._highlightTimeout = null;
    }, timeoutMs);
  }

  private _maintainHighlight(): void {
    if (this._pinnedHighlightLoci) {
      this.plugin.managers.interactivity.lociHighlights.highlightOnly({
        loci: this._pinnedHighlightLoci,
      });
      return;
    }

    if (this._highlightedLoci && Date.now() < this._highlightExpiry) {
      this.plugin.managers.interactivity.lociHighlights.highlightOnly({
        loci: this._highlightedLoci,
      });
    }
  }

  clearPinnedHighlight(): void {
    if (this._highlightTimeout) {
      clearTimeout(this._highlightTimeout);
      this._highlightTimeout = null;
    }

    this._highlightedLoci = null;
    this._pinnedHighlightLoci = null;
    this.state.pinnedHighlight.next(false);

    this.plugin.managers.interactivity.lociHighlights.clearHighlights();
  }
}

function normalizeRequestUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    if (typeof window === "undefined") return url;

    const parsedUrl = new URL(url, window.location.origin);
    const pageProtocol = window.location.protocol;

    if (pageProtocol === "https:" && parsedUrl.protocol === "http:") {
      parsedUrl.protocol = "https:";
    }

    return parsedUrl.toString();
  } catch {
    return url;
  }
}
