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
}

export function useInteractionsData(jobId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  return useQuery<InteractionsData>({
    queryKey: ["interactions", jobId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/interactions/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch interactions data");
      }
      return response.json();
    },
    enabled: !!jobId,
    staleTime: 5000, // Data is fresh for 5 seconds
    refetchInterval: (data) => {
      // Stop refetching if we have the interaction data
      if (data && data["hbonds original"] !== undefined) {
        return false;
      }
      // Otherwise refetch every 3 seconds
      return 3000;
    },
  });
}
