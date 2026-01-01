import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { supabase } from '@/integrations/supabase/client';
import { Eye } from 'lucide-react';

const VisitCounter = () => {
  const [visitCount, setVisitCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Call the edge function to track visit and get count
        const { data, error } = await supabase.functions.invoke('track-visit', {
          body: {
            path: '/',
            userAgent: navigator.userAgent,
            referrer: document.referrer || null,
          },
        });

        if (error) {
          console.error('Error tracking visit:', error);
          // Fallback: try to get count directly
          const { count } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('path', '/');
          setVisitCount(count || 0);
        } else {
          // Parse the response if it's a string
          let parsedData = data;
          if (typeof data === 'string') {
            try {
              parsedData = JSON.parse(data);
            } catch (parseError) {
              console.error('Failed to parse response:', parseError);
              parsedData = { visitCount: 0 };
            }
          }
          setVisitCount(parsedData.visitCount || 0);
        }

        // Store in localStorage for authenticity
        localStorage.setItem('visitCount', visitCount.toString());

        // Start animation
        setIsAnimating(true);
      } catch (error) {
        console.error('Error tracking visit:', error);
        // Fallback to direct count
        try {
          const { count } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('path', '/');
          setVisitCount(count || 0);
          setIsAnimating(true);
        } catch (fallbackError) {
          console.error('Fallback failed:', fallbackError);
        }
      }
    };

    trackVisit();
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <Eye className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {isAnimating ? (
          <CountUp
            end={visitCount}
            duration={2}
            separator=","
            suffix="+"
          />
        ) : (
          `${visitCount.toLocaleString()}+`
        )}
        {' '}visits
      </span>
    </div>
  );
};

export default VisitCounter;