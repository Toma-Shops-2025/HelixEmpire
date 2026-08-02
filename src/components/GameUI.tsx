import { Zap, Trophy, RefreshCw, ChevronRight, Loader2, Sparkles } from 'lucide-react';
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
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none z-[5000]">

      {/* Header Info */}
      <div className="w-full flex justify-between items-start pt-8 animate-in fade-in slide-in-from-top duration-700">
        <div className="bg-black/60 backdrop-blur-xl border border-white/5 px-4 py-2.5 rounded-2xl shadow-2xl">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5">Level</p>
          <p className="text-xl font-black italic leading-none text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{level}</p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/5 px-4 py-2.5 rounded-2xl shadow-2xl text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5">Score</p>
          <p className="text-xl font-black italic leading-none text-white">{score.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Overlays */}
      <div className="flex-1 w-full flex items-center justify-center pointer-events-auto">

        {state === 'HOME' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-glow mb-8 animate-pulse border-4 border-blue-400/20">
                <Zap className="h-12 w-12 text-white fill-current" />
            </div>
            <button
                onClick={onStart}
                className="group relative px-10 py-4 bg-white text-black rounded-full font-black text-lg italic hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter shadow-2xl"
            >
                Start Run
                <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

        {state === 'REVIVE' && (
            <div className="w-full max-w-[280px] bg-black/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] text-center animate-in zoom-in duration-300 shadow-2xl">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <RefreshCw className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-3xl font-black italic uppercase mb-2">Crashed!</h2>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-8 leading-relaxed">Restore your status to continue the climb!</p>

                <button
                    onClick={onRevive}
                    disabled={isProcessing}
                    className="w-full bg-red-600 py-4 rounded-2xl font-black text-lg italic flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    REVIVE
                </button>
                <button onClick={() => window.location.reload()} className="mt-6 text-[8px] font-black uppercase opacity-20 hover:opacity-100 transition-opacity underline tracking-widest">End Session</button>
            </div>
        )}

        {state === 'WIN' && (
            <div className="w-full max-w-[280px] bg-black/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] text-center animate-in zoom-in duration-300 shadow-2xl">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/40 shadow-glow">
                    <Trophy className="h-10 w-10 text-blue-400" />
                </div>
                <h2 className="text-4xl font-black italic uppercase mb-1">Victory!</h2>
                <p className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest mb-8 italic">Ascension Complete</p>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-8">
                    <span className="text-[8px] font-black uppercase opacity-40 block mb-1">Points Earned</span>
                    <span className="text-3xl font-black italic text-white drop-shadow-glow">+{score}</span>
                </div>

                <button
                    onClick={onNext}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg italic flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                >
                    NEXT LEVEL <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        )}

        {state === 'PLAYING' && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in slide-in-from-top duration-1000">
                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-progress-fast" style={{ width: '60%' }} />
                </div>
                <span className="mt-2 text-[7px] font-black uppercase tracking-[0.4em] opacity-20">In Flight</span>
            </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="pb-24 opacity-20">
          {state === 'PLAYING' && <p className="text-[9px] font-black uppercase tracking-widest animate-pulse italic">Tap & Hold to Spin</p>}
      </div>
    </div>
  );
}
