import { Zap, Trophy, Play, RefreshCw, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameUIProps {
    state: 'HOME' | 'PLAYING' | 'REVIVE' | 'WIN';
    score: number;
    level: number;
    onStart: () => void;
    onRevive: () => void;
    onNext: () => void;
    isProcessing: boolean;
}

export function GameUI({ state, score, level, onStart, onRevive, onNext, isProcessing }: GameUIProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-8 pointer-events-none z-[5000]">

      {/* Header Info */}
      <div className="w-full flex justify-between items-start pt-12 animate-in fade-in slide-in-from-top duration-700">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Level</p>
          <p className="text-2xl font-black italic leading-none text-blue-400">{level}</p>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Score</p>
          <p className="text-2xl font-black italic leading-none text-white">{score.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Overlays */}
      <div className="flex-1 w-full flex items-center justify-center pointer-events-auto">

        {state === 'HOME' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-glow mb-8 animate-pulse">
                <Zap className="h-16 w-16 text-white fill-current" />
            </div>
            <button
                onClick={onStart}
                className="group relative px-12 py-6 bg-white text-black rounded-full font-black text-2xl italic hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter"
            >
                Start Run
                <div className="absolute -inset-1 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

        {state === 'REVIVE' && (
            <div className="w-full max-w-sm bg-black/90 backdrop-blur-2xl border-2 border-red-500/20 p-10 rounded-[50px] text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/40">
                    <RefreshCw className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-4xl font-black italic uppercase mb-2">Crashed!</h2>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-8 leading-relaxed">The empire needs you. Restore your status now!</p>

                <button
                    onClick={onRevive}
                    disabled={isProcessing}
                    className="w-full bg-red-600 py-6 rounded-3xl font-black text-xl italic flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                    RECOVER STATUS
                </button>
                <button onClick={() => window.location.reload()} className="mt-6 text-[10px] font-black uppercase opacity-20 hover:opacity-100 transition-opacity underline tracking-widest">End Session</button>
            </div>
        )}

        {state === 'WIN' && (
            <div className="w-full max-w-sm bg-black/90 backdrop-blur-2xl border-2 border-blue-500/20 p-10 rounded-[50px] text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/40 shadow-glow">
                    <Trophy className="h-12 w-12 text-blue-400" />
                </div>
                <h2 className="text-5xl font-black italic uppercase mb-2">Victory!</h2>
                <p className="text-xs text-blue-400/60 font-bold uppercase tracking-widest mb-8">Ascension Complete</p>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
                    <span className="text-[10px] font-black uppercase opacity-40 block mb-1">JP Earned</span>
                    <span className="text-4xl font-black italic text-white">+{score}</span>
                </div>

                <button
                    onClick={onNext}
                    className="w-full bg-white text-black py-6 rounded-3xl font-black text-xl italic flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    NEXT LEVEL <ChevronRight className="h-6 w-6" />
                </button>
            </div>
        )}

        {state === 'PLAYING' && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in slide-in-from-top duration-1000">
                <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-glow animate-progress-fast" style={{ width: '60%' }} />
                </div>
                <span className="mt-2 text-[8px] font-black uppercase tracking-[0.4em] opacity-20">In Flight</span>
            </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="pb-24 opacity-20">
          {state === 'PLAYING' && <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Tap & Hold to Spin</p>}
      </div>
    </div>
  );
}
