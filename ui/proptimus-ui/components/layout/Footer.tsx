import Image from "next/image";
import FooterLinks from "./FooterLinks";
import { config } from "@/config";

export default function Footer(): React.JSX.Element {
  return (
    <footer className="bg-secondary/95 backdrop-blur-md text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section - Partners and Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Partners */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold mb-6">Collaboration</h3>
            <div className="grid grid-cols-4 gap-6">
              <a
                href="https://www.ncbr.muni.cz/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center p-2 transition-transform duration-300 hover:scale-110 bg-white rounded-lg"
              >
                <Image
                  src="/assets/img/ncbr-logo.png"
                  alt="National Centre for Biomolecular Research"
                  width={160}
                  height={140}
                  className="object-contain"
                />
              </a>
              <a
                href="https://www.ics.muni.cz/"
                target="_blank"
                rel="noo pener noreferrer"
                className="group flex items-center justify-center p-2 transition-transform duration-300 hover:scale-110 bg-white rounded-lg"
              >
                <Image
                  src="/assets/img/muni_ics.png"
                  alt="MUNI Institute of Computer Science"
                  width={80}
                  height={60}
                  className="object-contain"
                />
              </a>
              <a
                href="https://www.elixir-czech.cz/services"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center p-2 transition-transform duration-300 bg-white rounded-lg hover:scale-110"
              >
                <Image
                  src="/assets/img/elixir_logo.webp"
                  alt="MUNI Institute of Computer Science"
                  width={80}
                  height={60}
                  className="object-contain"
                />
              </a>
              <a
                href="https://www.cesnet.cz/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center p-2 transition-transform duration-300 bg-white rounded-lg hover:scale-110"
              >
                <Image
                  src="/assets/img/cesnet_RGB.svg"
                  alt="MUNI Institute of Computer Science"
                  width={100}
                  height={80}
                  className="object-contain"
                />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary text-sm">✉️</span>
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Email</p>
                  <a
                    href={`mailto:${config.contact.email}`}
                    className="text-white text-sm hover:text-primary transition-colors duration-200"
                  >
                    {config.contact.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary text-sm">⚡</span>
                </div>
                <div>
                  <p className="text-gray-300 text-xs">GitHub</p>
                  <a
                    href={config.contact.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-sm hover:text-primary transition-colors duration-200"
                  >
                    View Repository
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary text-sm">💬</span>
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Support</p>
                  <a
                    href={config.contact.support}
                    className="text-white text-sm hover:text-primary transition-colors duration-200"
                  >
                    Get Help
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-600/50 mb-8" />

        {/* Bottom Section - App Info and Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="sm:flex-row lg:flex items-center space-x-3">
            <div>
              <span className="text-white font-semibold text-4xl">PR</span>
              <span className="dark-silver-text text-4xl font-bold">
                OPTIMUS <br />
                LIVE
              </span>
            </div>

            <div className="ml-4">
              <p className="text-gray-400 text-sm max-w-4xl mt-4 lg:mt-0">
                {config.meta.description}
              </p>
            </div>
          </div>
          <div className="text-center md:text-right space-y-2">
            {/* Links Section */}
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {config.app.name}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
