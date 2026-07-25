import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { AdMob, BannerAdPosition, BannerAdSize, RewardAdPluginEvents } from '@capacitor-community/admob'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { Coins, Zap, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Sparkles, Trophy } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, signIn, signInWithGoogle, signUp, addJumpPoints, addViralCoins, loading, fetchProfile } = useAuth()

  // Correct Helix Empire Master States
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event'>('play')
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [currentSkin, setCurrentSkin] = useState('fire')
  const [isAdLoading, setIsAdLoading] = useState(false)

  // Auth States
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Game Engine Lifecycle
  useEffect(() => {
    if (!containerRef.current || activeTab !== 'play' || !user) return
    if (engineRef.current) engineRef.current.dispose();

    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      onWin: async () => {
          setGameState('WIN');
          audioRef.current?.pause();
          await addJumpPoints(score);
          await addViralCoins(50);
          if (Capacitor.isNativePlatform()) AdMob.showInterstitialAd().catch(() => {});
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

    return () => {
        engine.dispose();
        engineRef.current = null;
    }
  }, [level, activeTab, user, currentSkin]);

  const startGame = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const randomTrack = Math.floor(Math.random() * 15) + 1;
    const audio = new Audio(`music/tier${randomTrack}.MP3`);
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;

    setScore(0);
    setGameState('PLAYING');
    setTimeout(() => {
        if (engineRef.current) engineRef.current.setPaused(false);
    }, 150);
  }

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLogin && !agreed) return toast.error("Agree to terms.");
      try {
          if (isLogin) await signIn(email, password);
          else await signUp(email, password, username);
      } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <div className="h-screen w-full bg-black flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>

  if (!user) {
      return (
          <div className="h-[100dvh] w-full bg-[#050510] flex flex-col items-center justify-start p-8 pt-32 text-white relative overflow-y-auto no-scrollbar">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
                <span className="text-[80vh] font-black italic select-none">H</span>
              </div>
              <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
                  <img src="/logo.png" className="w-40 h-40 mb-6 drop-shadow-glow" alt="Logo" />
                  <h1 className="text-7xl font-black italic mb-2 text-primary tracking-tighter drop-shadow-glow leading-none">HELIX</h1>
                  <p className="text-white/40 uppercase tracking-[0.4em] text-[9px] mb-12 font-bold italic">Empire Rewards System</p>
                  <form onSubmit={handleAuth} className="w-full space-y-3 pb-64">
                      {!isLogin && (
                          <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                              <UserIcon className="h-5 w-5 text-white/20 mr-3" />
                              <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold" value={username} onChange={e => setUsername(e.target.value)} required />
                          </div>
                      )}
                      <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                          <Mail className="h-5 w-5 text-white/40 mr-3" />
                          <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                          <Lock className="h-5 w-5 text-white/20 mr-3" />
                          <input type={showPassword ? "text" : "password"} placeholder="Password" name="password" className="bg-transparent outline-none w-full font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 px-2">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                      </div>
                      {!isLogin && (
                          <div className="flex items-center gap-3 px-2 py-2">
                              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-primary h-4 w-4" />
                              <label className="text-[10px] text-white/40 font-bold uppercase underline">I agree to Terms</label>
                          </div>
                      )}
                      <button type="submit" className="w-full bg-primary py-5 rounded-3xl font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all mt-4 text-white">
                          {isLogin ? 'Login' : 'Create Account'}
                      </button>
                      <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-white/40 font-bold text-xs uppercase tracking-widest mt-6 underline">
                          {isLogin ? "Join the Empire" : "Back to Login"}
                      </button>
                  </form>
              </div>
          </div>
      )
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black text-white">
      {/* 3D Engine Layer */}
      <div ref={containerRef} className="absolute inset-0 z-10" />

      {/* Cinematic Logo Layer */}
      {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
             <span className="text-[80vh] font-black italic opacity-[0.08] shadow-x-glow animate-pulse select-none">H</span>
          </div>
      )}

      {/* HUD Layer */}
      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-[2000] pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="font-black text-sm">{profile?.coin_balance || 0}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="font-black text-sm">{(profile?.jump_balance || 0).toLocaleString()}</span>
              </div>
              {gameState === 'PLAYING' && <div className="text-[10px] font-black italic text-primary animate-pulse pr-2">SCORE: {score}</div>}
          </div>
      </div>

      {/* Main Play UI */}
      {activeTab === 'play' && gameState !== 'PLAYING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[1500] bg-black/40 backdrop-blur-[2px] px-6 text-center">
            {gameState === 'HOME' && (
                <div className="flex flex-col items-center">
                    <h1 className="text-7xl font-black italic mb-12 leading-none tracking-tighter text-white drop-shadow-glow">HELIX<br/>EMPIRE</h1>
                    <button onClick={startGame} className="w-64 h-24 bg-primary text-white rounded-full text-4xl font-black italic shadow-glow active:scale-95 transition-all">PLAY</button>
                    <div className="mt-12 flex gap-8 text-[12px] font-black uppercase tracking-widest opacity-40">
                        <span className="cursor-pointer hover:text-white" onClick={() => Browser.open({url: 'https://viralsnap.online/privacy'})}>Privacy</span>
                        <span className="cursor-pointer hover:text-white" onClick={() => Browser.open({url: 'https://viralsnap.online/terms'})}>Terms</span>
                    </div>
                </div>
            )}
            {gameState === 'WIN' && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <Trophy className="h-24 w-24 text-yellow-400 mb-6 drop-shadow-glow" />
                    <h2 className="text-6xl font-black mb-12 italic text-white drop-shadow-2xl uppercase">Stage Clear</h2>
                    <button onClick={() => { setGameState('HOME'); setLevel(l => l + 1); }} className="w-72 py-8 bg-white text-black rounded-[40px] font-black text-2xl active:scale-95 transition-all shadow-2xl uppercase tracking-tighter">Next Stage</button>
                </div>
            )}
            {gameState === 'REVIVE' && (
                <div className="flex flex-col items-center w-full animate-in zoom-in duration-300">
                    <h2 className="text-6xl font-black mb-8 italic text-red-500 drop-shadow-glow uppercase">Crash</h2>
                    <button onClick={() => { setGameState('HOME'); setLevel(1); }} className="w-full max-w-xs py-6 border-4 border-white/10 bg-white/5 rounded-[30px] font-black text-xl active:scale-95 transition-all opacity-40 italic uppercase">Try Again</button>
                </div>
            )}
        </div>
      )}

      <GameUI
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentSkin={currentSkin}
        onSkinSelect={(s) => {
            setCurrentSkin(s);
            engineRef.current?.setSkin(s);
        }}
        isHidden={gameState === 'PLAYING'}
      />
    </div>
  )
}
