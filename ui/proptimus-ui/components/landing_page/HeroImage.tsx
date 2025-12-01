import { config } from "@/config";
import UniprotInputSection from "./UniprotInputSection";
import ProteinResultsCard from "../optimization/ProteinResultsCard";
import { AlertTriangle, FlaskConical, Award, Beaker, Droplets, Gauge, Activity, Zap, BadgeCheck, Crosshair, Cpu, ChartNoAxesCombined, Atom, ChevronsUp, Globe, LocateFixed } from "lucide-react";
import React from "react";

export default function HeroImage(): React.JSX.Element {
  const name = config.app.name ?? "";
  const firstTwo = name.slice(0, 2);
  const rest = name.slice(2);
  return (
    <div id="hero" className="relative w-full h-80 lg:h-180 overflow-hidden">
      {/* Background gradient with scientific pattern */}
      <div className="absolute top-4 right-4 z-5">
        <ProteinResultsCard />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-white [color-stop:15%] via-secondary/80 [color-stop:85%] to-primary-700/60">
        {/* Protein SVG overlay with pulse */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/protein-bg.svg"
            alt="Protein background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        {/* Floating particles */}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center text-white space-y-6">
          <h1 className="text-4xl lg:text-7xl font-bold mb-4 pb-10 ">
            <span className="text-secondary">{firstTwo}</span>
            <span className="silver-shimmer">
              {rest}
            </span>
          </h1>

          <p className="text-xl lg:text-4xl text-white/90 max-w-5xl mx-auto silver-text">
            <h1>
              {config.app.hero.split('<br/>').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < config.app.hero.split('<br/>').length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full text-xl justify-items-center items-center mt-8 ">
            <div className="flex items-center gap-2 col-span-1 text-dark-silver">
              <ChevronsUp className="w-7 h-7" /> Fast
            </div>
            <div className="flex items-center gap-2 col-span-1 text-dark-silver">
              <LocateFixed className="w-7 h-7" /> Accurate
            </div>
            <div className="flex items-center gap-2 col-span-1 text-dark-silver">
              <BadgeCheck className="w-7 h-7" /> Free
            </div>
          </div>
          <UniprotInputSection />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
}
