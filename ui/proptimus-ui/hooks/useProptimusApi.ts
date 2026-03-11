import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/utils";

export interface ResultsStatsResponse {
  calculated: number;
  queued: number;
  running: number;
}

// 1. Submit a job (POST /)
export function useSubmitJob() {
  return useMutation({
    mutationFn: async ({
      file,
      code,
      ph,
    }: {
      file: File | null;
      code: string;
      ph: string;
    }) => {
      let body: FormData | URLSearchParams;
      let headers: HeadersInit = {};

      if (file) {
        // Send as multipart/form-data with file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ph", ph);
        body = formData;
        // Don't set Content-Type - browser will set it with boundary
      } else {
        // Send as URL-encoded form data with code
        body = new URLSearchParams({ code, ph });
        headers = { "Content-Type": "application/x-www-form-urlencoded" };
      }

      const res = await apiFetch("/", {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        let errorMessage = "Failed to submit job";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await res.json(); // Returns { ID, status }
    },
  });
}

// 2. Get results (/results?ID=...)
export function useResults(ID: string) {
  return useQuery({
    queryKey: ["results", ID],
    queryFn: async () => {
      const res = await apiFetch(`/results?ID=${encodeURIComponent(ID)}`);
      if (!res.ok) {
        let errorMessage = "Failed to fetch results";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.text(); // may be HTML
    },
    enabled: !!ID,
  });
}

export function useResultsStats() {
  return useQuery<ResultsStatsResponse>({
    queryKey: ["results-stats"],
    queryFn: async () => {
      const res = await apiFetch(`/results`);
      if (!res.ok) {
        let errorMessage = "Failed to fetch results";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.json();
    },
  });
}

// 3. Get running progress (/api/running_progress?ID=...)
export function useRunningProgress(ID: string) {
  return useQuery({
    queryKey: ["progress", ID],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/running_progress?ID=${encodeURIComponent(ID)}`
      );
      if (!res.ok) {
        let errorMessage = "Failed to fetch progress";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.json();
    },
    enabled: !!ID,
    refetchInterval: 2000, // poll every 2s
  });
}

// 4. Download files (/download_files?ID=...)
export function useDownloadFiles(ID: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["download", ID],
    queryFn: async () => {
      const res = await apiFetch(
        `/download_files?ID=${encodeURIComponent(ID)}`
      );
      if (!res.ok) {
        let errorMessage = "Failed to download files";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.blob(); // ZIP file
    },
    enabled: !!ID && options?.enabled !== false,
  });
}

// 5. Get optimised structure (/optimised_structure/<ID>)
export function useOptimisedStructure(
  ID: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["optimised", ID],
    queryFn: async () => {
      const res = await apiFetch(
        `/optimised_structure/${encodeURIComponent(ID)}`
      );
      if (!res.ok) {
        let errorMessage = "Failed to fetch optimised structure";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.text(); // mmCIF
    },
    enabled: !!ID && options?.enabled !== false,
  });
}

// 6. Get original structure (/original_structure/<ID>)
export function useOriginalStructure(
  ID: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["original", ID],
    queryFn: async () => {
      const res = await apiFetch(
        `/original_structure/${encodeURIComponent(ID)}`
      );
      if (!res.ok) {
        let errorMessage = "Failed to fetch original structure";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.text(); // PDB
    },
    enabled: !!ID && options?.enabled !== false,
  });
}

// 7. Check if results are available (/api/available_results?ID=...)
export function useAvailableResults(ID: string) {
  return useQuery<{ available: boolean }>({
    queryKey: ["available", ID],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/available_results?ID=${encodeURIComponent(ID)}`
      );
      if (!res.ok) {
        let errorMessage = "Failed to check availability";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.json();
    },
    enabled: !!ID,
    retry: false,
  });
}

// 8. Get residues logs (/residues_logs/<ID>)
export function useResiduesLogs(ID: string) {
  return useQuery({
    queryKey: ["residues", ID],
    queryFn: async () => {
      const res = await apiFetch(`/residues_logs/${encodeURIComponent(ID)}`);
      if (!res.ok) {
        let errorMessage = "Failed to fetch residues logs";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await res.text();
    },
    enabled: !!ID,
  });
}
