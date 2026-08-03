import { Zap, Trophy, RefreshCw, ChevronRight, Loader2, Sparkles, Award } from 'lucide-react';
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

function AppBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black/20">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
    </div>
  )
}

export function GameUI({ state, score, level, onStart, onRevive, onNext, isProcessing }: GameUIProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none z-[5000]">
      <AppBackground />

      {/* Top Bar - Wallet & Progress */}
      <div className="w-full flex justify-between items-start pt-8 animate-in fade-in slide-in-from-top duration-700 relative z-10">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-white/40 leading-none">Wallet</span>
            <span className="text-sm font-black italic text-white leading-none tracking-tighter">0 VC</span>
          </div>
        </div>

        <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="flex flex-col text-right">
            <span className="text-[7px] font-black uppercase tracking-widest text-white/40 leading-none">Progress</span>
            <span className="text-sm font-black italic text-green-400 leading-none tracking-tighter">0 JP</span>
          </div>
          <Award className="h-4 w-4 text-green-400" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center pointer-events-auto relative z-10">

        {state === 'HOME' && (
          <div className="flex flex-col items-center text-center animate-in zoom-in duration-500 mt-[-40px]">
            <h1 className="text-7xl font-black italic mb-4 tracking-tighter uppercase leading-[0.75] text-white">
              HELIX<br/>
              <span className="text-orange-600">EMPIRE</span>
            </h1>

            <div className="mt-16">
              <button
                onClick={onStart}
                className="relative px-20 py-8 bg-orange-600 text-white rounded-[40px] font-black text-4xl italic active:scale-95 transition-all uppercase tracking-tighter shadow-[0_20px_60px_rgba(234,88,12,0.4)] border-b-4 border-orange-800"
              >
                PLAY
              </button>
            </div>

            <p className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">Sign in to sync progress</p>
          </div>
        )}

        {state === 'PLAYING' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500 mt-[-100px]">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2 italic">Stage {level}</p>
            <h2 className="text-9xl font-black italic text-white tracking-tighter leading-none drop-shadow-2xl">{score}</h2>
          </div>
        )}

        {state === 'REVIVE' && (
            <div className="w-full max-w-[320px] bg-black/95 backdrop-blur-3xl border-2 border-white/5 p-10 rounded-[60px] text-center animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600/5 pointer-events-none" />
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(220,38,38,0.5)] border-4 border-white/10">
                    <RefreshCw className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-4xl font-black italic uppercase mb-2">FAILED!</h2>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-10 italic">Don't lose your status!</p>

                <button
                    onClick={onRevive}
                    disabled={isProcessing}
                    className="w-full bg-red-600 py-6 rounded-3xl font-black text-2xl italic flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl border-b-4 border-red-900 disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "REVIVE"}
                </button>
                <button onClick={() => window.location.reload()} className="mt-8 text-[8px] font-black uppercase opacity-20 hover:opacity-100 transition-opacity underline tracking-[0.2em] italic">Quit Run</button>
            </div>
        )}

        {state === 'WIN' && (
            <div className="w-full max-w-[320px] bg-black/95 backdrop-blur-3xl border-2 border-white/5 p-10 rounded-[60px] text-center animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />
                <div className="mb-8 flex justify-center drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                    <Trophy className="h-24 w-24 text-yellow-500" />
                </div>
                <h2 className="text-5xl font-black italic uppercase leading-[0.8] mb-2">STAGE<br/>CLEAR!</h2>

                <div className="mt-12">
                  <button
                      onClick={onNext}
                      className="w-full bg-white text-black py-6 rounded-3xl font-black text-2xl italic flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-gray-100 border-b-4 border-gray-300"
                  >
                      NEXT STAGE <ChevronRight className="h-8 w-8" />
                  </button>
                </div>
            </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="pb-24 relative z-10">
          {state === 'PLAYING' && <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 animate-pulse italic">Tap & Hold to Spin</p>}
      </div>
    </div>
  );
}
