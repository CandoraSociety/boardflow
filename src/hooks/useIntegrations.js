import { useEffect } from 'react';

export function useIntegrations() {
  useEffect(() => {
    const fetchAndApply = async () => {
      try {
        const res = await fetch('https://beacon-nexus-core.base44.app/functions/getIntegrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: 'board' }),
        });
        const data = await res.json();
        // integrations received — can be extended to apply them
        console.log('Integrations received from Beacon:', data);
      } catch (e) {
        // Silently fail if Beacon is unreachable
      }
    };

    fetchAndApply();
    const interval = setInterval(fetchAndApply, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, []);
}