import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HelixEngine, type BallSkin } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { GameOnboarding } from '@/components/GameOnboarding'
import { toast } from 'sonner'
import { AdMob, RewardAdPluginEvents, type AdMobRewardItem } from '@capacitor-community/admob'
import { Trophy, Coins, ArrowRight, Loader2, LogIn, Award, X, UserPlus, CheckSquare, Square, Diamond } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const { user, profile, loading, signIn, signUp, addViralCoins } = useAuth()

  const [skin, setSkin] = useState<BallSkin>('fire')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN' | 'AUTH' | 'SHOP_DETAILS' | 'TOURNAMENT'>('HOME')
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event'>('play')
  const [isAdLoading, setIsAdLoading] = useState(false)
  const [jumpPoints, setJumpPoints] = useState(0)

  // Auth form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const REWARDED_AD_ID = 'ca-app-pub-7552743356249250/1147502657'
  const INTERSTITIAL_AD_ID = 'ca-app-pub-7552743356249250/9029897490'

  useEffect(() => {
    AdMob.initialize({ requestTrackingAuthorization: true }).catch(console.error)
    AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      isGameOver: false,
      onWin: () => setGameState('WIN'),
      onLoss: () => {
        setGameState('REVIVE')
        AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_ID }).catch(() => {})
      },
      onScoreUpdate: (pts) => setScore(prev => prev + pts)
    })

    engineRef.current = engine
    return () => engine.dispose()
  }, [])

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
            toast.success("Account created!")
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
    }
  }

  const nextLevel = async () => {
    if (level % 3 === 0) AdMob.showInterstitial().catch(() => {});
    const bonus = 100 + (level * 10);
    const vcBonus = level % 5 === 0 ? 50 : 0;
    setJumpPoints(prev => prev + bonus)
    if(vcBonus > 0 && user) await addViralCoins(vcBonus)
    setLevel(prev => prev + 1)
    setGameState('PLAYING')
  }

  const handleAdRevive = async () => {
    try {
      setIsAdLoading(true)
      const listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        setGameState('PLAYING')
        engineRef.current?.revive()
        setIsAdLoading(false)
        listener.remove()
      })
      await AdMob.showRewardVideoAd()
    } catch (e) {
      toast.error("Ad not ready.")
      setIsAdLoading(false)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none touch-none font-sans text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <GameOnboarding onComplete={() => setGameState('HOME')} />

      {/* PERSISTENT TOP HUD */}
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
              <span className="text-sm font-black leading-none text-green-400">{jumpPoints.toLocaleString()} JP</span>
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
      <div className="absolute inset-0 z-[100] pointer-events-none">
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
                            Sign In / Sign Up to Sync
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* SHOP MODAL */}
        {gameState === 'SHOP_DETAILS' && (
             <div className="w-full h-full bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in slide-in-from-bottom-10">
                <button onClick={() => setGameState('HOME')} className="absolute top-12 right-8 text-white/40 p-2"><X className="h-8 w-8" /></button>
                <div className="w-full max-w-sm space-y-8 text-center">
                    <div className="h-32 w-32 bg-blue-600/20 rounded-[40px] flex items-center justify-center mx-auto ring-4 ring-blue-600/40">
                        <Diamond className="h-16 w-16 text-blue-400" />
                    </div>
                    <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">Empire Pack</h2>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Ad-Free Gaming + Pro status in all Empire Network apps.</p>
                    <button className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xl shadow-2xl">SUBSCRIBE NOW</button>
                </div>
             </div>
        )}

        {/* TOURNAMENT MODAL */}
        {gameState === 'TOURNAMENT' && (
             <div className="w-full h-full bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in zoom-in-95">
                <button onClick={() => setGameState('HOME')} className="absolute top-12 right-8 text-white/40 p-2"><X className="h-8 w-8" /></button>
                <div className="w-full max-w-sm space-y-8 text-center">
                    <Trophy className="h-32 w-32 text-yellow-400 mx-auto animate-bounce" />
                    <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">Tournament</h2>
                    <div className="bg-white/5 border-2 border-white/10 p-6 rounded-[40px] space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/40">Prize Pool</p>
                        <p className="text-4xl font-black text-yellow-400 tracking-tighter">5,000 VC</p>
                    </div>
                    <button className="w-full bg-primary py-6 rounded-3xl font-black uppercase text-xl shadow-glow">JOIN EVENT</button>
                </div>
             </div>
        )}
        {/* ... (Win & Revive modals same as before) ... */}
        {gameState === 'AUTH' && (
            <div className="w-full h-full bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 pointer-events-auto">
                <div className="w-full max-w-xs space-y-8 relative">
                    <button onClick={() => setGameState('HOME')} className="absolute -top-12 -right-4 text-white/40 p-2 hover:text-white"><X className="h-8 w-8" /></button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">{isRegistering ? 'Join Empire' : 'Empire Login'}</h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 text-center">Shared Network Account</p>
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
                        <button type="submit" disabled={authLoading} className="w-full bg-primary py-6 rounded-3xl text-white font-black uppercase tracking-widest shadow-glow flex items-center justify-center text-xl italic gap-2 transition-opacity disabled:opacity-50">
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
            <div className="w-full h-full bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 pointer-events-auto animate-in zoom-in-95 text-center text-white">
                <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce mx-auto" />
                <h2 className="text-5xl font-black italic text-white uppercase mb-8 leading-none">STAGE CLEAR!</h2>
                <button onClick={nextLevel} className="w-full max-w-xs bg-white text-black py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform text-xl">
                    Next Stage <ArrowRight className="h-6 w-6" />
                </button>
            </div>
        )}

        {gameState === 'REVIVE' && (
            <div className="w-full h-full bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 pointer-events-auto animate-in zoom-in-95 text-center text-white">
                <h2 className="text-6xl font-black italic text-white uppercase mb-2 leading-none text-center">GAME OVER</h2>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] mb-12 italic text-center w-full">Score: {score}</p>
                <div className="space-y-4 w-full max-w-xs mx-auto">
                    <button onClick={handleAdRevive} disabled={isAdLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform text-lg italic">
                        {isAdLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Watch Ad to Revive"}
                    </button>
                    <button onClick={() => { setGameState('HOME'); }} className="w-full border-2 border-white/20 text-white/40 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px]">Restart Game</button>
                </div>
            </div>
        )}
      </div>

      <GameUI
        viralCoins={profile?.coin_balance || 0}
        jumpPoints={jumpPoints}
        currentSkin={skin}
        onSkinSelect={(s) => {setSkin(s); engineRef.current?.setSkin(s)}}
        isHidden={gameState === 'PLAYING'}
        onTabChange={(t) => { setActiveTab(t); if(t !== 'play') setGameState('HOME'); }}
        onOpenShop={() => setGameState('SHOP_DETAILS')}
        onOpenEvent={() => setGameState('TOURNAMENT')}
      />
    </div>
  )
}
// LIVE DEPLOY: 2026-07-06 20:35:26
