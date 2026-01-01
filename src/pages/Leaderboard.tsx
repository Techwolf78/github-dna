import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Github,
  Star,
  GitFork,
  Users,
  Loader2,
  ShieldCheck,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDNAById } from '@/data/dnaTypes';

interface LeaderboardUser {
  username: string;
  avatar_url: string;
  dna_primary: string;
  dna_secondary: string;
  score: number;
  metrics: {
    repos: number;
    stars: number;
    followers: number;
  };
  analyzed_at: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [refreshCooldown, setRefreshCooldown] = useState<number>(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-leaderboard`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const cooldownPeriod = 30000; // 30 seconds cooldown

    if (timeSinceLastRefresh < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastRefresh) / 1000);
      setRefreshCooldown(remainingTime);
      return;
    }

    setLastRefreshTime(now);
    setLoading(true);
    await fetchLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/20 text-gray-700 border-gray-400/30';
    if (rank === 3) return 'bg-amber-600/20 text-amber-700 border-amber-600/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Validation Banner - Full Width Top Banner */}
      {showBanner && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200 dark:border-green-800 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-500 rounded-full"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 md:px-8 py-2 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm">
                        App-Verified Leaderboard
                      </h3>
                      {/* Mobile: Brief message */}
                      <div className="md:hidden">
                        <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 leading-tight">
                          Only analyzed users appear here.
                        </p>
                      </div>
                      {/* Desktop: Full message */}
                      <div className="hidden md:block">
                        <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 leading-tight">
                          Only GitHub users analyzed through this app appear here. Invalid usernames and zero-activity accounts are filtered out.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowBanner(false);
                }}
                className="ml-3 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full transition-colors flex-shrink-0 z-10 relative"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          {/* Mobile: Back button and Refresh button in one row */}
          <div className="flex items-center justify-between sm:hidden">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={loading || refreshCooldown > 0}
              size="sm"
              className={`gap-2 transition-all duration-200 ${
                refreshCooldown > 0
                  ? 'animate-pulse bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300'
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              {refreshCooldown > 0 ? (
                <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
              ) : loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {refreshCooldown > 0 ? `${refreshCooldown}s` : loading ? '...' : ''}
            </Button>
          </div>

          {/* Title and subtitle */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start gap-3 mb-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              GitHub DNA Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Top developers analyzed through this app, ranked by their GitHub impact and personality
            </p>
          </div>

          {/* Desktop: Back button and Refresh button */}
          <div className="hidden sm:flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={loading || refreshCooldown > 0}
              className={`gap-2 transition-all duration-200 ${
                refreshCooldown > 0
                  ? 'animate-pulse bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300'
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              {refreshCooldown > 0 ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-orange-600" />
              ) : loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Scoring Info */}
        <Card className="mb-6 bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">How Scores Are Calculated:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span>10 pts/repo</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>5 pts/star</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>20 pts/follower</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                <span>3 pts/fork</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Bonus points for activity, documentation, and DNA type multipliers
            </p>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              const primaryDNA = getDNAById(user.dna_primary);
              const secondaryDNA = getDNAById(user.dna_secondary);

              return (
                <Card key={user.username} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    {/* Mobile Layout - Stack vertically */}
                    <div className="block md:hidden">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                          {getRankIcon(rank)}
                        </div>

                        {/* Avatar */}
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                        />

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <a
                              href={`https://github.com/${user.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer"
                            >
                              @{user.username}
                            </a>
                            <Badge className={`${getRankBadgeColor(rank)} text-xs px-1 py-0`}>
                              #{rank}
                            </Badge>
                          </div>

                          {/* DNA Types - Primary only on mobile */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">DNA:</span>
                            {primaryDNA && (
                              <Badge variant="secondary" className="gap-1 text-xs px-1 py-0">
                                <span>{primaryDNA.icon}</span>
                                {primaryDNA.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-primary">
                            {user.score.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">pts</div>
                        </div>
                      </div>

                      {/* Metrics - Compact on mobile */}
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-2">
                        <div className="flex items-center gap-1">
                          <Github className="w-3 h-3" />
                          {user.metrics.repos}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {user.metrics.stars}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {user.metrics.followers}
                        </div>
                      </div>
                    </div>

                    {/* Desktop/Tablet Layout - Horizontal */}
                    <div className="hidden md:block">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-10 sm:w-12 flex-shrink-0">
                          {getRankIcon(rank)}
                        </div>

                        {/* Avatar */}
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-border flex-shrink-0"
                        />

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                            <a
                              href={`https://github.com/${user.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-base sm:text-lg truncate hover:text-primary transition-colors cursor-pointer"
                            >
                              @{user.username}
                            </a>
                            <Badge className={`${getRankBadgeColor(rank)} text-xs`}>
                              Rank #{rank}
                            </Badge>
                          </div>

                          {/* DNA Types */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-sm text-muted-foreground">DNA:</span>
                            {primaryDNA && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <span>{primaryDNA.icon}</span>
                                {primaryDNA.name}
                              </Badge>
                            )}
                            {secondaryDNA && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <span>{secondaryDNA.icon}</span>
                                {secondaryDNA.name}
                              </Badge>
                            )}
                          </div>

                          {/* Metrics */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Github className="w-4 h-4" />
                              {user.metrics.repos} repos
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {user.metrics.stars} stars
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {user.metrics.followers} followers
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-bold text-primary">
                            {user.score.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">points</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Analyses Yet</h3>
              <p className="text-muted-foreground">
                Be the first to get your GitHub DNA analyzed and claim the top spot!
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;