import { useMolstar } from "../context/MolstarContext";
import { useBehavior } from "@/hooks/useBehavior";

export function ColorLegend() {
  const { viewer } = useMolstar();

  if (!viewer) {
    return null;
  }

  return <ColorLegendInner viewer={viewer} />;
}

function ColorLegendInner({
  viewer,
}: {
  viewer: NonNullable<ReturnType<typeof useMolstar>["viewer"]>;
}) {
  const currentColor = useBehavior(viewer.state.view.color);

  if (currentColor !== "optimization-difference") {
    return null;
  }

  return (
    <div className="absolute bottom-3 outline-0 outline-[lab(65.6464% 1.53497 -5.42429)] left-24 z-51 p-2.5 max-w-100 text-sm leading-[1.42857143] text-[rgb(174,93,4)] bg-[rgb(238,236,231)]/90">
      <div className="mb-1.5 font-semibold">Optimization Difference</div>
      <div className="flex items-center gap-2">
        <span>0.0</span>
        <div
          className="w-24 h-3 outline outline-[rgb(51,43,31)]"
          style={{
            background: "linear-gradient(to right, #FFFFFF, #0000FF)",
          }}
        />
        <span>3.0+</span>
      </div>
    </div>
  );
}
