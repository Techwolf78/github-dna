import { DNAType } from '@/data/dnaTypes';

interface DNACardProps {
  dna: DNAType;
  isSecondary?: boolean;
  delay?: number;
}

const DNACard = ({ dna, isSecondary = false, delay = 0 }: DNACardProps) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg opacity-0 animate-slide-up ${isSecondary ? 'max-w-md' : ''}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Glow background */}
      <div 
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${
          dna.color === 'dna-purple' ? 'bg-dna-purple' :
          dna.color === 'dna-cyan' ? 'bg-dna-cyan' :
          dna.color === 'dna-amber' ? 'bg-dna-amber' :
          dna.color === 'dna-pink' ? 'bg-dna-pink' :
          'bg-dna-blue'
        }`}
      />

      <div className="relative z-10">
        {isSecondary && (
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
            Secondary Trait
          </span>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{dna.icon}</span>
          <h3 className={`text-xl font-bold tracking-tight ${isSecondary ? 'text-foreground/80' : 'text-gradient-dna'}`}>
            {dna.name}
          </h3>
        </div>

        <p className="text-lg text-foreground/90 mb-6 font-medium">
          {dna.description}
        </p>

        {!isSecondary && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="text-xs font-mono uppercase tracking-widest text-primary mb-2">How You Work</h4>
              <p className="text-sm text-foreground/80">{dna.howYouWork}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="text-xs font-mono uppercase tracking-widest text-accent mb-2">Your Strength</h4>
              <p className="text-sm text-foreground/80">{dna.strength}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="text-xs font-mono uppercase tracking-widest text-dna-amber mb-2">Blind Spot</h4>
              <p className="text-sm text-foreground/80">{dna.blindSpot}</p>
            </div>

            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <h4 className="text-xs font-mono uppercase tracking-widest text-destructive mb-2">Painful Truth</h4>
              <p className="text-sm text-foreground/80 italic">&ldquo;{dna.painfulTruth}&rdquo;</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DNACard;