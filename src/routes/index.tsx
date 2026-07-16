import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob'
import { Browser } from '@capacitor/browser'
import { Coins, Zap, Mail, Lock, User as UserIcon } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, signIn, signUp, addJumpPoints, requestPayout, supabase } = useAuth()

  // Game States
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event'>('play')

  // Auth Form States
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  // Sync Score to DB
  useEffect(() => {
      if ((gameState === 'WIN' || gameState === 'REVIVE') && score > 0) {
          addJumpPoints(score);
      }
  }, [gameState]);

  // Handle 3D Engine
  useEffect(() => {
    if (!containerRef.current || activeTab !== 'play') return
    if (engineRef.current) engineRef.current.dispose();

    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      onWin: () => { setGameState('WIN'); audioRef.current?.pause(); },
      onLoss: () => { setGameState('REVIVE'); audioRef.current?.pause(); },
      onScoreUpdate: (pts) => setScore(prev => prev + pts)
    })
    engineRef.current = engine
    return () => engine.dispose()
  }, [level, activeTab])

  const startGame = () => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`music/tier${((level-1) % 15) + 1}.MP3`);
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setScore(0);
    setGameState('PLAYING');
    setTimeout(() => engineRef.current?.setPaused(false), 100);
  }

  const handleRevive = async () => {
    try {
        const listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
            setGameState('PLAYING');
            engineRef.current?.setPaused(false);
            audioRef.current?.play();
            listener.remove();
        });
        await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' });
        await AdMob.showRewardVideoAd();
    } catch (e) {
        setGameState('PLAYING');
        engineRef.current?.setPaused(false);
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isLogin) await signIn(email, password);
          else await signUp(email, password, username);
      } catch (err: any) { alert(err.message); }
  }

  const googleLogin = async () => {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  if (!user) {
      return (
          <div className="h-screen w-full bg-[#050510] flex flex-col items-center justify-center p-8 text-white">
              <h1 className="text-5xl font-black italic mb-2 text-primary">HELIX</h1>
              <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] mb-12 font-bold">Empire Rewards</p>

              <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
                  {!isLogin && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4">
                          <UserIcon className="h-5 w-5 text-white/20 mr-3" />
                          <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>
                  )}
                  <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4">
                      <Mail className="h-5 w-5 text-white/20 mr-3" />
                      <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4">
                      <Lock className="h-5 w-5 text-white/20 mr-3" />
                      <input type="password" placeholder="Password" className="bg-transparent outline-none w-full font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="w-full bg-primary py-5 rounded-3xl font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all">
                      {isLogin ? 'Enter Empire' : 'Join the Empire'}
                  </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-sm">
                  <div className="flex items-center w-full gap-4 opacity-20"><div className="h-[1px] bg-white flex-1" /><span>OR</span><div className="h-[1px] bg-white flex-1" /></div>
                  <button onClick={googleLogin} className="w-full bg-white text-black py-4 rounded-3xl font-bold flex items-center justify-center gap-3">
                      <img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Sign in with Google
                  </button>
                  <button onClick={() => setIsLogin(!isLogin)} className="text-white/40 font-bold text-sm uppercase tracking-tighter">
                      {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* PERSISTENT HUD */}
      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              <Coins className="h-4 w-4 text-yellow-400 shadow-glow" />
              <span className="font-black text-sm">{profile?.coin_balance || 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="font-black text-sm">{(profile?.jump_balance || 0).toLocaleString()}</span>
          </div>
      </div>

      {gameState === 'PLAYING' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
            <div className="text-[10px] opacity-50 uppercase font-black tracking-widest">Stage {level}</div>
            <div className="text-7xl font-black italic drop-shadow-lg">{score}</div>
        </div>
      )}

      {activeTab === 'play' && gameState !== 'PLAYING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[500] bg-black/50 backdrop-blur-[2px] px-6 text-center">
            {gameState === 'HOME' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <h1 className="text-6xl font-black italic mb-12 leading-none tracking-tighter">HELIX<br/>EMPIRE</h1>
                    <button onClick={startGame} className="w-64 h-24 bg-[#FF4500] rounded-full text-4xl font-black italic shadow-[0_0_50px_rgba(255,69,0,0.4)] active:scale-95 transition-all">PLAY</button>
                    <div className="mt-12 flex gap-8 text-[12px] font-black uppercase tracking-widest opacity-40 pointer-events-auto">
                        <span className="cursor-pointer" onClick={() => Browser.open({url: 'https://viralsnap.online/privacy'})}>Privacy</span>
                        <span className="cursor-pointer" onClick={() => Browser.open({url: 'https://viralsnap.online/terms'})}>Terms</span>
                    </div>
                </div>
            )}
            {gameState === 'WIN' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <h2 className="text-6xl font-black mb-12 italic text-yellow-400 drop-shadow-2xl">SUCCESS</h2>
                    <button onClick={() => { setGameState('HOME'); setLevel(l => l + 1); }} className="w-72 py-8 bg-white text-black rounded-[40px] font-black text-2xl shadow-2xl active:scale-95 transition-all">NEXT STAGE</button>
                </div>
            )}
            {gameState === 'REVIVE' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center w-full">
                    <h2 className="text-6xl font-black mb-8 italic text-red-500">FAILED</h2>
                    <button onClick={handleRevive} className="w-full max-w-xs py-6 bg-green-500 rounded-[30px] font-black text-xl mb-4 shadow-lg active:scale-95 transition-all">WATCH AD TO REVIVE</button>
                    <button onClick={() => { setGameState('HOME'); setLevel(1); }} className="w-full max-w-xs py-6 border-4 border-white/10 bg-white/5 rounded-[30px] font-black text-xl active:scale-95 transition-all">START OVER</button>
                </div>
            )}
        </div>
      )}

      <GameUI
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSkinSelect={(s) => engineRef.current?.setSkin(s)}
        isHidden={gameState === 'PLAYING'}
        requestPayout={requestPayout}
      />
    </div>
  )
}
