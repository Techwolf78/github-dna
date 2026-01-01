import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DNAHelix from '@/components/DNAHelix';
import AnalyzeButton from '@/components/AnalyzeButton';
import VisitCounter from '@/components/VisitCounter';
import { Github, Trophy } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force dark mode for this app
    document.documentElement.classList.add('dark');
  }, []);

  const handleAnalyze = () => {
    navigate('/analyze');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      {/* Visit Counter */}
      <VisitCounter />

      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-dna-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dna-cyan/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-glow opacity-50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        {/* DNA Helix Animation */}
        <div 
          className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <DNAHelix />
        </div>

        {/* Title */}
        <h1 
          className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight transition-all duration-1000 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="text-foreground">Your code has a </span>
          <span className="text-gradient-dna">personality.</span>
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-lg md:text-xl text-muted-foreground mb-10 max-w-md transition-all duration-1000 delay-400 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Analyze your GitHub commits and discover your Developer DNA.
        </p>

        {/* CTA Button */}
        <div 
          className={`transition-all duration-1000 delay-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <AnalyzeButton onClick={handleAnalyze} />
        </div>

        {/* Leaderboard Link */}
        <div 
          className={`mt-6 transition-all duration-1000 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <Trophy className="w-4 h-4 group-hover:text-yellow-500 transition-colors" />
            <span className="border-b border-transparent group-hover:border-primary transition-colors">
              View Developer Leaderboard
            </span>
          </button>
        </div>

        {/* Social Proof / Trust */}
        <div 
          className={`mt-12 flex items-center gap-2 text-sm text-muted-foreground transition-all duration-1000 delay-800 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>Public repos only • No data stored</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 md:mt-8 mb-3 md:mb-8 text-center">
        <p className="text-xs text-muted-foreground/80">
          Built with 🧬 by{' '}
          <a
            href="https://ajay-pawar.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline hover:no-underline"
          >
            Ajay Pawar
          </a>{' '}
          • Not affiliated with GitHub
        </p>
      </footer>
    </div>
  );
};

export default Index;