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
  const { user, profile, signIn, signUp, addJumpPoints, addViralCoins, supabase, loading } = useAuth()

  // Master State
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event' | 'store_pack' | 'store_coins' | 'catalog' | 'how_to_play' | 'faq'>('play')
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0) // Crucial for saving the right score
  const [level, setLevel] = useState(1)
  const [currentSkin, setCurrentSkin] = useState('fire')
  const [levelCounter, setLevelCounter] = useState(0)
  const [isAdLoading, setIsAdLoading] = useState(false)
  const [isAdPlaying, setIsAdPlaying] = useState(false)

  // Sync scoreRef
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Auth States
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Pre-load Ads & Banner
  useEffect(() => {
    if (!user) return;
    const initAds = async () => {
        try {
            await AdMob.initialize();
            await AdMob.showBanner({
                adId: 'ca-app-pub-3940256099942544/6300978111',
                position: BannerAdPosition.TOP_CENTER,
                size: BannerAdSize.BANNER,
                isTesting: true,
                margin: 0
            });
            await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' });
            await AdMob.prepareInterstitialAd({ adId: 'ca-app-pub-3940256099942544/1033173712' });
        } catch (e) {}
    };
    initAds();
  }, [user]);

  const handleReviveSuccess = useCallback(() => {
    setGameState('PLAYING');
    setIsAdLoading(false);
    setIsAdPlaying(false);
    if (engineRef.current) engineRef.current.setPaused(false);

    // Smooth delay before music resumes
    setTimeout(() => {
        if (audioRef.current && !isAdPlaying) {
            audioRef.current.play().catch(() => {});
        }
    }, 500);
  }, [isAdPlaying]);

  // Global Ad Listeners
  useEffect(() => {
    if (!user) return;

    const rListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        handleReviveSuccess();
    });

    const failedListener = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        setIsAdLoading(false);
        setIsAdPlaying(false);
    });

    const dismissedListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        setIsAdLoading(false);
        setIsAdPlaying(false);
        setTimeout(() => {
            if (audioRef.current) audioRef.current.play().catch(() => {});
        }, 500);
    });

    return () => {
        rListener.remove();
        failedListener.remove();
        dismissedListener.remove();
    };
  }, [user, handleReviveSuccess]);

  // Game Engine Lifecycle
  useEffect(() => {
    if (!containerRef.current || activeTab !== 'play' || !user) return
    if (engineRef.current) engineRef.current.dispose();

    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      onWin: () => {
          setGameState('WIN');
          audioRef.current?.pause();

          // Use current scoreRef to ensure accuracy
          if (scoreRef.current > 0) {
              addJumpPoints(scoreRef.current);
              addViralCoins(50);
          }

          setLevelCounter(prev => {
              const next = prev + 1;
              if (next % 3 === 0 && Capacitor.isNativePlatform()) {
                  AdMob.showInterstitialAd().catch(() => {});
              }
              return next;
          });
      },
      onLoss: () => {
          setGameState('REVIVE');
          audioRef.current?.pause();
      },
      onScoreUpdate: (pts) => setScore(prev => prev + pts)
    })
    engineRef.current = engine
    engine.setSkin(currentSkin);

    return () => {
        engine.dispose();
        engineRef.current = null;
    }
  }, [level, activeTab, user, currentSkin, addJumpPoints, addViralCoins]);

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
    setTimeout(() => engineRef.current?.setPaused(false), 150);
  }

  const handleRevive = async () => {
    if (isAdLoading) return;
    if (!Capacitor.isNativePlatform()) return handleReviveSuccess();

    setIsAdLoading(true);
    setIsAdPlaying(true);
    if (audioRef.current) audioRef.current.pause();
    try {
        await AdMob.showRewardVideoAd();
    } catch (e) {
        handleReviveSuccess();
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLogin && !agreed) return toast.error("Please agree to terms.");
      try {
          if (isLogin) await signIn(email, password);
          else await signUp(email, password, username);
      } catch (err: any) { toast.error(err.message); }
  }

  if (loading) {
      return (
          <div className="h-screen w-full bg-[#050510] flex items-center justify-center text-white">
              <Loader2 className="animate-spin text-primary h-12 w-12" />
          </div>
      )
  }

  if (!user) {
      return (
          <div className="h-screen w-full bg-[#050510] flex flex-col items-center justify-start p-8 pt-24 text-white overflow-y-auto">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
                <span className="text-[90vh] font-black italic select-none">H</span>
              </div>

              <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                  <h1 className="text-7xl font-black italic mb-2 text-primary tracking-tighter drop-shadow-glow">HELIX</h1>
                  <p className="text-white/40 uppercase tracking-[0.4em] text-[9px] mb-12 font-bold">Empire Rewards System</p>

                  <form onSubmit={handleAuth} className="w-full space-y-3 pb-20">
                      {!isLogin && (
                          <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 focus-within:border-primary/50 transition-colors">
                              <UserIcon className="h-5 w-5 text-white/20 mr-3" />
                              <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold" value={username} onChange={e => setUsername(e.target.value)} required />
                          </div>
                      )}
                      <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 focus-within:border-primary/50 transition-colors">
                          <Mail className="h-5 w-5 text-white/20 mr-3" />
                          <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 focus-within:border-primary/50 transition-colors">
                          <Lock className="h-5 w-5 text-white/20 mr-3" />
                          <input type={showPassword ? "text" : "password"} placeholder="Password" name="password" className="bg-transparent outline-none w-full font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 px-2">
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                      </div>
                      {!isLogin && (
                          <div className="flex items-center gap-3 px-2 py-2">
                              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-primary" />
                              <span className="text-[10px] text-white/40 font-bold uppercase underline" onClick={() => Browser.open({url: 'https://viralsnap.online/terms'})}>I agree to Terms</span>
                          </div>
                      )}
                      <button type="submit" className="w-full bg-primary py-5 rounded-3xl font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all mt-4">
                          {isLogin ? 'Login' : 'Create Account'}
                      </button>
                      <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-white/40 font-bold text-sm uppercase tracking-widest mt-6 underline">
                          {isLogin ? "Need an account? Sign Up" : "Back to Login"}
                      </button>
                  </form>
              </div>
          </div>
      )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <span className="text-[90vh] font-black italic opacity-[0.04] shadow-x-glow animate-float-slow select-none">H</span>
      </div>

      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* HUD */}
      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              <Coins className="h-4 w-4 text-yellow-400 shadow-glow" />
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

      {activeTab === 'play' && gameState !== 'PLAYING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[500] bg-black/50 backdrop-blur-[2px] px-6 text-center">
            {gameState === 'HOME' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <h1 className="text-7xl font-black italic mb-12 leading-none tracking-tighter text-white drop-shadow-glow">HELIX<br/>EMPIRE</h1>
                    <button onClick={startGame} className="w-64 h-24 bg-primary rounded-full text-4xl font-black italic shadow-glow active:scale-95 transition-all">PLAY</button>
                    <div className="mt-12 flex gap-8 text-[12px] font-black uppercase tracking-widest opacity-40 pointer-events-auto">
                        <span className="cursor-pointer hover:text-white" onClick={() => Browser.open({url: 'https://viralsnap.online/privacy'})}>Privacy</span>
                        <span className="cursor-pointer hover:text-white" onClick={() => Browser.open({url: 'https://viralsnap.online/terms'})}>Terms</span>
                    </div>
                </div>
            )}
            {gameState === 'WIN' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <Trophy className="h-24 w-24 text-yellow-400 mb-6 drop-shadow-glow" />
                    <h2 className="text-6xl font-black mb-12 italic text-white drop-shadow-2xl">STAGE CLEAR!</h2>
                    <button onClick={() => { setGameState('HOME'); setLevel(l => l + 1); }} className="w-72 py-8 bg-white text-black rounded-[40px] font-black text-2xl active:scale-95 transition-all shadow-2xl uppercase tracking-tighter">Next Stage</button>
                </div>
            )}
            {gameState === 'REVIVE' && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center w-full">
                    <h2 className="text-6xl font-black mb-8 italic text-red-500 drop-shadow-glow">FAILED</h2>
                    <button onClick={handleRevive} disabled={isAdLoading} className="w-full max-w-xs py-6 bg-green-500 rounded-[30px] font-black text-xl mb-4 shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                        {isAdLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="h-6 w-6" />}
                        {isAdLoading ? "LOADING..." : "REVIVE WITH AD"}
                    </button>
                    <button onClick={() => { setGameState('HOME'); setLevel(1); }} className="w-full max-w-xs py-6 border-4 border-white/10 bg-white/5 rounded-[30px] font-black text-xl active:scale-95 transition-all opacity-40 italic">TRY AGAIN</button>
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
