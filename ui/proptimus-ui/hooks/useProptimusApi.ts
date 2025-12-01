import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/utils';

// 1. Submit a job (POST /)
export function useSubmitJob() {
    return useMutation({
        mutationFn: async ({ code, ph }: { file: File | null; code: string; ph: string }) => {
            const res = await apiFetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ code, ph }).toString(),
            });
            if (!res.ok) throw new Error('Failed to submit job');
            if (res.ok) { }
            return await res.text(); // may be HTML redirect
        },
    });
}

// 2. Get results (/results?ID=...)
export function useResults(ID: string) {
    return useQuery({
        queryKey: ['results', ID],
        queryFn: async () => {
            const res = await apiFetch(`/results?ID=${encodeURIComponent(ID)}`);
            if (!res.ok) throw new Error('Failed to fetch results');
            return await res.text(); // may be HTML
        },
        enabled: !!ID,
    });
}

export function useResultsStats() {
    return useQuery({
        queryKey: ['results'],
        queryFn: async () => {
            const res = await apiFetch(`/results`);
            if (!res.ok) throw new Error('Failed to fetch results');
            return await res.text(); // may be HTML
        },
    });
}

// 3. Get running progress (/api/running_progress?ID=...)
export function useRunningProgress(ID: string) {
    return useQuery({
        queryKey: ['progress', ID],
        queryFn: async () => {
            const res = await apiFetch(`/api/running_progress?ID=${encodeURIComponent(ID)}`);
            if (!res.ok) throw new Error('Failed to fetch progress');
            return await res.json();
        },
        enabled: !!ID,
        refetchInterval: 2000, // poll every 2s
    });
}

// 4. Download files (/download_files?ID=...)
export function useDownloadFiles(ID: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['download', ID],
        queryFn: async () => {
            const res = await apiFetch(`/download_files?ID=${encodeURIComponent(ID)}`);
            if (!res.ok) throw new Error('Failed to download files');
            return await res.blob(); // ZIP file
        },
        enabled: !!ID && (options?.enabled !== false),
    });
}

// 5. Get optimised structure (/optimised_structure/<ID>)
export function useOptimisedStructure(ID: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['optimised', ID],
        queryFn: async () => {
            const res = await apiFetch(`/optimised_structure/${encodeURIComponent(ID)}`);
            if (!res.ok) throw new Error('Failed to fetch optimised structure');
            return await res.text(); // mmCIF
        },
        enabled: !!ID && (options?.enabled !== false),
    });
}

// 6. Get original structure (/original_structure/<ID>)
export function useOriginalStructure(ID: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['original', ID],
        queryFn: async () => {
            const res = await apiFetch(`/original_structure/${encodeURIComponent(ID)}`);
            if (!res.ok) throw new Error('Failed to fetch original structure');
            return await res.text(); // PDB
        },
        enabled: !!ID && (options?.enabled !== false),
    });
}

// 7. Get residues logs (/residues_logs/<ID>)
export function useResiduesLogs(ID: string) {
    return useQuery({
        queryKey: ['residues', ID],
        queryFn: async () => {
            const res = await apiFetch(`/residues_logs/${encodeURIComponent(ID)}`);
            if (!res.ok) throw new Error('Failed to fetch residues logs');
            return await res.text();
        },
        enabled: !!ID,
    });
}