"use client";

import Link from "next/link";

interface ProteinLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function ProteinLink({
  href,
  children,
  className,
}: ProteinLinkProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
