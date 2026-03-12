import Image from "next/image";

interface Showcase {
  id: number;
  name: string;
  imageSrc: string;
  description: React.ReactNode;
}

interface ShowcaseCardProps {
  showcase: Showcase;
}

export default function ShowcaseCard({ showcase }: ShowcaseCardProps) {
  return (
    <div
      className="relative bg-white rounded-2xl m-2 shadow-lg border transition-all duration-300 hover:scale-105 hover:shadow-lg border-gray-200 overflow-hidden h-full flex flex-col min-h-[380px]">
      {/* Image Placeholder */}
      <div className="w-full h-48 bg-gray-300 flex items-center justify-center p-2 bg-white">
        <img
          src={showcase.imageSrc}
          alt={showcase.name}
          className="object-contain h-full w-full"
        />
      </div>

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Header with showcase name */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-secondary mb-1">
            {showcase.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed text-sm flex-1">
          {showcase.description}
        </p>
      </div>
    </div>
  );
}
