import { useQuery } from "@tanstack/react-query";

interface InteractionsData {
  ID: string;
  code: string;
  ph: string;
  "hbonds original"?: number;
  "hbonds optimised"?: number;
  "pipi original"?: number;
  "pipi optimised"?: number;
  "catpi original"?: number;
  "catpi optimised"?: number;
  "number of atoms"?: number;
}

export function useInteractionsData(
  jobId: string,
  options?: { enabled?: boolean }
) {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000" ||
    "http://proptimus.ceitec.cz/api";

  return useQuery<InteractionsData>({
    queryKey: ["interactions", jobId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/interactions/${jobId}`);
      if (!response.ok) {
        let errorMessage = "Failed to fetch interactions data";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    enabled: !!jobId && options?.enabled !== false,
    staleTime: 5000,
    retry: false,
  });
}
