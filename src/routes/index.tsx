import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob'
import { Browser } from '@capacitor/browser'
import { Coins, Zap, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, signIn, signUp, addJumpPoints, supabase } = useAuth()

  // Master State
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event' | 'store_pack' | 'store_coins' | 'catalog'>('play')
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [currentSkin, setCurrentSkin] = useState('fire')
  const [levelCounter, setLevelCounter] = useState(0)
  const [isAdLoading, setIsAdLoading] = useState(false)

  // Auth States
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Pre-load Ads
  useEffect(() => {
    if (user) {
        AdMob.initialize().catch(() => {});
        AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' }).catch(() => {});
        AdMob.prepareInterstitialAd({ adId: 'ca-app-pub-3940256099942544/1033173712' }).catch(() => {});
    }
  }, [user]);

  const handleReviveSuccess = () => {
    console.log("Ad Reward Granted!");
    setGameState('PLAYING');
    setIsAdLoading(false);
    if (engineRef.current) {
        engineRef.current.setPaused(false);
    }
    if (audioRef.current) {
        audioRef.current.play().catch(() => {});
    }
  };

  // Global Ad Listeners
  useEffect(() => {
    const rListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        handleReviveSuccess();
    });

    const failedListener = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        setIsAdLoading(false);
    });

    const dismissedListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        setIsAdLoading(false);
    });

    return () => {
        rListener.remove();
        failedListener.remove();
        dismissedListener.remove();
    };
  }, []);

  // Sync Score and Interstitial Ads
  useEffect(() => {
      if (gameState === 'WIN') {
          if (score > 0) addJumpPoints(score);

          setLevelCounter(prev => {
              const newCount = prev + 1;
              console.log(`Level complete. Total wins this session: ${newCount}`);

              if (newCount % 3 === 0) {
                  console.log("Triggering interstitial ad (Every 3 levels)...");
                  AdMob.showInterstitialAd()
                    .then(() => {
                        AdMob.prepareInterstitialAd({ adId: 'ca-app-pub-3940256099942544/1033173712' }).catch(() => {});
                    })
                    .catch((e) => console.log("Ad failed to show", e));
              }
              return newCount;
          });
      } else if (gameState === 'REVIVE' && score > 0) {
          addJumpPoints(score);
      }
  }, [gameState]);

  // Engine Lifecycle
  useEffect(() => {
    if (!containerRef.current || activeTab !== 'play' || !user) return
    if (engineRef.current) engineRef.current.dispose();

    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      onWin: () => { setGameState('WIN'); audioRef.current?.pause(); },
      onLoss: () => { setGameState('REVIVE'); audioRef.current?.pause(); },
      onScoreUpdate: (pts) => setScore(prev => prev + pts)
    })
    engineRef.current = engine
    engine.setSkin(currentSkin);

    return () => {
        engine.dispose();
        engineRef.current = null;
    }
  }, [level, activeTab, user])

  const startGame = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const audio = new Audio(`music/tier${((level-1) % 15) + 1}.MP3`);
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setScore(0);
    setGameState('PLAYING');
    setTimeout(() => engineRef.current?.setPaused(false), 150);
  }

  const handleRevive = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
        console.log("Showing reward ad...");
        // Ensure ad is prepared first
        await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' });
        await AdMob.showRewardVideoAd();
    } catch (e) {
        console.error("Reward Ad Error:", e);
        // Fallback: If ad fails, still revive the player so they aren't stuck
        handleReviveSuccess();
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLogin && !agreed) return alert("Please agree to the terms to join.");
      try {
          if (isLogin) await signIn(email, password);
          else await signUp(email, password, username);
      } catch (err: any) { alert(err.message); }
  }

  if (!user) {
      return (
          <div className="h-screen w-full bg-[#050510] flex flex-col items-center justify-center p-8 text-white overflow-y-auto">
              <h1 className="text-6xl font-black italic mb-2 text-primary tracking-tighter">HELIX</h1>
              <p className="text-white/40 uppercase tracking-[0.4em] text-[9px] mb-12 font-bold">Empire Rewards System</p>

              <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 pb-10">
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
                      <input type={showPassword ? "text" : "password"} placeholder="Password" name="password" autoComplete="current-password" className="bg-transparent outline-none w-full font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 px-2">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                  </div>
                  {!isLogin && (
                      <div className="flex items-center gap-3 px-2 py-2">
                          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                          <span className="text-[10px] text-white/40 font-bold uppercase">I am 18+ and agree to Terms</span>
                      </div>
                  )}
                  <button type="submit" className="w-full bg-primary py-5 rounded-3xl font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all mt-4">
                      {isLogin ? 'Login' : 'Create Account'}
                  </button>
                  <div className="flex flex-col items-center gap-4 mt-6">
                      <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="w-full bg-white text-black py-4 rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform">
                          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Continue with Google
                      </button>
                      <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-white/40 font-bold text-sm uppercase tracking-tighter mt-2">
                          {isLogin ? "Need an account? Sign Up" : "Back to Login"}
                      </button>
                  </div>
              </form>
          </div>
      )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* HUD */}
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
            <div className="text-7xl font-black italic drop-shadow-glow">{score}</div>
        </div>
      )}

      {activeTab === 'play' && gameState !== 'PLAYING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[500] bg-black/50 backdrop-blur-[2px] px-6 text-center">
            {gameState === 'HOME' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <h1 className="text-7xl font-black italic mb-12 leading-none tracking-tighter text-white">HELIX<br/>EMPIRE</h1>
                    <button onClick={startGame} className="w-64 h-24 bg-[#FF4500] rounded-full text-4xl font-black italic shadow-[0_0_50px_rgba(255,69,0,0.4)] active:scale-95 transition-all">PLAY</button>
                    <div className="mt-12 flex gap-8 text-[12px] font-black uppercase tracking-widest opacity-40 pointer-events-auto">
                        <span className="cursor-pointer hover:text-white" onClick={() => Browser.open({url: 'https://viralsnap.online/privacy'})}>Privacy</span>
                        <span className="cursor-pointer hover:text-white" onClick={() => Browser.open({url: 'https://viralsnap.online/terms'})}>Terms</span>
                    </div>
                </div>
            )}
            {gameState === 'WIN' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <h2 className="text-6xl font-black mb-12 italic text-yellow-400 drop-shadow-2xl">SUCCESS</h2>
                    <button onClick={() => { setGameState('HOME'); setLevel(l => l + 1); }} className="w-72 py-8 bg-white text-black rounded-[40px] font-black text-2xl active:scale-95 transition-all shadow-2xl">NEXT STAGE</button>
                </div>
            )}
            {gameState === 'REVIVE' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center w-full">
                    <h2 className="text-6xl font-black mb-8 italic text-red-500">FAILED</h2>
                    <button onClick={handleRevive} disabled={isAdLoading} className="w-full max-w-xs py-6 bg-green-500 rounded-[30px] font-black text-xl mb-4 shadow-lg active:scale-95 transition-all disabled:opacity-50">
                        {isAdLoading ? "LOADING AD..." : "WATCH AD TO REVIVE"}
                    </button>
                    <button onClick={() => { setGameState('HOME'); setLevel(1); }} className="w-full max-w-xs py-6 border-4 border-white/10 bg-white/5 rounded-[30px] font-black text-xl active:scale-95 transition-all">START OVER</button>
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
