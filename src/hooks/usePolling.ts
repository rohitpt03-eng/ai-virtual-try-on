import { useState, useEffect, useRef } from 'react';

export function usePolling(
  callback: () => Promise<boolean>, 
  interval: number = 3000, 
  maxAttempts: number = 20
) {
  const [isPolling, setIsPolling] = useState(true);
  const attempts = useRef(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      if (!isPolling) return;
      
      attempts.current += 1;
      
      if (attempts.current > maxAttempts) {
        setIsPolling(false);
        return;
      }

      try {
        const shouldStop = await callback();
        if (shouldStop) {
          setIsPolling(false);
        } else {
          timeoutId = setTimeout(poll, interval);
        }
      } catch (error) {
        console.error("Polling error:", error);
        timeoutId = setTimeout(poll, interval);
      }
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [callback, interval, maxAttempts, isPolling]);

  return { isPolling, stopPolling: () => setIsPolling(false) };
}
