import ProteinLink from "./ProteinLink";
import { NGLWrapper } from "../visualizations";

interface Protein {
  id: number;
  name: string;
  uniprotId: string;
  description: string;
}

interface ProductCardProps {
  protein: Protein;
}

export default function ProductCard({ protein }: ProductCardProps) {
  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* MolStar Canvas Placeholder */}
      <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
        <NGLWrapper
          proteins={[
            {
              structure: protein.uniprotId,
            },
          ]}
          spin={true}
        />
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Header with protein name and UniProt ID */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-secondary mb-1">
            <ProteinLink
              href={`/protein/${protein.uniprotId}`}
              className="hover:text-primary transition-colors duration-200"
            >
              {protein.name}
            </ProteinLink>
          </h3>
          <p className="text-sm text-gray-500 font-mono">
            UniProt: {protein.uniprotId}
          </p>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed text-sm">
          {protein.description}
        </p>
      </div>
    </div>
  );
}
