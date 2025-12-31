import { useState } from 'react';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyzeButtonProps {
  onClick: () => void;
}

const AnalyzeButton = ({ onClick }: AnalyzeButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative px-8 py-6 text-lg font-semibold bg-gradient-dna text-primary-foreground border-0 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg glow-purple"
    >
      <span className="relative z-10 flex items-center gap-3">
        <Github className="w-5 h-5" />
        <span>Analyze my GitHub</span>
        <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
      </span>
      
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
      />
    </Button>
  );
};

export default AnalyzeButton;