import { useEffect, useState } from 'react';
import { Download, Linkedin, Twitter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DNACard from './DNACard';
import { DNAType } from '@/data/dnaTypes';

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

  useEffect(() => {
    const timer1 = setTimeout(() => setRevealed(true), 100);
    const timer2 = setTimeout(() => setShowCards(true), 1200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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
            <span className="text-6xl md:text-7xl lg:text-8xl mb-4 block">{primaryDNA.icon}</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-dna tracking-tight">
              {primaryDNA.name}
            </h2>
          </div>

          {/* Secondary Trait */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
            <span className="text-muted-foreground text-sm">Secondary trait:</span>
            <span className="font-semibold">{secondaryDNA.name}</span>
            <span>{secondaryDNA.icon}</span>
          </div>
        </div>

        {/* DNA Cards */}
        {showCards && (
          <div className="space-y-6 mb-12">
            <DNACard dna={primaryDNA} delay={0} />
            <DNACard dna={secondaryDNA} isSecondary delay={200} />
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
                  window.open(`${svgUrl}?username=${encodeURIComponent(username)}&primary=${primaryDNA.id}&secondary=${secondaryDNA.id}`, '_blank');
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