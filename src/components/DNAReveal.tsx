import React, { useCallback, useEffect, useState } from 'react';
import { Download, Linkedin, Twitter, RotateCcw, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DNACard from './DNACard';
import { DNAType } from '@/data/dnaTypes';
import { supabase } from '@/integrations/supabase/client';

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

interface DNARevealProps {
  username: string;
  primaryDNA: DNAType;
  secondaryDNA: DNAType;
  onReset: () => void;
  isShareable?: boolean;
}

const DNAReveal = ({ username, primaryDNA, secondaryDNA, onReset }: DNARevealProps) => {
  const [revealed, setRevealed] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-leaderboard');
      if (error) throw error;
      
      setLeaderboard(data.leaderboard || []);
      
      // Find user's rank
      const userIndex = data.leaderboard?.findIndex((user: LeaderboardUser) => 
        user.username.toLowerCase() === username.toLowerCase()
      );
      setUserRank(userIndex !== -1 ? userIndex + 1 : null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [username]);

  useEffect(() => {
    const timer1 = setTimeout(() => setRevealed(true), 100);
    const timer2 = setTimeout(() => setShowCards(true), 1200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (showCards) {
      fetchLeaderboard();
    }
  }, [showCards, fetchLeaderboard]);

  const shareText = `Just discovered my GitHub DNA: ${primaryDNA.name} ${primaryDNA.icon}\n\n"${primaryDNA.description}"\n\nFind yours at`;

  const handleShare = (platform: 'twitter' | 'linkedin') => {
    const url = window.location.origin;
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
            @{username}
          </p>
          <h1 className="text-lg font-mono uppercase tracking-widest text-primary mb-6">
            🧬 Your GitHub DNA
          </h1>
          
          {/* Big DNA Type */}
          <div className="mb-6">
            <div className="mb-4 flex justify-center">
              {React.cloneElement(primaryDNA.icon, { 
                className: "w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" 
              })}
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient-dna tracking-tight">
              {primaryDNA.name}
            </h2>
          </div>

          {/* Secondary Trait */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
            <span className="text-muted-foreground text-sm">Secondary trait:</span>
            <span className="font-semibold">{secondaryDNA.name}</span>
            {React.cloneElement(secondaryDNA.icon, { 
              className: "w-4 h-4" 
            })}
          </div>
        </div>

        {/* DNA Cards */}
        {showCards && (
          <div className="space-y-6 mb-12">
            <DNACard dna={primaryDNA} delay={0} />
            <DNACard dna={secondaryDNA} isSecondary delay={200} />
          </div>
        )}

        {/* Viral Content & Leaderboard */}
        {showCards && (
          <div 
            className="mb-12 opacity-0 animate-slide-up"
            style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
          >
            {/* Viral Hook */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-4">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-500">🔥 Trending</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                See Where You Rank Among <span className="text-gradient-dna">GitHub's Elite</span>
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Join thousands of developers who've discovered their GitHub DNA. 
                How does your coding personality stack up?
              </p>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold">Global Leaderboard</h4>
                </div>
                {userRank && (
                  <div className="text-sm text-muted-foreground">
                    Your Rank: <span className="font-bold text-primary">#{userRank}</span>
                  </div>
                )}
              </div>

              {loadingLeaderboard ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading rankings...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((user, index) => (
                    <div 
                      key={user.username}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        user.username.toLowerCase() === username.toLowerCase() 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <img 
                          src={user.avatar_url} 
                          alt={user.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-sm">@{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.dna_primary}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{Math.round(user.score)}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.metrics.followers} followers
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {leaderboard.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        +{leaderboard.length - 5} more developers...
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Rankings update in real-time based on GitHub activity and community engagement
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Share Section */}
        {showCards && (
          <div 
            className="bg-card border border-border rounded-2xl p-6 opacity-0 animate-slide-up"
            style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
          >
            <h3 className="text-lg font-semibold mb-4 text-center">Share Your DNA</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                className="gap-2"
              >
                <Twitter className="w-4 h-4" />
                Share on X
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="gap-2"
              >
                <Linkedin className="w-4 h-4" />
                Share on LinkedIn
              </Button>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => {
                  const svgUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-share-card`;
                  const params = new URLSearchParams({
                    username: username,
                    primary: primaryDNA.id,
                    secondary: secondaryDNA.id,
                    url: window.location.origin
                  });
                  window.open(`${svgUrl}?${params.toString()}`, '_blank');
                }}
              >
                <Download className="w-4 h-4" />
                Download Card
              </Button>
            </div>
          </div>
        )}

        {/* Try Again */}
        {showCards && (
          <div 
            className="flex justify-center mt-8 opacity-0 animate-slide-up"
            style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
          >
            <Button
              onClick={onReset}
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              Analyze Another Profile
            </Button>
          </div>
        )}

        {/* Footer */}
        {showCards && (
          <footer 
            className="text-center mt-16 opacity-0 animate-slide-up"
            style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
          >
            <p className="text-xs text-muted-foreground">
              We read your public GitHub activity. Nothing is posted or modified.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default DNAReveal;