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
    <div id="hero" className="relative w-full h-[600px] sm:h-[700px] lg:h-200 overflow-hidden">
      {/* Background gradient with scientific pattern */}
      {/* Desktop: Full card, Mobile: Compact version */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
        <div className="block lg:hidden">
          <ProteinResultsCard compact={true} />
        </div>
        <div className="hidden lg:block">
          <ProteinResultsCard />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-white [color-stop:15%] via-secondary/80 [color-stop:85%] to-primary-700/60">
        {/* Protein SVG overlay with pulse */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/protein-bg.svg"
            className="w-full h-[110%] object-cover opacity-20"
          />
        </div>

        {/* Floating particles */}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="text-center text-white space-y-3 sm:space-y-6 max-w-6xl w-full">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold">
            <span className="text-secondary">{firstTwo}</span>
            <span className="silver-shimmer">
              {rest}
            </span>
          </h1>
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold mb-2 sm:mb-4 pb-4 sm:pb-6">
            <span className="silver-shimmer animate-pulse">
              LIVE
            </span>
          </h1>
          <p className="text-lg sm:text-2xl lg:text-4xl text-white/90 max-w-5xl mx-auto silver-text px-2">
            <h1>
              {config.app.hero.split('<br/>').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < config.app.hero.split('<br/>').length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto w-full text-sm sm:text-lg lg:text-xl justify-items-center items-center mt-4 sm:mt-8">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 col-span-1 text-dark-silver">
              <Gauge className="w-6 h-6 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <span className="text-sm sm:text-base lg:text-xl">Fast</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 col-span-1 text-dark-silver">
              <LocateFixed className="w-6 h-6 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <span className="text-sm sm:text-base lg:text-xl">Accurate</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 col-span-1 text-dark-silver">
              <BadgeCheck className="w-6 h-6 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <span className="text-sm sm:text-base lg:text-xl">Free</span>
            </div>
          </div>
          <UniprotInputSection />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
}
