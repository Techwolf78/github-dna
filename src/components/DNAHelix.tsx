import { useEffect, useState } from 'react';

const DNAHelix = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const strandPairs = 12;
  const colors = ['bg-dna-purple', 'bg-dna-cyan', 'bg-dna-pink', 'bg-dna-amber'];

  return (
    <div className="relative w-48 h-80 perspective-1000" style={{ perspective: '1000px' }}>
      <div 
        className={`relative w-full h-full transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{ transformStyle: 'preserve-3d', animation: 'dna-spin 12s linear infinite' }}
      >
        {Array.from({ length: strandPairs }).map((_, i) => {
          const yPos = (i / strandPairs) * 100;
          const rotation = (i / strandPairs) * 360;
          const delay = i * 0.1;
          const color1 = colors[i % colors.length];
          const color2 = colors[(i + 2) % colors.length];

          return (
            <div
              key={i}
              className="absolute left-0 right-0 flex items-center justify-between px-2"
              style={{
                top: `${yPos}%`,
                transform: `rotateY(${rotation}deg) translateZ(30px)`,
                transformStyle: 'preserve-3d',
                animationDelay: `${delay}s`
              }}
            >
              {/* Left strand node */}
              <div 
                className={`w-4 h-4 rounded-full ${color1} animate-glow-pulse shadow-lg`}
                style={{ 
                  boxShadow: `0 0 20px hsl(var(--dna-purple) / 0.6)`,
                  animationDelay: `${delay}s`
                }}
              />
              
              {/* Connecting bar */}
              <div 
                className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-dna-purple via-dna-cyan to-dna-purple opacity-40"
              />
              
              {/* Right strand node */}
              <div 
                className={`w-4 h-4 rounded-full ${color2} animate-glow-pulse shadow-lg`}
                style={{ 
                  boxShadow: `0 0 20px hsl(var(--dna-cyan) / 0.6)`,
                  animationDelay: `${delay + 0.5}s`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Glow effect */}
      <div 
        className="absolute inset-0 bg-gradient-glow opacity-60 blur-xl pointer-events-none"
        style={{ transform: 'scale(1.5)' }}
      />

      <style>{`
        @keyframes dna-spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DNAHelix;