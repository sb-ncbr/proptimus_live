import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/utils';

export interface OptimizationProgress {
  status: 'running' | 'finished' | 'error';
  progress: number; // 0-100
  message?: string;
  error?: string;
}

export function useOptimizationProgress(jobId: string) {
  return useQuery({
    queryKey: ['optimization-progress', jobId],
    queryFn: async (): Promise<OptimizationProgress> => {
      const res = await apiFetch(`/api/running_progress?ID=${encodeURIComponent(jobId)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch optimization progress');
      }
      const data = await res.json();
      
      // Transform the response to our expected format
      return {
        status: data.status === 'finished' ? 'finished' : 
                data.status === 'queued' || data.status === 'unsubmitted' ? 'running' : 'running',
        progress: data.percent_value !== undefined ? data.percent_value : 0,
        message: data.percent_text || data.message,
        error: data.error
      };
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Stop polling when finished or error
      if (query.state.data?.status === 'finished' || query.state.data?.status === 'error') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: true,
  });
}
