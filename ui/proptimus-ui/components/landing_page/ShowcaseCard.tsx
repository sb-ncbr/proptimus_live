import Image from "next/image";

interface Showcase {
  id: number;
  name: string;
  imageSrc: string;
  description: string;
}

interface ShowcaseCardProps {
  showcase: Showcase;
}

export default function ShowcaseCard({ showcase }: ShowcaseCardProps) {
  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Image Placeholder */}
      <div className="w-full bg-gray-300 flex items-center justify-center p-2 bg-white">
        <img
          src={showcase.imageSrc}
          alt={showcase.name}
          className="object-contain h-full w-full"
        />
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Header with showcase name */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-secondary mb-1">
            {showcase.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed text-sm">
          {showcase.description}
        </p>
      </div>
    </div>
  );
}
