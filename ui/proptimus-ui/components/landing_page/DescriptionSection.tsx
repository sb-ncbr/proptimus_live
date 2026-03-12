import React from "react";
import { Card } from "../ui/card";
import { AlertTriangle, FlaskConical, Award, Beaker, Droplets, Gauge, Activity, Zap, BadgeCheck, Crosshair, Cpu, ChartNoAxesCombined, Atom, ChevronsUp, Globe, BookOpen, Wrench } from "lucide-react";
import { Button } from "../common/Button";

export default function DescriptionSection(): React.JSX.Element {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="lg:text-4xl font-bold text-center text-gray-900 mb-8">
          About PROPTIMUS LIVE
        </h2>
        <p className="text-lg text-gray-700 text-center leading-relaxed mb-8">
          PROPTIMUS LIVE is a freely available application for the local constrained α-carbons optimisation of  protein structures. <br /> It is powered by the GFN-Force-Field, accelerated by a divide-and-conquer RAPHAN approach.

        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 m-2 ease-out">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">How PROPTIMUS LIVE works</h3>
            <div className="pl-1 text-gray-700 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <p className="leading-relaxed">Repairs non-physically predicted atoms with the <a
                  href="https://onlinelibrary.wiley.com/doi/10.1002/pro.3280" target="_blank"
                  rel="noreferrer" className="font-semibold underline">pdb2pqr</a> tool, <br /> which may be present in ML-predicted protein structures.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <Atom className="h-6 w-6 text-primary" />
                </div>
                <p className="leading-relaxed">
                  Adds hydrogens for user-specified pH using the <a
                    href="https://onlinelibrary.wiley.com/doi/10.1002/pro.3280" target="_blank"
                    rel="noreferrer" className="font-semibold underline">pdb2pqr</a> tool <br />if the input structure does not contain them.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <p className="leading-relaxed">Optimises protein structure with constrained α-carbons <br />using the <a href="https://onlinelibrary.wiley.com/doi/full/10.1002/anie.202004239" target="_blank"
                  rel="noreferrer" className="font-semibold underline">GFN-Force-Field</a>.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 m-2 ease-out">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Why use PROPTIMUS LIVE</h3>
            <div className="pl-1 text-gray-700 space-y-7">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <Crosshair className="h-6 w-6 text-primary mt-0.5" />
                </div>
                <p className="leading-relaxed">High-quality results because of the use of an almost<br /> quantum-mechanics accurate <a href="https://onlinelibrary.wiley.com/doi/full/10.1002/anie.202004239" target="_blank"
                  rel="noreferrer" className="font-semibold underline">GFN-Force-Field</a>.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <ChevronsUp className="h-7 w-7 text-primary" />
                </div>
                <p className="leading-relaxed">Fast calculations within minutes due to the acceleration<br /> by divide-and-conquer <a
                  href="https://www.biorxiv.org/content/10.1101/2025.11.24.690085v1" target="_blank"
                  rel="noreferrer" className="font-semibold underline">RAPHAN</a> approach.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <BadgeCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="leading-relaxed">Free and open to all users—no login required.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 text-center gap-y-4">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 ">Learn more</h3>
          <div className="flex justify-center">
            <a href="https://github.com/sb-ncbr/proptimus_live/wiki" target="_blank" rel="noreferrer">
              <Card className="p-6 m-2 transition-all duration-300 hover:scale-105 hover:shadow-lg  ease-out cursor-pointer max-w-md">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Documentation</h4>
                    <p className="text-sm text-gray-600">Visit our Wiki for detailed guides and information</p>
                  </div>
                </div>
              </Card>
            </a>
          </div>
        </div>
      </div>
    </section >
  );
}
