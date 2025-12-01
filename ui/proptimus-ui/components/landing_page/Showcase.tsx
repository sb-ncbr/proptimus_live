import ShowcaseCard from "./ShowcaseCard";

export default function Showcase(): React.JSX.Element {
  const showcase_items = [
    {
      id: 1,
      name: "Bond length",
      imageSrc: "/assets/showcase/bond_length.png",
      description:
        "The bond length between CA and H atoms in MET1 is modified about 0.1 angstrom. On average, the bond lengths in MET1 are optimized by 0.05 angstrom.",
    },
    {
      id: 2,
      name: "Dihedral angles",
      imageSrc: "/assets/showcase/dihedral.png",
      description:
        "Dihedral angles in THR126 between atoms OG1, CB, CG2 and hydrogens HG21, HG22, HG23 are optimised from energetically unfavourable eclipsed conformation.",
    },
    {
      id: 3,
      name: "Hydrogen bond",
      imageSrc: "/assets/showcase/hydrogen_bond.png",
      description:
        "The hydrogen bond was formed between atoms HD1 from HIS20 and O from GLY86.",
    },
    {
      id: 4,
      name: "π–π stacking",
      imageSrc: "/assets/showcase/pi_stacking.png",
      description:
        "T-shaped π–π stacking is formed between residues PHE90 and HIS461.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
          Examples
        </h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Examples of structure improvements are from the structure with Uniprot AC A4QBG9. The original structure from AlphaFold DB is shown in grey, and the structure optimised by FFFold is in colour.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {showcase_items.map((showcase_item) => (
          <ShowcaseCard key={showcase_item.id} showcase={showcase_item} />
        ))}
      </div>
    </div>
  );
}
