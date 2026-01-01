import { 
  Building, 
  Wrench, 
  Zap, 
  Moon, 
  FlaskConical, 
  User, 
  Rocket 
} from 'lucide-react';
import { ReactElement } from 'react';

export interface DNAType {
  id: string;
  name: string;
  icon: ReactElement;
  description: string;
  howYouWork: string;
  strength: string;
  blindSpot: string;
  painfulTruth: string;
  color: string;
}

export const dnaTypes: DNAType[] = [
  {
    id: 'architect',
    name: 'THE ARCHITECT',
    icon: <Building className="w-6 h-6" />,
    description: 'You build systems meant to last decades.',
    howYouWork: 'You think in abstractions before touching the keyboard. Every PR is a carefully considered piece of a larger puzzle.',
    strength: 'Your code survives organizational changes, team turnovers, and the test of time.',
    blindSpot: 'You sometimes over-engineer solutions for problems that may never exist.',
    painfulTruth: 'Perfect systems don\'t ship. Sometimes good enough today beats perfect never.',
    color: 'dna-purple'
  },
  {
    id: 'fixer',
    name: 'THE FIXER',
    icon: <Wrench className="w-6 h-6" />,
    description: 'You do the work nobody celebrates — but everyone depends on.',
    howYouWork: 'Small commits, fast iterations. You see entropy and fight it relentlessly.',
    strength: 'Systems stay healthy because of you. You prevent fires before they start.',
    blindSpot: 'Your work is invisible. You rarely get credit for disasters that never happened.',
    painfulTruth: 'The world runs on fixers, but promotes builders. Learn to make your impact visible.',
    color: 'dna-cyan'
  },
  {
    id: 'sprinter',
    name: 'THE SPRINTER',
    icon: <Zap className="w-6 h-6" />,
    description: 'You move fast. Deadlines don\'t scare you.',
    howYouWork: 'Bursts of intense productivity followed by recovery. Your commit graph looks like an EKG.',
    strength: 'When pressure hits, you deliver. Crunch time is your time.',
    blindSpot: 'Sustainable pace isn\'t your thing. You run hot until you can\'t.',
    painfulTruth: 'Your greatest strength is also burning you out. Pace yourself or the code will stop flowing.',
    color: 'dna-amber'
  },
  {
    id: 'nightowl',
    name: 'THE NIGHT OWL',
    icon: <Moon className="w-6 h-6" />,
    description: 'Your best work happens when the world sleeps.',
    howYouWork: 'Silence and solitude fuel your flow state. 2 AM commits are your signature.',
    strength: 'Deep focus. No meetings, no distractions, just pure creation.',
    blindSpot: 'Your schedule doesn\'t sync with the team. Async becomes your only option.',
    painfulTruth: 'The night is peaceful, but the cost is paid in daylight connections.',
    color: 'dna-blue'
  },
  {
    id: 'experimenter',
    name: 'THE EXPERIMENTER',
    icon: <FlaskConical className="w-6 h-6" />,
    description: 'You\'ve started more projects than most people will in a lifetime.',
    howYouWork: 'New repo, new language, new framework. The thrill is in the beginning.',
    strength: 'You\'re never stuck on old paradigms. Innovation flows naturally.',
    blindSpot: 'Finishing is harder than starting. Your graveyard of side projects grows.',
    painfulTruth: 'Starting is easy. Shipping is character. Pick one and see it through.',
    color: 'dna-pink'
  },
  {
    id: 'lonewolf',
    name: 'THE LONE WOLF',
    icon: <User className="w-6 h-6" />,
    description: 'Your best work is done solo.',
    howYouWork: 'No dependencies, no blockers, no waiting. You own the entire stack.',
    strength: 'Pure ownership. No coordination overhead. Ship velocity.',
    blindSpot: 'Collaboration atrophies. Code review becomes a formality.',
    painfulTruth: 'Great products need teams. Your ceiling is your bandwidth.',
    color: 'dna-purple'
  },
  {
    id: 'builder',
    name: 'THE BUILDER',
    icon: <Rocket className="w-6 h-6" />,
    description: 'You\'re balanced. Rare. Dangerous.',
    howYouWork: 'Consistent commits, maintained repos, shipping regularly. No extremes.',
    strength: 'You can play any role. Architect when needed, fixer when required.',
    blindSpot: 'Being balanced means you might never be exceptional at one thing.',
    painfulTruth: 'Jack of all trades is powerful until the specialists arrive.',
    color: 'dna-cyan'
  }
];

export const getDNAById = (id: string): DNAType | undefined => {
  return dnaTypes.find(dna => dna.id === id);
};

export const getRandomDNA = (): { primary: DNAType; secondary: DNAType } => {
  const shuffled = [...dnaTypes].sort(() => Math.random() - 0.5);
  return {
    primary: shuffled[0],
    secondary: shuffled[1]
  };
};