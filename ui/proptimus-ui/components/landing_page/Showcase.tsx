"use client";

import ShowcaseCard from "./ShowcaseCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@e-infra/design-system";

export default function Showcase(): React.JSX.Element {
  const showcase_items = [
    {
      id: 1,
      name: "Physically unrealistic",
      imageSrc: "/assets/showcase/repair1.png",
      description: (
        <>
          Fixing non-physically predicted atoms NH1 and NH2 of ARG 22 in the structure {" "}
          <a
            href="/live/results?query=A4QJE9_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            A4QJE9
          </a>
        </>
      ),
    },
    {
      id: 2,
      name: "Dihedral angles",
      imageSrc: "/assets/showcase/angle1.png",
      description: (
        <>
          Optimisation of THR 555 from an eclipsed conformation in the structure {" "}
          <a
            href="/live/results?query=Q57N56_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Q57N56
          </a>
        </>
      ),
    },
    {
      id: 3,
      name: "Hydrogen bond",
      imageSrc: "/assets/showcase/residual1.png",
      description: (
        <>
          Hydrogen bond formation between ARG 369 and GLN 370 in the structure {" "}
          <a
            href="/live/results?query=B7ZW16_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            B7ZW16
          </a>
        </>
      ),
    },
    {
      id: 4,
      name: "Zinc finger",
      imageSrc: "/assets/showcase/ligand1.png",
      description: (
        <>
          Optimisation of HIS 25 to achieve a coplanar orientation with the zinc ion in the structure {" "}
          <a
            href="/live/results?query=5xht_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            5xht
          </a>
        </>
      ),
    },
    {
      id: 5,
      name: "Physically unrealistic",
      imageSrc: "/assets/showcase/repair2.png",
      description: (
        <>
          Fixing non-physically predicted atoms of TYR 22 and MET 26 in the structure {" "}
          <a
            href="/live/results?query=Q9RS06_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Q9RS06
          </a>
        </>
      ),
    },
    {
      id: 6,
      name: "Dihedral angles",
      imageSrc: "/assets/showcase/angle2.png",
      description: (
        <>
          Hydrogens optimisation of VAL 123 from an eclipsed conformation in the structure {" "}
          <a
            href="/live/results?query=Q3M859_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Q3M859
          </a>
        </>
      ),
    },
    {
      id: 7,
      name: "Cation–π interaction",
      imageSrc: "/assets/showcase/residual2.png",
      description: (
        <>
          Formation of cation–π interaction of ARG 237 in the structure {" "}
          <a
            href="/live/results?query=Q3M859_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Q3M859
          </a>
        </>
      ),
    },
    {
      id: 8,
      name: "π–π stacking",
      imageSrc: "/assets/showcase/ligand2.png",
      description: (
        <>
          Stabilisation of MXT 170 via the formation of three π–π stacking interactions in the structure {" "}
          <a
            href="/live/results?query=1ao8_7.0"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            1ao8
          </a>
        </>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
          How PROPTIMUS LIVE improves structures?
        </h2>
        <p className="text-lg text-gray-600 max-w-5xl mx-auto">
          Original structures are grey, while those optimized by PROPTIMUS LIVE are colored.
        </p>
      </div>

      <Carousel
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent className="ml-4 p-10">
          {showcase_items.map((showcase_item) => (
            <CarouselItem
              key={showcase_item.id}
              className="pl-4 h-full basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <ShowcaseCard showcase={showcase_item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
