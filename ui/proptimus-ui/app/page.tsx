"use client";

import Header from "../components/layout/Header";
import HeroImage from "../components/landing_page/HeroImage";
import Footer from "../components/layout/Footer";
import UniProtMarquee from "@/components/landing_page/UniProtMarquee";
import ProteinShowcase from "@/components/landing_page/ProteinShowcase";
import LicenseSection from "@/components/landing_page/LicenseSection";
import { useRouter } from "next/navigation";
import Showcase from "@/components/landing_page/Showcase";
import DescriptionSection from "@/components/landing_page/DescriptionSection";
import ProteinResultsCard from "@/components/optimization/ProteinResultsCard";

export default function Home(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <HeroImage />
      <DescriptionSection />
      <Showcase />
      <ProteinShowcase />
      <LicenseSection />

    </main>
  );
}
