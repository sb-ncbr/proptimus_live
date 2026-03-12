import { useMolstar } from "../context/MolstarContext";
import { useBehavior } from "@/hooks/useBehavior";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Scene, Coloring, SceneKind } from "@/lib/molstar/types";
import { XCircle } from "lucide-react";
import { Button } from "../common/Button";
import { useMemo } from "react";

const ALL_SCENES: { value: SceneKind; label: string }[] = [
  { value: "original", label: "Original & Optimised" },
  { value: "prepared", label: "Prepared & Optimised" },
  { value: "trajectory", label: "Trajectory & Optimised" },
  { value: "optimised", label: "Optimised Only" },
];

const COLORS: { value: Coloring["kind"]; label: string }[] = [
  { value: "element-symbol", label: "Element Symbol" },
  { value: "optimization-difference", label: "Optimization Difference" },
];

export function MolstarControls() {
  const { viewer } = useMolstar();
  const currentScene = useBehavior(viewer!.state.view.scene);
  const currentColor = useBehavior(viewer!.state.view.color);
  const hasPinnedHighlight = useBehavior(viewer!.state.pinnedHighlight);
  const structureRefs = useBehavior(viewer!.state.structureRefs);

  const availableScenes = useMemo(() => {
    const hasOptimised = !!structureRefs.optimised;
    return ALL_SCENES.filter((scene) => {
      if (scene.value === "optimised") {
        return hasOptimised;
      }
      return hasOptimised && !!structureRefs[scene.value];
    });
  }, [structureRefs]);

  const handleSceneChange = (value: Scene["kind"]) => {
    viewer!.state.view.scene.next(value);
  };

  const handleColorChange = (value: Coloring["kind"]) => {
    viewer!.state.view.color.next(value);
  };

  const handleClearHighlight = () => {
    viewer!.clearPinnedHighlight();
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="scene-select">Scene</Label>
        <Select value={currentScene} onValueChange={handleSceneChange}>
          <SelectTrigger id="scene-select" className="w-full sm:min-w-55">
            <SelectValue placeholder="Select scene" />
          </SelectTrigger>
          <SelectContent>
            {availableScenes.map((scene) => (
              <SelectItem key={scene.value} value={scene.value}>
                {scene.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="color-select">Coloring</Label>
        <Select value={currentColor} onValueChange={handleColorChange}>
          <SelectTrigger id="color-select" className="w-full sm:min-w-55">
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {COLORS.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                {color.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasPinnedHighlight && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-[#f2659f] hover:text-[#f2659f]/80"
          onClick={handleClearHighlight}
        >
          <XCircle className="h-4 w-4" />
          Clear Highlight
        </Button>
      )}
    </div>
  );
}
