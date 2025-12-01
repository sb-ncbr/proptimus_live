import ProductCard from "./ProductCard";

export default function ProductCards(): React.JSX.Element {
  const showcase_items = [
    {
      id: 1,
      name: "Hemoglobin",
      uniprotId: "P69905",
      description:
        "Oxygen-carrying protein found in red blood cells, essential for transporting oxygen from lungs to tissues throughout the body.",
    },
    {
      id: 2,
      name: "Insulin",
      uniprotId: "P01308",
      description:
        "Hormone that regulates blood glucose levels by facilitating cellular glucose uptake and promoting glycogen synthesis.",
    },
    {
      id: 3,
      name: "Lysozyme",
      uniprotId: "P61626",
      description:
        "Antimicrobial enzyme that breaks down bacterial cell walls, naturally found in tears, saliva, and mucus.",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
          Examples
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Examples of structure improvements are from the structure with Uniprot AC A4QBG9. The original structure from AlphaFold DB is shown in grey, and the structure optimised by FFFold is in colour.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {showcase_items.map((showcase_item) => (
          <ProductCard key={showcase_item.id} protein={showcase_item} />
        ))}
      </div>
    </div>
  );
}
