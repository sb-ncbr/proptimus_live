import { useQuery } from "@tanstack/react-query";
import type { Warnings } from "@/lib/molstar/types";

export function useWarnings(jobId: string, options?: { enabled?: boolean }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  return useQuery<Warnings>({
    queryKey: ["warnings", jobId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/warnings/${jobId}`);
      if (!response.ok) {
        let errorMessage = "Failed to fetch warnings data";
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
    staleTime: 60000,
    retry: false,
  });
}
