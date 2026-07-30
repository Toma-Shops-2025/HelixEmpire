import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { Coins, Zap, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Sparkles, Trophy, Box, ShoppingBag, Award } from 'lucide-react'
import { toast } from 'sonner'
import { CONFIG } from '@/config'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, signIn, signInWithGoogle, signUp, addJumpPoints, addViralCoins, loading } = useAuth()

  // Master State
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event'>('play')
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [currentSkin, setCurrentSkin] = useState('fire')
  const [isProcessing, setIsProcessing] = useState(false)

  const isPlaying = gameState === 'PLAYING';

  const handleReviveSuccess = useCallback(() => {
    setGameState('PLAYING');
    setIsProcessing(false);
    if (engineRef.current) engineRef.current.start();
    if (audioRef.current) audioRef.current.play().catch(() => {});
  }, []);

  // Game Engine Lifecycle
  useEffect(() => {
    if (!containerRef.current || !user) return

    if (activeTab !== 'play') {
        if (engineRef.current) {
            engineRef.current.dispose();
            engineRef.current = null;
        }
        return;
    }

    if (!engineRef.current) {
        const engine = new HelixEngine(containerRef.current, {
          score: 0,
          level: level,
          onWin: async () => {
              setGameState('WIN');
              audioRef.current?.pause();
              await addJumpPoints(score);
              await addViralCoins(50);
          },
          onLoss: () => {
              setGameState('REVIVE');
              audioRef.current?.pause();
          },
          onScoreUpdate: (pts) => setScore(prev => prev + pts)
        })

        engineRef.current = engine
        engine.setSkin(currentSkin);
        engine.setupLevel(level);
    }
  }, [user, activeTab, level, currentSkin, addJumpPoints, addViralCoins, score]);

  const startGame = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const randomTrack = Math.floor(Math.random() * 15) + 1;
    const audio = new Audio(`music/tier${randomTrack}.MP3`);
    audio.loop = true;
    audioRef.current = audio;

    setScore(0);
    setGameState('PLAYING');

    if (engineRef.current) {
        engineRef.current.reset();
        engineRef.current.start();
    }
    audio.play().catch(() => {});
  }

  const handleReviveRequest = () => {
      if (isProcessing) return;
      setIsProcessing(true);
      toast.info("Accessing recovery network...");
      setTimeout(() => {
          handleReviveSuccess();
      }, 1500);
  }

  if (loading) return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
  )

  if (!user) return <AuthUI onLogin={signIn} onGoogle={signInWithGoogle} onSignUp={signUp} />

  return (
    <div className="h-screen w-full bg-black text-white relative overflow-hidden font-sans">
      {/* 3D Container - Behind UI */}
      <div
        ref={containerRef}
        className={cn(
            "absolute inset-0 transition-opacity duration-500",
            activeTab === 'play' ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Overlay layers */}
      {activeTab === 'play' && (
          <GameUI
            state={gameState}
            score={score}
            level={level}
            onStart={startGame}
            onRevive={handleReviveRequest}
            onNext={() => {
                setLevel(prev => prev + 1);
                setGameState('HOME');
            }}
            isProcessing={isProcessing}
          />
      )}

      {activeTab === 'inventory' && <InventoryUI current={currentSkin} onSelect={setCurrentSkin} profile={profile} />}
      {activeTab === 'store' && <StoreUI profile={profile} />}
      {activeTab === 'event' && <LeaderboardUI profile={profile} />}

      {/* Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-md border-t border-white/10 flex justify-around items-center px-4 z-[9000]">
          <NavButton icon={Zap} label="Play" active={activeTab === 'play'} onClick={() => setActiveTab('play')} />
          <NavButton icon={Box} label="Skins" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <NavButton icon={ShoppingBag} label="Shop" active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
          <NavButton icon={Award} label="Ranks" active={activeTab === 'event'} onClick={() => setActiveTab('event')} />
      </nav>
    </div>
  )
}

function NavButton({ icon: Icon, label, active, onClick }: any) {
    return (
        <button onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-all", active ? "text-blue-400 scale-110" : "text-white/40")}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    )
}

function AuthUI({ onLogin, onGoogle, onSignUp }: any) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600 rounded-full blur-[120px]" />
            </div>

            <h1 className="text-6xl font-black italic mb-2 tracking-tighter uppercase text-center leading-none relative z-10">
                Helix<br/><span className="text-blue-500 font-serif">Empire</span>
            </h1>
            <p className="text-blue-400/40 uppercase tracking-[0.4em] text-[10px] mb-12 font-bold relative z-10">Ascend the Throne</p>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    isLogin ? onLogin(email, password) : onSignUp(email, password, username);
                }}
                className="w-full max-w-sm space-y-3 relative z-10"
            >
                {!isLogin && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                        <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                    <Mail className="h-5 w-5 text-white/40 mr-3" />
                    <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                    <Lock className="h-5 w-5 text-white/40 mr-3" />
                    <input type="password" placeholder="Password" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                    {isLogin ? 'Enter Arena' : 'Join Empire'}
                </button>

                <div className="relative py-4 flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-bold text-white/20 uppercase">OR</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                    type="button"
                    onClick={onGoogle}
                    className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                    Continue with Google
                </button>

                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-6 underline tracking-[0.2em]"
                >
                    {isLogin ? "Need an account? Sign Up" : "Back to Login"}
                </button>
            </form>
        </div>
    )
}

function InventoryUI({ current, onSelect, profile }: any) {
    const SKINS = [
        { id: 'fire', name: 'Inferno', cost: 0, color: 'bg-red-500' },
        { id: 'ice', name: 'Glacier', cost: 1000, color: 'bg-blue-400' },
        { id: 'toxic', name: 'Venom', cost: 2500, color: 'bg-lime-500' },
        { id: 'void', name: 'Void', cost: 5000, color: 'bg-purple-600' },
        { id: 'gold', name: 'Midas', cost: 10000, color: 'bg-yellow-500' },
    ]

    return (
        <div className="h-full w-full bg-slate-950 pt-20 px-6 overflow-y-auto pb-32">
            <h2 className="text-4xl font-black italic uppercase mb-8">Skin <span className="text-blue-500">Vault</span></h2>
            <div className="grid grid-cols-2 gap-4">
                {SKINS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => onSelect(s.id)}
                        className={cn(
                            "p-6 rounded-[35px] border-2 transition-all flex flex-col items-center gap-4",
                            current === s.id ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-white/5"
                        )}
                    >
                        <div className={cn("w-12 h-12 rounded-full shadow-lg", s.color)} />
                        <span className="font-bold uppercase text-xs tracking-widest">{s.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

function StoreUI({ profile }: any) {
    return (
        <div className="h-full w-full bg-slate-950 pt-20 px-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black italic uppercase">Empire <span className="text-blue-500">Shop</span></h2>
                <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20">
                    <Coins className="h-4 w-4 text-blue-500" />
                    <span className="font-black italic text-lg">{profile?.coin_balance || 0}</span>
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[45px] text-center">
                <ShoppingBag className="h-16 w-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Premium drops coming soon in next major update.</p>
            </div>
        </div>
    )
}

function LeaderboardUI({ profile }: any) {
    const { signOut } = useAuth()
    return (
        <div className="h-full w-full bg-slate-950 pt-20 px-6 overflow-y-auto pb-48 no-scrollbar">
            <h2 className="text-4xl font-black italic uppercase mb-8">Rank <span className="text-blue-500">System</span></h2>
            <div className="bg-gradient-to-br from-blue-600 to-blue-900 p-8 rounded-[45px] shadow-2xl relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 p-6 opacity-20"><Trophy className="h-24 w-24" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 text-white">Your Rank Score</p>
                <h3 className="text-5xl font-black italic">{profile?.jump_balance || 0}</h3>
                <p className="text-[10px] font-bold mt-4 uppercase text-blue-200">Global season resets in 14 days</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={() => window.open(CONFIG.PRIVACY_URL, '_blank')} className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all text-center">Privacy</button>
                <button onClick={() => window.location.assign('mailto:support@helixempire.fun')} className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all text-center">Support</button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <button onClick={() => { if(confirm("Permanently delete your account and all data? This cannot be undone.")) signOut(); }} className="text-red-500/20 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-100 transition-opacity underline">Delete Account</button>
                <button onClick={signOut} className="mt-4 text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Sign Out</button>
            </div>
        </div>
    )
}
