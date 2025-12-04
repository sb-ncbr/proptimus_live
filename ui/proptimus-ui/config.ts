export const config = {
  app: {
    name: "PROPTIMus",
    hero: "Constrained α-carbons optimisation <br/> of protein structures",
    fullName: "PROPTIMus - Web application for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database.",
    description: "PROPTIMus is a web-based application that allows for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database. Users can upload their own protein structures in PDB format, and the application will perform local optimisation using state-of-the-art molecular dynamics simulations. The results are then visualised in an interactive 3D viewer, allowing users to explore the optimised structures and compare them with the original predictions.",
    version: "1.0.0",
    author: "PROPTIMus Team",
    url: "https://fffold.muni.cz",
    domain: "fffold.muni.cz",
  },
  meta: {
    title: "PROPTIMus - Web application for the local optimisation of protein structures",
    description: "PROPTIMus is a web application for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database. Protein regions predicted with confidence less than 90 are optimized by the physics-based generic force field GFN-FF accelerated by a divide-and-conquer approach which results are comparable to the optimisation of whole protein structure with constrained α-carbons. Thus, PROPTIMus LIVE optimises in particular the bond lengths and angles and describes the interactions between nearby residues. Before computation of the charges, input protein structures are protonated by PROPKA3. The details about the methodology and usage are described in the manual. This website is free and open to all users and there is no login requirement.",
    keywords: [
      "PROPTIMus",
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
      siteName: "PROPTIMus",
      title: "PROPTIMus - Web application for the local optimisation of protein structures",
      description: "PROPTIMus is a web-based application that allows for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database.",
      image: "/og-image.png",
      imageAlt: "PROPTIMus - Protein Structure Optimization",
    },
    twitter: {
      card: "summary_large_image",
      title: "PROPTIMus - Protein Structure Optimization",
      description: "Web application for the local optimisation of protein structures predicted by AlphaFold2 and deposited in the AlphaFoldDB database.",
      image: "/twitter-image.png",
      imageAlt: "PROPTIMus - Protein Structure Optimization",
    },
  },
  contact: {
    email: "ondrej.schindler@mail.muni.cz",
    github: "https://github.com/sb-ncbr/FFFold",
    support: "https://github.com/sb-ncbr/FFFold/issues",
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
