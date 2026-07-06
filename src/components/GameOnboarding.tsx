import { useState, useEffect } from 'react';
import { Zap, Trophy, Coins, Smartphone, ChevronRight, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = "helix:onboarded";

const slides = [
  {
    icon: Smartphone,
    title: "Master the Tower",
    body: "Swipe to rotate the helix. Time your falls to drop through multiple levels for bonus points!",
    color: "bg-primary",
  },
  {
    icon: Trophy,
    title: "Earn JumpPoints",
    body: "Collect JP for every bounce. Reach the Green Floor to level up and see the tower's geometry evolve!",
    color: "bg-green-500",
  },
  {
    icon: Coins,
    title: "Empire Rewards",
    body: "Every 5 levels, you trigger an EMPIRE BONUS. Earn real ViralCoins shared with ViralSnap and AlgoRhythm!",
    color: "bg-yellow-400",
  },
  {
    icon: Zap,
    title: "Watch & Revive",
    body: "Hit a Red Hazard? Don't lose your streak! Watch a quick ad to revive instantly and keep your score climbing.",
    color: "bg-blue-600",
  },
];

export function GameOnboarding({ onComplete }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    if (onComplete) onComplete();
  };

  if (!open) return null;

  const slide = slides[step];
  const Icon = slide.icon;
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 pointer-events-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center">

        {/* Animated Icon Circle */}
        <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mb-8 border-4 border-white/20 shadow-2xl transition-all duration-500",
            slide.color
        )}>
          <Icon className="h-10 w-10 text-white animate-pulse" />
        </div>

        {/* Text Content */}
        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-4 leading-none">{slide.title}</h2>
        <p className="text-white/60 font-bold uppercase tracking-widest text-[11px] leading-relaxed mb-12">
            {slide.body}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-12">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 transition-all duration-300 rounded-full",
                i === step ? "w-8 bg-primary" : "w-1.5 bg-white/20"
              )}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
          className="w-full h-20 bg-white text-black rounded-3xl font-black uppercase tracking-widest shadow-white/10 shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {isLast ? "START SMASHING" : "NEXT STEP"}
          {isLast ? <Play className="h-5 w-5 fill-current" /> : <ChevronRight className="h-6 w-6" />}
        </button>

        <button onClick={finish} className="mt-6 text-white/30 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
            Skip Introduction
        </button>
      </div>
    </div>
  );
}
