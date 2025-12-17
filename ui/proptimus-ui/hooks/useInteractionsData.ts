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
    enabled: !!jobId,
    staleTime: 5000, // Data is fresh for 5 seconds
    refetchInterval: (query) => {
      // Stop refetching if we have the interaction data
      const data = query.state.data;
      if (data && data["hbonds original"] !== undefined) {
        return false;
      }
      // Otherwise refetch every 3 seconds
      return 3000;
    },
  });
}
