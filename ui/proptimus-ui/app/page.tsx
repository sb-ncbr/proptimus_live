import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Separator,
} from "@e-infra/design-system";
import Footer from "@/components/layout/Footer";
import { ArrowRight, Globe, Github } from "lucide-react";
import CitingSection from "@/components/landing_page/CitingSection";

const tools = [
  {
    name: "PROPTIMUS LIVE",
    description:
      "Real-time constrained α-carbons optimisation of protein structures predicted by AlphaFold2. Submit a UniProt ID and get optimised structures in minutes.",
    href: "/live",
    status: "available" as const,
    icon: Globe,
  },
  {
    name: "PROPTIMUS PRIME",
    description:
      "Per-residue optimisation of protein structures — repair of amino-acid side chains in structures predicted by AlphaFold2. Run locally as a CLI or integrate as a Python library.",
    href: "https://github.com/sb-ncbr/proptimus_prime",
    status: "coming-soon" as const,
    icon: Github,
  },
  {
    name: "PROPTIMUS RAPHAN",
    description:
      "Rapid optimisation with constrained α-carbons using a divide-and-conquer approach. Computation time scales linearly with structure size, powered by the GFN-FF force field.",
    href: "https://github.com/sb-ncbr/proptimus_raphan",
    status: "coming-soon" as const,
    icon: Github,
  },
];

export default function LandingPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center group transition-all duration-300 hover:scale-105"
            >
              <span className="text-2xl font-bold text-foreground">
                PR
                <span className="text-muted-foreground">
                  OPTIMUS
                </span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Protein background image */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/protein-bg.svg"
            className="w-full h-full object-cover opacity-20 bg-blue-200"
            aria-hidden="true"
          />
        </div>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background pointer-events-none" />

        <div className="relative z-10 container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            PR
            <span className="text-muted-foreground">OPTIMUS</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Web platform for the local optimisation of protein structures
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            Powered by the GFN-Force-Field, accelerated by a divide-and-conquer
            RAPHAN approach. Free and open to all users.
          </p>
          <Button asChild size="lg">
            <Link href="/live">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      {/* Tools Grid */}
      <section className="py-16 px-4 flex-1">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-12">
            Available Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <ToolCard key={tool.name} {...tool} />
            ))}
          </div>
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />
      {/* 
      <CitingSection /> */}
    </main>
  );
}

function ToolCard({
  name,
  description,
  href,
  status,
  icon: Icon,
}: {
  name: string;
  description: string;
  href: string;
  status: "available" | "coming-soon";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isAvailable = status === "available";

  const card = (
    <Card
      className={`h-full flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="h-8 w-8 text-primary" />
          {/* {!isAvailable && (
            <Badge variant="secondary"><p className="p-1">Coming Soon</p></Badge>
          )} */}
        </div>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1" />
      <CardFooter>
        <Button className="w-full" variant={isAvailable ? "default" : "outline"}>
          {isAvailable ? "Try now" : "View Source"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <Link href={href} target={isAvailable ? undefined : "_blank"}>
      {card}
    </Link>
  );
}
