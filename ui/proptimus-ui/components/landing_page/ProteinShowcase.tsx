import ProteinLink from "./ProteinLink";
import Image, { StaticImageData } from "next/image";
import times from "../../public/assets/about/times.svg";
import histogram from "../../public/assets/about/histogram.svg";
import schema from "../../public/assets/about/schema.svg";
import { ChevronLeft, ChevronRight, ChevronsUp } from "lucide-react";

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
}

function ProteinShowcaseItem({
  protein,
  isReversed,
}: ProteinShowcaseItemProps) {
  return (
    <div
      className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-8 ${isReversed ? "lg:flex-row-reverse" : ""}`}
    >
      {/* Canvas Side */}
      <div className="w-full lg:w-[57%]">
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
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
            <h3 className="text-3xl lg:text-4xl font-bold text-secondary mb-2">
              <ProteinLink
                href={protein.documentationHref}
                className="hover:text-primary transition-colors duration-300"
              >
                {protein.name}
              </ProteinLink>
            </h3>
            <p className="text-lg text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-lg inline-block">
              Img: {protein.uniprotId}
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">
              {protein.fullDescription || protein.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <ProteinLink
              href={protein.documentationHref}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 font-medium"
            >
              Read More
              <ChevronRight className="ml-2 w-5 h-5"></ChevronRight>
            </ProteinLink>
            <a
              href="#hero"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
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
  const featuredProteins = [
    {
      id: 1,
      name: "How does it work?",
      uniprotId: "schema",
      description:
        "PROPTIMus LIVE optimises protein structures using the RAPHAN method.",
      fullDescription:
        "PROPTIMus LIVE optimises protein structures using the RAPHAN method, which is a rapid alternative to optimisation with constrained α-carbons. RAPHAN is an iterative divide-and-conquer method, which divides the protein into overlapping substructures and optimises each substructure separately. Substructures are optimised by GFN-Force-Field, designed to combine high force-field speed with the accuracy of QM methods.",
      imageSrc: schema,
      documentationHref: "/manual",
    },
    {
      id: 2,
      name: "How accurate is it?",
      uniprotId: "histogram",
      description: "The RAPHAN method produces highly accurate structures.",
      fullDescription:
        "The RAPHAN method produces structures comparable to structures optimised with constrained α-carbons. The mean absolute deviation of atomic positions is approximately 0.03 Å, and the 99th percentile is 0.33 Å. As can be seen in the histogram, structures may differ exceptionally for highly flexible residues.",
      imageSrc: histogram,
      documentationHref: "/manual",
    },
    {
      id: 3,
      name: "How fast is it?",
      uniprotId: "times",
      description: "RAPHAN optimises proteins in minutes.",
      fullDescription:
        "A lot. While the duration of optimisation with constrained α-carbons grows approximately quadratically with the size of the structure, by dividing the protein into substructures, RAPHAN's calculation speed is linear with respect to the structure's size. Thanks to parallelisation, PROPTIMus LIVE optimises average proteins in a matter of minutes.",
      imageSrc: times,
      documentationHref: "/manual",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
          About our optimisation method
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
          />
        ))}
      </div>
    </div>
  );
}
