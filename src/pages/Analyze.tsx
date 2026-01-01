import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Github, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnalysisProgress from '@/components/AnalysisProgress';
import DNAReveal from '@/components/DNAReveal';
import { getDNAById, DNAType } from '@/data/dnaTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SimpleCaptcha } from '@/components/Captcha';
import { logError, logUserAction, monitorApiCall } from '@/lib/monitoring';

type AnalysisState = 'input' | 'analyzing' | 'result' | 'past-analysis';

const Analyze = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const [state, setState] = useState<AnalysisState>('input');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ primary: DNAType; secondary: DNAType } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);
  const [analysisCooldown, setAnalysisCooldown] = useState<number>(0);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [cachedResult, setCachedResult] = useState<{ primary: DNAType; secondary: DNAType } | null>(null);
  const [showRateLimitBanner, setShowRateLimitBanner] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Array<{username: string, primary: DNAType, secondary: DNAType}>>([]);

  // Load recent analyses on mount
  useEffect(() => {
    const loadRecentAnalyses = () => {
      try {
        const recent: Array<{username: string, primary: DNAType, secondary: DNAType}> = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('github-dna-')) {
            const username = key.replace('github-dna-', '');
            const cached = localStorage.getItem(key);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                recent.push({
                  username,
                  primary: getDNAById(parsed.primary),
                  secondary: getDNAById(parsed.secondary)
                });
              }
            }
          }
        }
        setRecentAnalyses(recent);
      } catch (error) {
        console.error('Error loading recent analyses:', error);
      }
    };

    loadRecentAnalyses();
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (!showRateLimitBanner || !rateLimitResetTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = rateLimitResetTime - now;
      
      if (remaining <= 0) {
        setTimeRemaining('');
        setShowRateLimitBanner(false);
        setRateLimitResetTime(null);
        return;
      }

      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [showRateLimitBanner, rateLimitResetTime]);
  const getCachedAnalysis = (username: string): { primary: DNAType; secondary: DNAType } | null => {
    try {
      const cacheKey = `github-dna-${username.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return {
            primary: getDNAById(parsed.primary),
            secondary: getDNAById(parsed.secondary)
          };
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  };

  const setCachedAnalysis = (username: string, primary: DNAType, secondary: DNAType) => {
    try {
      const cacheKey = `github-dna-${username.toLowerCase()}`;
      const data = {
        primary: primary.id,
        secondary: secondary.id,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      // Refresh recent analyses list
      const loadRecentAnalyses = () => {
        try {
          const recent: Array<{username: string, primary: DNAType, secondary: DNAType}> = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('github-dna-')) {
              const uname = key.replace('github-dna-', '');
              const cached = localStorage.getItem(key);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                  recent.push({
                    username: uname,
                    primary: getDNAById(parsed.primary),
                    secondary: getDNAById(parsed.secondary)
                  });
                }
              }
            }
          }
          setRecentAnalyses(recent);
        } catch (error) {
          console.error('Error loading recent analyses:', error);
        }
      };
      loadRecentAnalyses();
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Cooldown timer effect
  useEffect(() => {
    if (analysisCooldown > 0) {
      const timer = setTimeout(() => {
        setAnalysisCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [analysisCooldown]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logUserAction('analysis_attempt', { username: username.trim() }, user?.id);

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

    // Check for cached results first
    const cached = getCachedAnalysis(username.trim());
    if (cached) {
      setCachedResult(cached);
      setState('past-analysis');
      return;
    }

    // CAPTCHA verification
    if (!captchaVerified) {
      setError('Please complete the CAPTCHA verification.');
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
      const startTime = Date.now();
      logUserAction('analysis_started', { username: username.trim() }, user?.id);

      const response = await monitorApiCall(
        'github-user-check',
        () => fetch(`https://api.github.com/users/${username.trim()}`),
        { username: username.trim() },
        user?.id
      );

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
      const startTime = Date.now();
      
      // Get the current session directly from Supabase
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to get session:', sessionError);
        throw new Error('Authentication session expired. Please sign in again.');
      }
      
      if (!currentSession) {
        throw new Error('No authentication session found. Please sign in again.');
      }
      
      const response = await monitorApiCall(
        'analyze-github',
        () => {
          const headers = {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${currentSession.access_token}`
          };
          console.log('🚀 Making API call with headers:', {
            hasAuth: !!headers.Authorization,
            authLength: headers.Authorization?.length,
            apikey: headers.apikey?.substring(0, 10) + '...'
          });
          
          return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-github`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ username: username.trim() })
          });
        },
        { username: username.trim() },
        user?.id
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const primary = getDNAById(data.dna_primary);
      const secondary = getDNAById(data.dna_secondary);

      if (primary && secondary) {
        const analysisResult = { primary, secondary };
        setResult(analysisResult);
        // Cache the result in localStorage
        setCachedAnalysis(username.trim(), primary, secondary);
        setState('result');
      } else {
        throw new Error('Invalid DNA result');
      }
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze profile';
      
      // Check for rate limit errors and show banner with timer
      if (message.includes('rate limit') || message.includes('overloaded')) {
        // Parse rate limit reset time if available
        let resetTime: number | null = null;
        if (message.startsWith('RATE_LIMIT:')) {
          const parts = message.split(':');
          if (parts.length >= 2) {
            resetTime = parseInt(parts[1]);
          }
        }
        setRateLimitResetTime(resetTime);
        setShowRateLimitBanner(true);
        setState('input');
        return;
      }
      
      logError(err instanceof Error ? err : new Error(message), {
        context: 'analysis',
        username: username.trim(),
        userId: user?.id
      }, user?.id);
      toast.error(message);
      setState('input');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewRecentAnalysis = (analysis: {username: string, primary: DNAType, secondary: DNAType}) => {
    setUsername(analysis.username);
    setCachedResult(analysis);
    setState('past-analysis');
  };

  const handleViewPastAnalysis = () => {
    if (cachedResult) {
      setResult(cachedResult);
      setState('result');
    }
  };

  const handleAnalyzeAnyway = () => {
    setCachedResult(null);
    setState('input');
    // Clear CAPTCHA for re-analysis
    setCaptchaVerified(false);
    setCaptchaError('');
  };

  const handleReset = () => {
    setState('input');
    setUsername('');
    setResult(null);
    setCachedResult(null);
    setCaptchaVerified(false);
    setCaptchaError('');
  };

  if (state === 'analyzing') {
    return <AnalysisProgress onComplete={handleAnalysisComplete} />;
  }

  if (state === 'past-analysis' && cachedResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-dna-purple/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-dna-cyan/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md text-center">
          <Button
            variant="ghost"
            onClick={() => setState('input')}
            className="mb-8 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-dna mb-6">
            <Github className="w-8 h-8 text-primary-foreground" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Past Analysis Found</h1>
          <p className="text-muted-foreground mb-8">
            We found a previous analysis for <strong>@{username}</strong> in your browser cache.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{cachedResult.primary.icon}</span>
                <span className="font-semibold">{cachedResult.primary.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{cachedResult.primary.description}</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleViewPastAnalysis}
                className="flex-1 bg-gradient-dna text-primary-foreground hover:opacity-90"
              >
                View Past Analysis
              </Button>
              <Button
                onClick={handleAnalyzeAnyway}
                variant="outline"
                className="flex-1"
              >
                Analyze Again
              </Button>
            </div>
          </div>

          <p className="text-center mt-6 text-xs text-muted-foreground">
            💾 Results are cached locally for 24 hours
          </p>
        </div>
      </div>
    );
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

        {showRateLimitBanner && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg relative">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Server Overloaded
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Server is currently overloaded due to high traffic. GitHub API rate limit exceeded.</p>
                    {timeRemaining && (
                      <p className="mt-1 font-mono text-yellow-800 font-semibold">
                        Try again in: {timeRemaining}
                      </p>
                    )}
                    {!timeRemaining && (
                      <p className="mt-1">Please wait a few minutes and try again.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                    onClick={() => setShowRateLimitBanner(false)}
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* CAPTCHA Verification */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Security Verification</label>
            <SimpleCaptcha
              onVerify={(token) => {
                setCaptchaVerified(true);
                setCaptchaError('');
              }}
              onError={(error) => {
                setCaptchaError(error);
                setCaptchaVerified(false);
              }}
            />
            {captchaError && <p className="text-destructive text-xs leading-tight">{captchaError}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg bg-gradient-dna text-primary-foreground hover:opacity-90 gap-2"
            disabled={!captchaVerified}
          >
            <span>Analyze DNA</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        {recentAnalyses.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Analyses
            </h3>
            <div className="space-y-2">
              {recentAnalyses.slice(0, 3).map((analysis, index) => (
                <button
                  key={index}
                  onClick={() => handleViewRecentAnalysis(analysis)}
                  className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">@{analysis.username}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="capitalize">{analysis.primary.name}</span>
                      <span>+</span>
                      <span className="capitalize">{analysis.secondary.name}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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