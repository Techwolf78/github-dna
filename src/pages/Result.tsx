import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DNAReveal from '@/components/DNAReveal';
import { getDNAById } from '@/data/dnaTypes';
import { supabase } from '@/integrations/supabase/client';

interface UserResult {
  username: string;
  avatarUrl: string;
  primary: string;
  secondary: string;
  analyzedAt: string;
}

const Result = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UserResult | null>(null);

  useEffect(() => {
    if (!username) {
      setError('No username provided');
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-user-result', {
          body: null,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Manual fetch since invoke doesn't support query params well
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-result?username=${encodeURIComponent(username)}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
            }
          }
        );

        const responseData = await response.json();

        if (!response.ok || !responseData.exists) {
          setError('This user has not been analyzed yet');
          setLoading(false);
          return;
        }

        setResult(responseData);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading DNA result...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Result Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This user has not been analyzed yet.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back Home
            </Button>
            <Button 
              onClick={() => navigate('/analyze')}
              className="bg-gradient-dna text-primary-foreground"
            >
              Analyze Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const primaryDNA = getDNAById(result.primary);
  const secondaryDNA = getDNAById(result.secondary);

  if (!primaryDNA || !secondaryDNA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Invalid DNA type in result</p>
      </div>
    );
  }

  return (
    <DNAReveal
      username={result.username}
      primaryDNA={primaryDNA}
      secondaryDNA={secondaryDNA}
      onReset={() => navigate('/analyze')}
    />
  );
};

export default Result;
