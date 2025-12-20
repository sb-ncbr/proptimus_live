export const config = {
  app: {
    name: "PROPTIMUS",
    hero: "Constrained α-carbons optimisation <br/> of protein structures",
    fullName: "PROPTIMUS - Web application for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database.",
    description: "PROPTIMUS is a web-based application that allows for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database. Users can upload their own protein structures in PDB format, and the application will perform local optimisation using state-of-the-art molecular dynamics simulations. The results are then visualised in an interactive 3D viewer, allowing users to explore the optimised structures and compare them with the original predictions.",
    version: "1.0.0",
    author: "PROPTIMUS Team",
    url: "https://fffold.muni.cz",
    domain: "fffold.muni.cz",
  },
  meta: {
    title: "PROPTIMUS - Web application for the local optimisation of protein structures",
    description: "PROPTIMUS LIVE is a freely available application for the constrained α-carbons optimisation of (but not limited to) ML-predicted protein structures. It is powered by the GFN-Force-Field, accelerated by a divide-and-conquer RAPHAN approach. This website is free and open to all users, with no login requirement.",
    keywords: [
      "PROPTIMUS",
      "Protein Structure Optimization",
      "AlphaFold",
      "AlphaFoldDB",
      "pH-dependent optimization",
      "Protein protonation",
      "PROPKA3",
      "GFN-FF",
      "Force field",
      "Molecular optimization",
      "Protein structure refinement",
      "Structural biology",
      "Bioinformatics",
      "Protein chemistry",
      "UniProt",
      "PDB",
      "3D protein visualization",
      "Computational chemistry",
      "Divide-and-conquer",
      "Alpha-carbon constraint",
    ] as string[],
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "PROPTIMUS",
      title: "PROPTIMUS - Web application for the local optimisation of protein structures",
      description: "PROPTIMUS is a web-based application that allows for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database.",
      image: "/assets/proptimus-preview.png",
      imageAlt: "PROPTIMUS - Protein Structure Optimization",
    },
    twitter: {
      card: "summary_large_image",
      title: "PROPTIMUS - Protein Structure Optimization",
      description: "Web application for the local optimisation of protein structures predicted by AlphaFold2 and deposited in the AlphaFoldDB database.",
      image: "/assets/proptimus-preview.png",
      imageAlt: "PROPTIMUS - Protein Structure Optimization",
    },
  },
  contact: {
    email: "ondrej.schindler@mail.muni.cz",
    github: "https://github.com/sb-ncbr/proptimus_live",
    support: "https://github.com/sb-ncbr/proptimus_live/issues",
  },
  features: [
    "Structure-based protein search",
    "AlphaFold Database integration",
    "Uniprot ID, PDB ID, and Gene Symbol support",
    "3D protein visualization",
    "Structural superposition display",
    "Organism-based result grouping",
    "Advanced filtering capabilities",
    "Free and open access",
  ],
  navigation: [
    { name: "Home", href: "/" },
    { name: "Search", href: "/search" },
    { name: "About", href: "/about" },
  ],
  // File upload and data fetching configuration
  upload: {
    // File size limit in KB (50 MB)
    fileSizeLimit: 51200,
  },
  experimental: {
    // Data fetching configuration for experimental features
    dataFetch: {
      batchSize: 5,
      pauseDuration: 3000, // in milliseconds
    },
  },
} as const;

export type Config = typeof config;
