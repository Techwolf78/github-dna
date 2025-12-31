import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Github, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnalysisProgress from '@/components/AnalysisProgress';
import DNAReveal from '@/components/DNAReveal';
import { getDNAById, DNAType } from '@/data/dnaTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AnalysisState = 'input' | 'analyzing' | 'result';

const Analyze = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AnalysisState>('input');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ primary: DNAType; secondary: DNAType } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);
  const [analysisCooldown, setAnalysisCooldown] = useState<number>(0);
  const [analysisCount, setAnalysisCount] = useState<number>(0);

  // Cooldown timer effect
  useEffect(() => {
    if (analysisCooldown > 0) {
      const timer = setTimeout(() => {
        setAnalysisCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [analysisCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    if (!usernameRegex.test(username.trim())) {
      setError('Invalid GitHub username format');
      return;
    }

    // Additional validation for common spam attempts
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 2) {
      setError('Username must be at least 2 characters long');
      return;
    }

    // Block obvious spam/bot usernames
    const spamPatterns = [
      /^test/i,
      /^user/i,
      /^admin/i,
      /^bot/i,
      /^spam/i,
      /^fake/i,
      /^[0-9]+$/,
      /^.{40,}$/  // Too long
    ];

    if (spamPatterns.some(pattern => pattern.test(cleanUsername))) {
      setError('Invalid username. Please enter a real GitHub username.');
      return;
    }

    // Rate limiting checks
    const now = Date.now();
    const timeSinceLastAnalysis = now - lastAnalysisTime;

    // Progressive cooldown: 30s after 1st, 60s after 2nd, 120s after 3rd, etc.
    const baseCooldown = 30000; // 30 seconds
    const progressiveCooldown = baseCooldown * Math.pow(2, Math.max(0, analysisCount - 1));

    if (timeSinceLastAnalysis < progressiveCooldown) {
      const remainingTime = Math.ceil((progressiveCooldown - timeSinceLastAnalysis) / 1000);
      setAnalysisCooldown(remainingTime);
      setError(`Please wait ${remainingTime} seconds before analyzing another user.`);
      return;
    }

    // Daily limit: max 10 analyses per day per session
    const dailyLimit = 10;
    if (analysisCount >= dailyLimit) {
      setError('Daily analysis limit reached. Please try again tomorrow.');
      return;
    }

    setError('');
    setState('analyzing');
    setAnalyzing(true);
    setLastAnalysisTime(now);
    setAnalysisCount(prev => prev + 1);

    // Pre-validate GitHub user exists
    try {
      const response = await fetch(`https://api.github.com/users/${username.trim()}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('GitHub user not found. Please check the username and try again.');
        } else {
          setError('Unable to verify GitHub user. Please try again later.');
        }
        setState('input');
        setAnalyzing(false);
        return;
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setState('input');
      setAnalyzing(false);
      return;
    }
  };

  const handleAnalysisComplete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ username: username.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const primary = getDNAById(data.dna_primary);
      const secondary = getDNAById(data.dna_secondary);

      if (primary && secondary) {
        setResult({ primary, secondary });
        setState('result');
      } else {
        throw new Error('Invalid DNA result');
      }
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze profile';
      toast.error(message);
      setState('input');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setState('input');
    setUsername('');
    setResult(null);
  };

  if (state === 'analyzing') {
    return <AnalysisProgress onComplete={handleAnalysisComplete} />;
  }

  if (state === 'result' && result) {
    return (
      <DNAReveal
        username={username}
        primaryDNA={result.primary}
        secondaryDNA={result.secondary}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-dna-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-dna-cyan/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-dna mb-6">
            <Github className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Enter Your GitHub Username</h1>
          <p className="text-muted-foreground">
            We'll analyze your public repositories and commit patterns.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="github-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-12 h-14 text-lg bg-card border-border focus:border-primary"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full h-14 text-lg bg-gradient-dna text-primary-foreground hover:opacity-90 gap-2"
          >
            <span>Analyze DNA</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50">
          <h3 className="font-semibold mb-2 text-sm">What we analyze:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your public repositories</li>
            <li>• Commit frequency and patterns</li>
            <li>• Languages and technologies used</li>
            <li>• Contribution times and habits</li>
          </ul>
        </div>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          🔒 We only read public data. Nothing is stored or shared.
        </p>
      </div>
    </div>
  );
};

export default Analyze;