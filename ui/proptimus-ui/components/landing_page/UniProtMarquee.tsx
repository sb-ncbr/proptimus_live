"use client";

import Marquee from "react-fast-marquee";

export default function UniProtMarquee(): React.JSX.Element {
  const uniprotIds = [
    "P69905",
    "P01308",
    "P61626",
    "P99999",
    "P68082",
    "P04746",
    "P00918",
    "P01857",
    "Q813H7",
    "P53634",
    "P02144",
    "P02023",
    "P01009",
    "P04217",
    "P02768",
    "P01031",
    "P02675",
    "P02647",
    "P02671",
    "P02679",
    "P02760",
    "P02765",
    "P02774",
    "P02787",
    "P00738",
    "P00739",
    "P00740",
    "P00742",
    "P00748",
    "P00751",
    "P00766",
    "P00813",
    "P01023",
    "P01024",
    "P01028",
    "P01033",
    "P01034",
    "P01042",
    "P01344",
    "P01591",
  ];

  return (
    <div className="w-full bg-gray-100 py-6 border-y border-gray-200">
      <Marquee
        gradient={true}
        gradientColor="rgb(243, 244, 246)"
        gradientWidth={100}
        speed={50}
        pauseOnHover={true}
        className="text-gray-600"
      >
        {uniprotIds.map((id) => (
          <span
            key={id}
            className="mx-8 font-mono text-lg font-medium hover:text-primary transition-colors duration-200 cursor-default"
          >
            {id}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
