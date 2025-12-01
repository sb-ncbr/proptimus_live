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
    description: "PROPTIMus is a web application for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database. Protein regions predicted with confidence less than 90 are optimized by the physics-based generic force field GFN-FF accelerated by a divide-and-conquer approach which results are comparable to the optimisation of whole protein structure with constrained α-carbons. Thus, FFFold optimises in particular the bond lengths and angles and describes the interactions between nearby residues. Before computation of the charges, input protein structures are protonated by PROPKA3. The details about the methodology and usage are described in the manual. This website is free and open to all users and there is no login requirement.",
    keywords: [
      "PROPTIMus",
      "AlphaFold",
      "Protein Structure",
      "Structure Search",
      "Protein Database",
      "Uniprot",
      "PDB",
      "Gene Symbol",
      "3D Visualization",
      "Structural Biology",
      "Bioinformatics",
      "Protein Comparison",
    ] as string[],
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "FFFold",
      title: "PROPTIMus - Web application for the local optimisation of protein structures",
      description: "PROPTIMus is a web-based application that allows for the local optimisation of protein structures predicted by the AlphaFold2 algorithm and deposited in the AlphaFoldDB database. Users can upload their own protein structures in PDB format, and the application will perform local optimisation using state-of-the-art molecular dynamics simulations. The results are then visualised in an interactive 3D viewer, allowing users to explore the optimised structures and compare them with the original predictions.",
      image: "/og-image.png",
      imageAlt: "AlphaFind - AlphaFold Protein Structure Search Engine",
    },
    twitter: {
      card: "summary_large_image",
      title: "AlphaFind - AlphaFold Protein Structure Search Engine",
      description: "AlphaFind is a web-based search engine that allows for structure-based search of the entire AlphaFold Protein Structure Database. Search by Uniprot ID, PDB ID, or Gene Symbol to find similar proteins with 3D visualizations and structural comparisons.",
      image: "/twitter-image.png",
      imageAlt: "AlphaFind - AlphaFold Protein Structure Search Engine",
    },
  },
  contact: {
    email: "Ondrej.Schindler@ceitec.muni.cz",
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
