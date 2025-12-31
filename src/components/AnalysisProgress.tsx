import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface AnalysisProgressProps {
  onComplete: () => void;
}

const steps = [
  'Collecting repositories',
  'Mapping commit behavior',
  'Measuring work patterns',
  'Sequencing DNA'
];

const AnalysisProgress = ({ onComplete }: AnalysisProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep >= steps.length) {
      setTimeout(onComplete, 500);
      return;
    }

    const timer = setTimeout(() => {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }, 800 + Math.random() * 600);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-md w-full">
        {/* DNA Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-dna animate-spin-slow flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                <span className="text-2xl">🧬</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-dna blur-xl opacity-30 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
          Analyzing Your DNA
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Reading your code personality...
        </p>

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

            return (
              <div
                key={step}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-primary/10 border border-primary/20' 
                    : isCurrent 
                      ? 'bg-muted/50 border border-muted' 
                      : 'bg-transparent border border-transparent opacity-40'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-primary text-primary-foreground' 
                    : isCurrent 
                      ? 'bg-muted' 
                      : 'bg-muted/50'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <span className={`font-medium transition-colors duration-300 ${
                  isCompleted ? 'text-foreground' : isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;