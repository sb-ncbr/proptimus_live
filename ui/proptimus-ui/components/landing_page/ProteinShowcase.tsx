import ProteinLink from "./ProteinLink";
import Image, { StaticImageData } from "next/image";
import times from "../../public/assets/about/times.svg";
import histogram from "../../public/assets/about/histogram.svg";
import schema from "../../public/assets/about/schema.svg";
import { ChevronLeft, ChevronRight, ChevronsUp, X } from "lucide-react";
import { useState } from "react";

interface Protein {
  id: number;
  name: string;
  uniprotId: string;
  description: string;
  fullDescription?: string;
  imageSrc: StaticImageData;
  documentationHref: string;
}

interface ProteinShowcaseItemProps {
  protein: Protein;
  isReversed: boolean;
  onImageClick: () => void;
}

function ProteinShowcaseItem({
  protein,
  isReversed,
  onImageClick,
}: ProteinShowcaseItemProps) {
  return (
    <div
      className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-8 ${isReversed ? "lg:flex-row-reverse" : ""}`}
    >
      {/* Canvas Side */}
      <div className="w-full lg:w-[57%]">
        <div
          className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden cursor-pointer transition-shadow transition-fade-in duration-300 hover:shadow-2xl"
          onClick={onImageClick}
        >
          <div className="w-full h-80 lg:h-108 flex items-center justify-center bg-white">
            <Image
              src={protein.imageSrc}
              alt={protein.name}
              className="max-h-full max-w-full p-4 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Content Side */}
      <div className="w-full lg:w-[43%]">
        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
              <ProteinLink
                href={protein.documentationHref}
                className="hover:text-primary transition-colors duration-300"
              >
                {protein.name}
              </ProteinLink>
            </h3>
            <p className="text-lg text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg inline-block">
              Img: {protein.uniprotId}
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">
              {protein.fullDescription || protein.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 ">
            <ProteinLink
              href={protein.documentationHref}
              className="transition-all duration-300 hover:scale-105 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 font-medium"
            >
              Read More
              <ChevronRight className="ml-2 w-5 h-5"></ChevronRight>
            </ProteinLink>
            <a
              href="#hero"
              className="transition-all duration-300 hover:scale-105 inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Try it Yourself
              <ChevronsUp className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div >
  );
}

export default function ProteinShowcase(): React.JSX.Element {
  const [selectedImage, setSelectedImage] = useState<{
    src: StaticImageData;
    alt: string;
  } | null>(null);

  const featuredProteins = [
    {
      id: 1,
      name: "How it work?",
      uniprotId: "Scheme of the RAPHAN approach",
      description:
        "PROPTIMUS LIVE optimises protein structures using the RAPHAN method.",
      fullDescription:
        "PROPTIMUS LIVE optimises protein structures using the RAPHAN method, which is a rapid alternative to optimisation with constrained α-carbons. RAPHAN is an iterative divide-and-conquer method, which divides the protein into overlapping substructures and optimises each substructure separately. Substructures are optimised by physics-based GFN-Force-Field, designed to combine high force-field speed with the accuracy of QM methods.",
      imageSrc: schema,
      documentationHref: "https://www.biorxiv.org/content/10.1101/2025.11.24.690085v1.full",
    },
    {
      id: 2,
      name: "How accurate is it?",
      uniprotId: "Atom position deviations for RAPHAN and GFN-FF constrained α-carbons optimisations.",
      description: "The RAPHAN method produces highly accurate structures.",
      fullDescription:
        "The RAPHAN method produces structures comparable to structures optimised by GFN-Force-Field with constrained α-carbons. The mean absolute deviation of atomic positions is approximately 0.03 Å, and the 99th percentile is 0.33 Å. As can be seen in the histogram, structures may differ exceptionally for highly flexible residues.",
      imageSrc: histogram,
      documentationHref: "https://www.biorxiv.org/content/10.1101/2025.11.24.690085v1.full",
    },
    {
      id: 3,
      name: "How fast is it?",
      uniprotId: "Optimisation times for RAPHAN and GFN-FF constrained α-carbons optimisations",
      description: "RAPHAN optimises proteins in minutes.",
      fullDescription:
        "A lot. While the duration of GFN-Force-Field optimisation with constrained α-carbons grows approximately quadratically with the size of the structure, by dividing the protein into substructures, RAPHAN's calculation speed is linear with respect to the structure's size. Thanks to parallelisation, PROPTIMUS LIVE optimises proteins without ligands at an average speed of 1000 atoms per minute.",
      imageSrc: times,
      documentationHref: "https://www.biorxiv.org/content/10.1101/2025.11.24.690085v1.full",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
          About the RAPHAN approach
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore our method for fast and accurate protein structure optimisation.
        </p>
      </div>

      <div className="space-y-40">
        {featuredProteins.map((protein, index) => (
          <ProteinShowcaseItem
            key={protein.id}
            protein={protein}
            isReversed={index % 2 === 1}
            onImageClick={() => setSelectedImage({ src: protein.imageSrc, alt: protein.name })}
          />
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-white bg-opacity-40 transition-fade-in duration-300 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg z-10"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
            <div
              className="relative bg-white rounded-lg shadow-2xl max-w-full max-h-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain p-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
