"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const citations = [
    {
        label: "APA",
        text: "Author, A. A., & Author, B. B. (TBD). PROPTIMUS: A web platform for local optimisation of protein structures. TBD Journal. https://doi.org/TBD",
    },
    {
        label: "BibTeX",
        text: `@article{proptimus_tbd,
  author  = {Author, A. A. and Author, B. B.},
  title   = {PROPTIMUS: A web platform for local optimisation of protein structures},
  journal = {TBD Journal},
  year    = {TBD},
  doi     = {TBD},
}`,
    },
    {
        label: "RIS",
        text: `TY  - JOUR
AU  - Author, A. A.
AU  - Author, B. B.
TI  - PROPTIMUS: A web platform for local optimisation of protein structures
JO  - TBD Journal
PY  - TBD
DO  - TBD
ER  -`,
    },
    {
        label: "Chicago",
        text: 'Author, A. A., and B. B. Author. "PROPTIMUS: A Web Platform for Local Optimisation of Protein Structures." TBD Journal (TBD). https://doi.org/TBD.',
    },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors duration-150 shrink-0"
            aria-label="Copy to clipboard"
        >
            {copied ? (
                <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-green-600">Copied</span>
                </>
            ) : (
                <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
}

export default function CitingSection(): React.JSX.Element {
    return (
        <section className="bg-gray-50 border-t">
            <div className="mx-auto max-w-4xl px-6 py-14">
                <h2 className="lg:text-4xl font-bold text-center text-gray-900 mb-4">
                    Citing
                </h2>
                <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
                    A publication for PROPTIMUS is currently in preparation. In the meantime, please use the placeholder citations below — they will be updated once the paper is published.
                </p>

                <div className="flex flex-col gap-4">
                    {citations.map((cite) => (
                        <div
                            key={cite.label}
                            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                                    {cite.label}
                                </span>
                                <CopyButton text={cite.text} />
                            </div>
                            <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap break-all font-mono leading-relaxed">
                                {cite.text}
                            </pre>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
