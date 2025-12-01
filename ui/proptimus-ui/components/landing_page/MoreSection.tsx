import ProteinLink from "./ProteinLink";

export default function MoreSection(): React.JSX.Element {
  const links = [
    { href: "/search", label: "Advanced Search" },
    { href: "/browse", label: "Browse Database" },
    { href: "/documentation", label: "Documentation" },
    { href: "/api", label: "API Access" },
    { href: "/downloads", label: "Downloads" },
    { href: "/about", label: "About AlphaFind" },
    { href: "/contact", label: "Contact Us" },
    { href: "/news", label: "Latest News" },
  ];

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-200 py-8 my-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-6">
          More
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {links.map((link) => (
            <ProteinLink
              key={link.href}
              href={link.href}
              className="text-lg lg:text-xl text-gray-700 hover:text-primary font-medium transition-all duration-300 hover:scale-105 py-2 px-3 rounded-lg hover:bg-white/50"
            >
              {link.label}
            </ProteinLink>
          ))}
        </div>

        <div className="mt-6 text-gray-600">
          <p className="text-base">
            Explore the full potential of our protein structure database
          </p>
        </div>
      </div>
    </div>
  );
}
