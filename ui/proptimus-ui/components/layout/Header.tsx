"use client";

import Link from "next/link";
import * as Avatar from "@radix-ui/react-avatar";
import github_mark from "../../public/assets/img/github-mark.png";

export default function Header(): React.JSX.Element {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center group transition-all duration-300 hover:scale-105 hover:drop-shadow-md"
          >
            <span className="text-2xl font-bold text-zinc-900 group-hover:brightness-110 transition-all duration-300">
              PR
              <span className="text-secondary group-hover:text-primary-600 dark-silver-text  ">
                OPTIMus
              </span>
            </span>
          </Link>

          {/* Manual Link & GitHub Avatar */}
          <div className="flex items-center gap-4">
            <a href="https://github.com/sb-ncbr/FFFold" target="_blank" rel="noopener noreferrer">
              <Avatar.Root className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center bg-white">
                <Avatar.Image
                  src="/assets/img/github-mark.png"
                  alt="GitHub"
                  className="w-full h-full object-cover"
                />
                <Avatar.Fallback className="text-xs text-gray-500 flex items-center justify-center w-full h-full">
                  GH
                </Avatar.Fallback>
              </Avatar.Root>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
