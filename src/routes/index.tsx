import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HelixEngine, type BallSkin } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { GameOnboarding } from '@/components/GameOnboarding'
import { toast } from 'sonner'
import { AdMob, RewardAdPluginEvents, type AdMobRewardItem } from '@capacitor-community/admob'
import { Trophy, Coins, ArrowRight, Loader2, Award, X, CheckSquare, Square, Diamond } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Link } from '@tanstack/react-router'
import { Capacitor } from '@capacitor/core'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, signIn, signUp, signOut, addViralCoins, addJumpPoints, requestPayout } = useAuth()

  const [skin, setSkin] = useState<BallSkin>('fire')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN' | 'AUTH' | 'SHOP_DETAILS' | 'TOURNAMENT'>('HOME')
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event'>('play')
  const [isAdLoading, setIsAdLoading] = useState(false)

  // Auth form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const isNative = Capacitor.isNativePlatform()
  const REWARDED_AD_ID = 'ca-app-pub-7552743356249250/1147502657'
  const INTERSTITIAL_AD_ID = 'ca-app-pub-7552743356249250/9029897490'

  useEffect(() => {
    if (isNative) {
        AdMob.initialize({ requestTrackingAuthorization: true }).catch(console.error)
        AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID }).catch(() => {})
    }
  }, [isNative])

  useEffect(() => {
    if (!containerRef.current) return

    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      isGameOver: false,
      onWin: () => {
        setGameState('WIN')
        toast.success("STAGE CLEAR!")
      },
      onLoss: () => {
        setGameState('REVIVE')
        if (isNative) AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_ID }).catch(() => {})
      },
      onScoreUpdate: (pts) => {
          setScore(prev => prev + pts);
          if (user) addJumpPoints(pts);
      }
    })

    engineRef.current = engine
    return () => engine.dispose()
  }, [])

  // Music System - Picks a new song every level and LOOPS it
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
    }

    const trackNumber = Math.floor(Math.random() * 15) + 1;
    // Using relative path ./ for better compatibility across platforms
    audioRef.current.src = `./music/tier${trackNumber}.MP3`;
    audioRef.current.load();

    if (gameState === 'PLAYING' || gameState === 'HOME') {
        audioRef.current.play().catch(() => {});
    }
  }, [level])

  // Volume & Playback Control
  useEffect(() => {
    if (!audioRef.current) return;
    if (gameState === 'PLAYING') {
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
    } else if (gameState === 'HOME') {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
    }
  }, [gameState])

  useEffect(() => {
    if (engineRef.current) engineRef.current.setupLevel(level)
  }, [level])

  // SYNC ENGINE STATE
  useEffect(() => {
    if (!engineRef.current) return;
    const isActuallyPlaying = gameState === 'PLAYING' && activeTab === 'play';
    engineRef.current.setAutoRotate(gameState === 'HOME');
    engineRef.current.setPaused(!isActuallyPlaying);
  }, [gameState, activeTab])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error("Please fill in both fields")
    if (isRegistering && !agreedToTerms) return toast.error("Please agree to the Terms and Privacy Policy")
    setAuthLoading(true)
    try {
        if (isRegistering) {
            await signUp(email, password)
            toast.success("Welcome! Account created.")
            setGameState('HOME')
        } else {
            await signIn(email, password)
            toast.success("Signed in!")
            setGameState('HOME')
        }
    } catch (e: any) {
        toast.error(e.message)
    } finally {
        setAuthLoading(false)
    }
  }

  const startGame = () => {
    setScore(0)
    setGameState('PLAYING')
    setActiveTab('play')
    if (engineRef.current) {
        engineRef.current.resetToStart()
        engineRef.current.setPaused(false);
        engineRef.current.setAutoRotate(false);
        engineRef.current.revive()
    }
    if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
    }
  }

  const nextLevel = async () => {
    if (isNative && level % 3 === 0) {
        AdMob.showInterstitial().catch(() => {});
    }
    const bonus = 100 + (level * 10);
    const vcBonus = level % 5 === 0 ? 50 : 0;

    if (user) {
        await addJumpPoints(bonus);
        if(vcBonus > 0) {
            await addViralCoins(vcBonus)
            toast.success(`EMPIRE BONUS: +${vcBonus} ViralCoins!`, { icon: '🔥' })
        }
    }

    if (engineRef.current) {
        engineRef.current.setupLevel(level + 1);
        engineRef.current.resetToStart()
        engineRef.current.revive()
    }

    setLevel(prev => prev + 1)
    setGameState('PLAYING')
    setActiveTab('play')
  }

  const handleAdRevive = async () => {
    try {
      setIsAdLoading(true)
      if (audioRef.current) audioRef.current.pause();

      const listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        setGameState('PLAYING')
        engineRef.current?.revive()
        if (audioRef.current) {
            audioRef.current.volume = 1.0;
            audioRef.current.play().catch(() => {});
        }
        setIsAdLoading(false)
        listener.remove()
      })
      await AdMob.showRewardVideoAd()
    } catch (e) {
      toast.error("Ad not ready.")
      setIsAdLoading(false)
      setGameState('PLAYING')
      engineRef.current?.revive()
      if (audioRef.current) audioRef.current.play().catch(() => {});
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none touch-none font-sans text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <GameOnboarding onComplete={() => setGameState('HOME')} />

      {/* TOP HUD */}
      <div className="absolute top-4 inset-x-0 p-6 flex justify-between items-start z-[150] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
            <Coins className="h-4 w-4 text-yellow-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50 leading-none">Wallet</span>
              <span className="text-sm font-black leading-none">{(profile?.coin_balance || 0).toLocaleString()} VC</span>
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xl text-right pointer-events-auto">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50 leading-none">Progress</span>
              <span className="text-sm font-black leading-none text-green-400">{(profile?.jump_balance || 0).toLocaleString()} JP</span>
            </div>
            <Award className="h-4 w-4 text-green-400" />
          </div>
      </div>

      {/* SCORE HUD */}
      {gameState === 'PLAYING' && activeTab === 'play' && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none drop-shadow-lg z-10 animate-in fade-in zoom-in-50 duration-500">
            <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Stage {level}</span>
            <span className="text-white text-7xl font-black italic tracking-tighter leading-none">{score}</span>
        </div>
      )}

      {/* MODALS */}
      <div className="absolute inset-0 z-[500] pointer-events-none">
        {gameState === 'HOME' && activeTab === 'play' && (
            <div className="w-full h-full bg-black/20 backdrop-blur-[1px] flex flex-col items-center justify-between pt-24 pb-48 pointer-events-auto animate-in fade-in duration-700">
                <div className="flex flex-col items-center pt-8">
                    <h1 className="text-[15vw] sm:text-8xl font-black italic text-white leading-none tracking-tighter drop-shadow-2xl text-center leading-none">
                        HELIX<br /><span className="text-primary italic text-[18vw] sm:text-9xl">EMPIRE</span>
                    </h1>
                </div>
                <div className="flex flex-col items-center gap-6 w-full max-w-xs px-6">
                    <button onClick={startGame} className="w-full h-28 bg-primary text-white rounded-[40px] font-black uppercase text-4xl italic tracking-tighter shadow-glow animate-pulse active:scale-95 transition-all">
                        PLAY
                    </button>
                    {!user && (
                        <button onClick={() => { setIsRegistering(false); setGameState('AUTH'); }} className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors py-4">
                            Join the Empire / Sign In to Sync
                        </button>
                    )}
                    <div className="flex flex-col items-center gap-1 mt-4">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Empire Network v6.6</p>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 text-center">
                            <Link to="/about" className="text-white/30 text-[8px] font-bold uppercase tracking-widest hover:text-white">About</Link>
                            <Link to="/terms" className="text-white/30 text-[8px] font-bold uppercase tracking-widest hover:text-white underline">Terms</Link>
                            <Link to="/privacy" className="text-white/30 text-[8px] font-bold uppercase tracking-widest hover:text-white underline">Privacy</Link>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SHOP MODAL */}
        {(gameState === 'SHOP_DETAILS' || activeTab === 'store') && (
             <div className="w-full h-full bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in slide-in-from-bottom-10 z-[600]">
                <button onClick={() => { setGameState('HOME'); setActiveTab('play'); }} className="absolute top-12 right-8 text-white/40 p-2 hover:text-white transition-colors"><X className="h-10 w-10" /></button>
                <div className="w-full max-w-sm space-y-10 text-center">
                    <div className="h-32 w-32 bg-blue-600/20 rounded-[40px] flex items-center justify-center mx-auto ring-4 ring-blue-600/40">
                        <Diamond className="h-16 w-16 text-blue-400" />
                    </div>
                    <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">Empire Pack</h2>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-4">Ad-Free Gaming + Pro status in all Empire Network apps.</p>
                    <button onClick={() => toast.info("Google Play Billing starting...")} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xl shadow-2xl active:scale-95 transition-all">SUBSCRIBE NOW</button>
                    <div className="bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center mt-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="h-12 w-12 bg-yellow-400/20 rounded-2xl flex items-center justify-center">
                                <Coins className="h-6 w-6 text-yellow-400" />
                            </div>
                            <span className="font-black uppercase tracking-tighter leading-none text-lg">1,000 VC</span>
                        </div>
                        <div className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow">$4.99</div>
                    </div>
                </div>
             </div>
        )}

        {/* TOURNAMENT MODAL */}
        {(gameState === 'TOURNAMENT' || activeTab === 'event') && (
             <div className="w-full h-full bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in zoom-in-95 z-[600]">
                <button onClick={() => { setGameState('HOME'); setActiveTab('play'); }} className="absolute top-12 right-8 text-white/40 p-2 hover:text-white transition-colors"><X className="h-10 w-10" /></button>
                <div className="w-full max-w-sm space-y-8 text-center">
                    <Trophy className="h-32 w-32 text-yellow-400 mx-auto animate-bounce" />
                    <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">Tournament</h2>
                    <div className="bg-white/5 border-2 border-white/10 p-6 rounded-[40px] space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/40 leading-none">Prize Pool</p>
                        <p className="text-4xl font-black text-yellow-400 tracking-tighter leading-none">5,000 VC</p>
                    </div>
                    <button onClick={() => toast.success("Entered Tournament!")} className="w-full bg-primary py-6 rounded-3xl font-black uppercase text-xl shadow-glow active:scale-95 transition-all">JOIN EVENT</button>
                </div>
             </div>
        )}

        {gameState === 'AUTH' && (
            <div className="w-full h-full bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 pointer-events-auto z-[600]">
                <div className="w-full max-w-xs space-y-8 relative">
                    <button onClick={() => setGameState('HOME')} className="absolute -top-12 -right-4 text-white/40 p-2 hover:text-white"><X className="h-8 w-8" /></button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">{isRegistering ? 'Join Empire' : 'Empire Login'}</h2>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-primary text-lg" required />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-primary text-lg" required />
                        {isRegistering && (
                          <div className="flex gap-3 px-2 pt-2 items-start" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                             {agreedToTerms ? <CheckSquare className="h-5 w-5 text-primary shrink-0" /> : <Square className="h-5 w-5 text-white/20 shrink-0" />}
                             <p className="text-[9px] font-bold uppercase text-white/40 tracking-wider leading-relaxed text-left">
                                I agree to the <Link to="/terms" className="text-primary underline">Terms</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
                             </p>
                          </div>
                        )}
                        <button type="submit" disabled={authLoading} className="w-full bg-primary py-6 rounded-3xl text-white font-black uppercase tracking-widest shadow-glow flex items-center justify-center text-xl italic gap-2 transition-opacity">
                            {authLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRegistering ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>
                    <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                        {isRegistering ? 'Already have an account? Sign In' : 'New to our apps? Create an account'}
                    </button>
                </div>
            </div>
        )}

        {gameState === 'WIN' && (
            <div className="w-full h-full bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 pointer-events-auto animate-in zoom-in-95 text-center text-white z-[600]">
                <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce mx-auto" />
                <h2 className="text-5xl font-black italic text-white uppercase mb-8 leading-none">STAGE CLEAR!</h2>
                <button onClick={nextLevel} className="w-full max-w-xs bg-white text-black py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform text-xl text-center mx-auto">
                    Next Stage <ArrowRight className="h-6 w-6" />
                </button>
            </div>
        )}

        {gameState === 'REVIVE' && (
            <div className="w-full h-full bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 pointer-events-auto animate-in zoom-in-95 text-center text-white z-[600]">
                <h2 className="text-6xl font-black italic text-white uppercase mb-2 leading-none text-center">GAME OVER</h2>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] mb-12 italic text-center w-full">Score: {score}</p>
                <div className="space-y-4 w-full max-w-xs mx-auto px-6">
                    <button onClick={handleAdRevive} disabled={isAdLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform text-lg italic">
                        {isAdLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Watch Ad to Revive"}
                    </button>
                    <button onClick={() => { setScore(0); setLevel(1); setGameState('HOME'); }} className="w-full border-2 border-white/20 text-white/40 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] pointer-events-auto">Restart Game</button>
                </div>
            </div>
        )}
      </div>

      {/* NAVIGATION BAR */}
      <div className="absolute inset-x-0 bottom-0 z-[1000]">
          <GameUI
            viralCoins={profile?.coin_balance || 0}
            jumpPoints={profile?.jump_balance || 0}
            currentSkin={skin}
            onSkinSelect={(s) => {setSkin(s); engineRef.current?.setSkin(s)}}
            isHidden={gameState === 'PLAYING' && activeTab === 'play'}
            onTabChange={(t) => { setActiveTab(t); if(t !== 'play') setGameState('HOME'); }}
            onOpenShop={() => setGameState('SHOP_DETAILS')}
            onOpenEvent={() => setGameState('TOURNAMENT')}
            requestPayout={requestPayout}
          />
      </div>
    </div>
  )
}
