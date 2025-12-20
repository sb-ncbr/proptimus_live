"use client";

import Marquee from "react-fast-marquee";
import ProteinLink from "./ProteinLink";

interface ProteinItem {
  id: number;
  name: string;
  uniprotId: string;
  category: string;
  confidence: string;
}

export default function ProteinMarquee(): React.JSX.Element {
  const proteins: ProteinItem[] = [
    {
      id: 1,
      name: "Hemoglobin Alpha Chain",
      uniprotId: "P69905",
      category: "Oxygen Transport",
      confidence: "99.2%",
    },
    {
      id: 2,
      name: "Human Insulin",
      uniprotId: "P01308",
      category: "Hormone",
      confidence: "98.7%",
    },
    {
      id: 3,
      name: "Lysozyme",
      uniprotId: "P61626",
      category: "Antimicrobial",
      confidence: "97.9%",
    },
    {
      id: 4,
      name: "Cytochrome C",
      uniprotId: "P99999",
      category: "Electron Transport",
      confidence: "99.5%",
    },
    {
      id: 5,
      name: "Myoglobin",
      uniprotId: "P68082",
      category: "Oxygen Storage",
      confidence: "98.3%",
    },
    {
      id: 6,
      name: "Alpha-Amylase",
      uniprotId: "P04746",
      category: "Enzyme",
      confidence: "96.8%",
    },
    {
      id: 7,
      name: "Carbonic Anhydrase",
      uniprotId: "P00918",
      category: "Enzyme",
      confidence: "99.1%",
    },
    {
      id: 8,
      name: "Immunoglobulin G",
      uniprotId: "P01857",
      category: "Antibody",
      confidence: "97.4%",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-secondary via-primary to-secondary py-12">
      <div className="container mx-auto px-4 mb-8">
        <div className="text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Featured Protein Database
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Explore our constantly expanding collection of high-confidence
            protein structures
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* First marquee - moving right */}
        <Marquee
          gradient={false}
          speed={40}
          className="py-4"
          pauseOnHover={true}
        >
          {proteins.slice(0, 4).map((protein) => (
            <div
              key={protein.id}
              className="mx-4 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[320px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {protein.category}
                </span>
                <span className="text-green-600 font-semibold text-sm">
                  {protein.confidence}
                </span>
              </div>

              <h3 className="text-xl font-bold text-secondary mb-2">
                <ProteinLink
                  href={`/protein/${protein.uniprotId}`}
                  className="hover:text-primary transition-colors duration-200"
                >
                  {protein.name}
                </ProteinLink>
              </h3>

              <p className="text-gray-600 font-mono text-sm mb-4">
                UniProt: {protein.uniprotId}
              </p>

              <div className="flex gap-2">
                <ProteinLink
                  href={`/protein/${protein.uniprotId}`}
                  className="flex-1 text-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm font-medium"
                >
                  View Structure
                </ProteinLink>
                <a
                  href={`https://www.uniprot.org/uniprot/${protein.uniprotId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                >
                  UniProt
                </a>
              </div>
            </div>
          ))}
        </Marquee>

        {/* Second marquee - moving left */}
        <Marquee
          gradient={false}
          speed={35}
          direction="right"
          className="py-4"
          pauseOnHover={true}
        >
          {proteins.slice(4).map((protein) => (
            <div
              key={protein.id}
              className="mx-4 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[320px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                  {protein.category}
                </span>
                <span className="text-green-600 font-semibold text-sm">
                  {protein.confidence}
                </span>
              </div>

              <h3 className="text-xl font-bold text-secondary mb-2">
                <ProteinLink
                  href={`/protein/${protein.uniprotId}`}
                  className="hover:text-primary transition-colors duration-200"
                >
                  {protein.name}
                </ProteinLink>
              </h3>

              <p className="text-gray-600 font-mono text-sm mb-4">
                UniProt: {protein.uniprotId}
              </p>

              <div className="flex gap-2">
                <ProteinLink
                  href={`/protein/${protein.uniprotId}`}
                  className="flex-1 text-center px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors duration-200 text-sm font-medium"
                >
                  View Structure
                </ProteinLink>
                <a
                  href={`https://www.uniprot.org/uniprot/${protein.uniprotId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                >
                  UniProt
                </a>
              </div>
            </div>
          ))}
        </Marquee>
      </div>

      <div className="text-center mt-8">
        <p className="text-white/80 text-lg">
          🔬 Thousands more proteins available in our database
        </p>
      </div>
    </div>
  );
}
