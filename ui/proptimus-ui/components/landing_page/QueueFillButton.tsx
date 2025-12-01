"use client";

import type React from "react";
import { useState } from "react";
import EnvBasedRender from "../utility/EnvBasedRender";

interface QueueFillButtonProps {
  requestCount?: number;
}

export default function QueueFillButton({
  requestCount = 10,
}: QueueFillButtonProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);

  // Large array of valid UniProt IDs for testing (to avoid backend caching)
  const validUniProtIds = [
    // Tumor suppressors and oncogenes
    "P04637",
    "P53779",
    "P01111",
    "P04049",
    "P15056",
    "P04626",
    "P00533",
    "Q92934",
    "P42574",
    "P55210",
    "Q14790",
    "P55212",
    "P04150",
    "P03372",
    "P10275",
    "P24941",
    "P06493",
    "P11802",
    "P33981",
    "P78527",
    "P42336",

    // 14-3-3 protein family
    "P31946",
    "P62258",
    "Q04917",
    "P27348",
    "P31947",
    "P63104",
    "P61981",
    "P35213",
    "Q9BYJ5",
    "Q15125",
    "P51531",
    "Q86V25",
    "Q9Y5F5",

    // Hemoglobin variants
    "P68871",
    "P69905",
    "P02008",
    "P02100",
    "P69891",
    "P69892",
    "P02023",
    "P02042",
    "P02070",
    "P02144",
    "P69322",
    "P01922",
    "P02024",
    "P02025",

    // Hormones and signaling
    "P01308",
    "P01315",
    "P01137",
    "P01138",
    "P01133",
    "P01344",
    "P01350",
    "P01589",
    "P01375",
    "P01374",
    "P01185",
    "P01189",
    "P01193",
    "P01195",

    // Kinases
    "P24941",
    "P06493",
    "P11802",
    "P33981",
    "Q00534",
    "P78527",
    "P42336",
    "P29597",
    "P35244",
    "P35916",
    "P42574",
    "P49841",
    "Q13315",
    "Q16539",
    "P43405",
    "Q9Y243",
    "Q9P1W9",
    "Q9Y463",
    "Q9HBX9",
    "Q86V86",

    // Transcription factors
    "P04637",
    "P53350",
    "P53539",
    "P53355",
    "P53762",
    "P35869",
    "P35870",
    "P35871",
    "P35872",
    "P49711",
    "P49840",
    "Q13547",
    "Q13545",
    "Q13546",

    // Metabolic enzymes
    "P04406",
    "P04075",
    "P00367",
    "P00374",
    "P07195",
    "P07741",
    "P08319",
    "P09417",
    "P10768",
    "P11413",
    "P13521",
    "P15309",
    "P16870",
    "P17174",

    // Structural proteins
    "P02538",
    "P02545",
    "P02511",
    "P02533",
    "P02768",
    "P68871",
    "P69905",
    "P04264",
    "P10809",
    "P17661",
    "P35527",
    "P35555",
    "Q03001",
    "Q04695",

    // Immune system
    "P01023",
    "P01024",
    "P01031",
    "P01034",
    "P01871",
    "P01876",
    "P01877",
    "P0DOX5",
    "P0DOX7",
    "P0DOX8",
    "P01591",
    "P01593",
    "P01594",
    "P01903",

    // Transport proteins
    "P02768",
    "P02787",
    "P02790",
    "P02794",
    "P04004",
    "P08572",
    "P10909",
    "P15328",
    "P18669",
    "P19013",
    "P27169",
    "Q08431",
    "Q12955",
    "Q13201",

    // DNA repair and maintenance
    "P04637",
    "P78527",
    "Q07817",
    "Q13315",
    "Q13547",
    "Q13535",
    "Q92878",
    "P78539",
    "Q14831",
    "Q15046",
    "O43593",
    "O15350",
    "Q9Y6K9",
    "Q9BRQ8",

    // Cell cycle regulators
    "P24941",
    "P06493",
    "P11802",
    "P33981",
    "P42771",
    "P42772",
    "P42773",
    "P50613",
    "Q00534",
    "Q00535",
    "Q07820",
    "Q13315",
    "Q13547",
    "Q13535",

    // Proteases and inhibitors
    "P42574",
    "P55210",
    "Q14790",
    "P55212",
    "P10645",
    "P05067",
    "P25788",
    "P04156",
    "P05121",
    "P05543",
    "P07093",
    "P08311",
    "P08637",
    "P10645",

    // Neurotransmitter related
    "P18089",
    "P21728",
    "P23975",
    "P21917",
    "P08908",
    "P14416",
    "P18505",
    "P19256",
    "P21728",
    "P23975",
    "P28223",
    "P30988",
    "P35348",
    "P46098",

    // G-protein coupled receptors
    "P08913",
    "P25929",
    "P21728",
    "P04637",
    "P35348",
    "P35462",
    "P41143",
    "P50391",
    "P50406",
    "Q99705",
    "O00222",
    "O14842",
    "Q9Y5N1",
    "Q9NYQ6",

    // Ion channels
    "P35498",
    "P35499",
    "P35500",
    "P22001",
    "P22002",
    "P27695",
    "P35348",
    "P35462",
    "P41143",
    "P50391",
    "Q12809",
    "Q14524",
    "Q9Y5Y9",
    "Q96L42",

    // Cytokines and growth factors
    "P01137",
    "P01138",
    "P01133",
    "P01344",
    "P01350",
    "P01589",
    "P01375",
    "P01374",
    "P05231",
    "P08069",
    "P09919",
    "P10147",
    "P13500",
    "P15692",

    // Oxidative stress related
    "P04040",
    "P00441",
    "P04179",
    "P99999",
    "Q06830",
    "O00571",
    "P30041",
    "P32119",
    "P35754",
    "P36969",
    "Q04917",
    "Q16881",
    "Q9Y277",
    "Q96SL4",

    // Molecular chaperones
    "P07900",
    "P08107",
    "P11142",
    "P14625",
    "P34932",
    "P38646",
    "P50502",
    "Q92598",
    "Q9UBY9",
    "O14818",
    "Q8N1M1",
    "Q14103",
    "Q9H583",
    "Q9Y4L1",

    // Ubiquitin system
    "P62988",
    "P0CG47",
    "P61020",
    "P62987",
    "Q9BQ61",
    "Q9UBT2",
    "Q8N1G4",
    "Q8WXF1",
    "Q9Y4X5",
    "Q9Y6K5",
    "Q9BQA1",
    "Q9H6S0",
    "Q9H6T3",
    "Q9NPD3",
  ];

  const getRandomUniProtId = (): string => {
    const randomIndex = Math.floor(Math.random() * validUniProtIds.length);
    const selectedId = validUniProtIds[randomIndex];
    return selectedId || "P69905"; // fallback to a default ID
  };

  const fillQueue = async () => {
    if (!process.env.NEXT_PUBLIC_API_WHOLE_CHAINS_URL) {
      return;
    }

    setIsLoading(true);
    let _successCount = 0;
    let _errorCount = 0;

    try {
      for (let i = 0; i < requestCount; i++) {
        const randomUniProtId = getRandomUniProtId();
        const url = new URL(
          "/search",
          process.env.NEXT_PUBLIC_API_WHOLE_CHAINS_URL
        );

        // Set the required parameters
        url.searchParams.set("limit", "50");
        url.searchParams.set("offset", "0");
        url.searchParams.set("superposition", "true");
        url.searchParams.set("query", randomUniProtId);

        try {
          const response = await fetch(url.toString());

          if (response.ok) {
            _successCount++;
          } else {
            _errorCount++;
          }
        } catch (_error) {
          _errorCount++;
        }

        // Small delay between requests to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setLastRequestCount(requestCount);
    } catch (_error) {
      // Silently handle errors - queue filling is optional functionality
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EnvBasedRender allowedEnvs={["dev"]}>
      <button
        type="button"
        onClick={fillQueue}
        disabled={isLoading}
        className="hover:cursor-pointer fixed bottom-4 left-4 z-50 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl text-sm font-medium flex items-center gap-2"
        title={`Send ${requestCount} dummy requests to fill the backend queue`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Filling...
          </>
        ) : (
          <>
            🔥 Fill Queue
            {lastRequestCount > 0 && (
              <span className="text-xs opacity-75">({lastRequestCount})</span>
            )}
          </>
        )}
      </button>
    </EnvBasedRender>
  );
}
