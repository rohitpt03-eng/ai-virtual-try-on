import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export function useTryOn() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (data: any) => {
    setStatus('processing');
    setError(null);
    try {
      const { sessionId } = await apiClient.startTryOn(data);
      return sessionId;
    } catch (err) {
      setStatus('failed');
      setError('Failed to start try-on');
      throw err;
    }
  }, []);

  return { start, status, result, error };
}
