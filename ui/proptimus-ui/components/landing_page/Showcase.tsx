import ShowcaseCard from "./ShowcaseCard";

export default function Showcase(): React.JSX.Element {
  const showcase_items = [
    {
      id: 1,
      name: "Wrongly predicted atoms",
      imageSrc: "/assets/showcase/bond_length.png",
      description: (
      <>
        Fixing non-physically predicted atoms NH1 and NH2 of arginine 22 in structure {" "}
        <a 
          href="https://proptimus.ceitec.cz/results?query=A4QJE9_7.0" 
          target="_blank" 
          rel="noreferrer" 
          className="font-semibold underline"
        >
          A4QJE9
        </a>.
      </>
    ),
    },
    {
      id: 2,
      name: "Bond lengths and angles",
      imageSrc: "/assets/showcase/dihedral.png",
      description: (
      <>
        Optimisation of threonine 555 from an almost eclipsed conformation in the structure {" "}
        <a 
          href="https://proptimus.ceitec.cz/results?query=Q57N56_7.0" 
          target="_blank" 
          rel="noreferrer" 
          className="font-semibold underline"
        >
          Q57N56
        </a>.
      </>
    ),
    },
    {
      id: 3,
      name: "Hydrogen bond",
      imageSrc: "/assets/showcase/hydrogen_bond.png",
description: (
      <>
        Formation of a hydrogen bond between arginine 369 and glutamine 370 in the structure {" "}
        <a 
          href="https://proptimus.ceitec.cz/results?query=B7ZW16_7.0" 
          target="_blank" 
          rel="noreferrer" 
          className="font-semibold underline"
        >
          B7ZW16
        </a>.
      </>
    ),
    },
    {
      id: 4,
      name: "Cation–π interaction",
      imageSrc: "/assets/showcase/pi_stacking.png",
description: (
      <>
        Formation of cation–π interactions of arginine 237 in the structure {" "}
        <a 
          href="https://proptimus.ceitec.cz/results?query=Q3M859_7.0" 
          target="_blank" 
          rel="noreferrer" 
          className="font-semibold underline"
        >
          Q3M859
        </a>.
      </>
    ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
          How PROPTIMUS LIVE improves structures?
        </h2>
        <p className="text-lg text-gray-600 max-w-5xl mx-auto">
          Original structures from <a
                  href="https://alphafold.ebi.ac.uk/" target="_blank"
                  rel="noreferrer" className="font-semibold underline">AlphaFold DB</a> are colored gray, while structures optimized by PROPTIMUS LIVE are colored.
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
