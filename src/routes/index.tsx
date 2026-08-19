import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { Capacitor } from '@capacitor/core'
import { initAds, showRewardedAd, showInterstitial, setBannerVisible } from '@/lib/ads'
import { useBilling, PRODUCT_EMPIRE_PACK, PRODUCT_COINS_1000 } from '@/hooks/use-billing'
import { Coins, Zap, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Sparkles, Trophy, Box, ShoppingBag, Award, Home } from 'lucide-react'
import { toast } from 'sonner'
import { CONFIG } from '@/config'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function AppBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/bg-helix.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-black/55" />
    </div>
  )
}

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, signIn, signInWithGoogle, signUp, addJumpPoints, addViralCoins, deleteAccount, loading } = useAuth()
  const { purchase, isReady: billingReady } = useBilling(addViralCoins)

  // Master State
  const [activeTab, setActiveTab] = useState<'play' | 'inventory' | 'store' | 'event'>('play')
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [level, setLevel] = useState(1)
  const [currentSkin, setCurrentSkin] = useState('fire')
  const [isProcessing, setIsProcessing] = useState(false)
  const [gamesCount, setGamesCount] = useState(0)
  const lobbyBgmRef = useRef<HTMLAudioElement | null>(null)

  const isPlaying = gameState === 'PLAYING';
  const hideNav = activeTab === 'play' && (gameState === 'PLAYING' || gameState === 'REVIVE');

  const returnToHome = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.setPaused(true);
      engineRef.current.setupLevel(level);
    }
    scoreRef.current = 0;
    setScore(0);
    setGameState('HOME');
    setIsProcessing(false);
    if (lobbyBgmRef.current) {
      lobbyBgmRef.current.play().catch(() => undefined);
    }
  }, [level]);

  // Lobby music on open (game music starts when you tap PLAY)
  useEffect(() => {
    if (!user) return;

    const startLobbyBgm = () => {
      if (!lobbyBgmRef.current) {
        lobbyBgmRef.current = new Audio('/audio/promo.MP3');
        lobbyBgmRef.current.loop = true;
        lobbyBgmRef.current.volume = 0.15;
      }
      if (gameState === 'HOME') {
        lobbyBgmRef.current.play().catch(() => undefined);
      } else {
        lobbyBgmRef.current.pause();
      }
    };

    startLobbyBgm();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && gameState === 'HOME') startLobbyBgm();
    };
    window.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('visibilitychange', onVisible);
      if (lobbyBgmRef.current) {
        lobbyBgmRef.current.pause();
        lobbyBgmRef.current = null;
      }
    };
  }, [user, gameState]);

  // Always land on the HOME menu when opening the app
  useEffect(() => {
    if (!user) return;
    setGameState('HOME');
    setScore(0);
  }, [user?.id]);

  // Initialize Ads
  useEffect(() => {
    initAds();
  }, []);

  // Show banner on Play tab only (Unity banner sits at screen bottom)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (user && activeTab === 'play') {
      setBannerVisible(true)
    } else {
      setBannerVisible(false)
    }
  }, [user, activeTab])

  const checkInterstitial = useCallback(() => {
    setGamesCount(prev => {
        const next = prev + 1;
        if (next % 3 === 0) {
            showInterstitial();
        }
        return next;
    });
  }, []);

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
        setGameState('HOME');
        return;
    }

    if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
    }

    const engine = new HelixEngine(containerRef.current, {
          score: 0,
          level: level,
          onWin: async () => {
              setGameState('WIN');
              audioRef.current?.pause();
              await addJumpPoints(scoreRef.current);
              await addViralCoins(50);
              checkInterstitial();
          },
          onLoss: () => {
              setGameState('REVIVE');
              audioRef.current?.pause();
              checkInterstitial();
          },
          onScoreUpdate: (pts) => {
            setScore(prev => {
              const next = prev + pts;
              scoreRef.current = next;
              return next;
            });
          }
        })

        engineRef.current = engine
        engine.setSkin(currentSkin);
        engine.setupLevel(level);

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [user, activeTab, level, currentSkin, addJumpPoints, addViralCoins, checkInterstitial]);

  const startGame = () => {
    if (lobbyBgmRef.current) {
      lobbyBgmRef.current.pause();
    }
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const randomTrack = Math.floor(Math.random() * 15) + 1;
    const audio = new Audio(`music/tier${randomTrack}.MP3`);
    audio.loop = true;
    audioRef.current = audio;

    scoreRef.current = 0;
    setScore(0);
    setGameState('PLAYING');

    if (engineRef.current) {
        engineRef.current.reset();
        engineRef.current.start();
    }
    audio.play().catch(() => {});
  }

  const handleReviveRequest = async () => {
      if (isProcessing) return;
      setIsProcessing(true);

      toast.info("Loading recovery ad...");
      const ad = await showRewardedAd();

      if (ad.success) {
          handleReviveSuccess();
          toast.success("REVIVED!", { description: "Keep descending!" });
      } else {
          setIsProcessing(false);
          toast.error("Network Busy", { description: "Try again in a moment." });
      }
  }

  if (loading) return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
          <AppBackground />
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin z-10" />
      </div>
  )

  if (!user) return <AuthUI onLogin={signIn} onGoogle={signInWithGoogle} onSignUp={signUp} />

  return (
    <div className="h-screen w-full bg-black text-white relative overflow-hidden font-sans">
      <AppBackground />
      {/* 3D Container - Behind UI */}
      <div
        ref={containerRef}
        className={cn(
            "absolute inset-0 z-[1] transition-opacity duration-500",
            activeTab === 'play' ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Overlay layers */}
      {activeTab === 'play' && (
          <GameUI
            state={gameState}
            score={score}
            level={level}
            viralCoins={profile?.coin_balance ?? 0}
            jumpPoints={profile?.jump_balance ?? 0}
            onStart={startGame}
            onRevive={handleReviveRequest}
            onNext={() => {
                setLevel(prev => prev + 1);
                setGameState('HOME');
            }}
            onQuit={returnToHome}
            isProcessing={isProcessing}
          />
      )}

      {activeTab === 'inventory' && <InventoryUI current={currentSkin} onSelect={setCurrentSkin} profile={profile} />}
      {activeTab === 'store' && <StoreUI profile={profile} onPurchase={purchase} billingReady={billingReady} />}
      {activeTab === 'event' && <LeaderboardUI profile={profile} onEnterEvent={() => { toast.info('Reach Stage 100 to qualify!'); setActiveTab('play'); }} onDeleteAccount={deleteAccount} />}

      {!hideNav && (
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[9000] pointer-events-auto">
        <nav className="bg-black/80 backdrop-blur-3xl border-2 border-white/5 h-24 rounded-[40px] flex justify-around items-center px-6 shadow-2xl shadow-black">
            <NavButton icon={Home} label="PLAY" active={activeTab === 'play'} onClick={() => setActiveTab('play')} />
            <NavButton icon={Box} label="SKINS" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <NavButton icon={ShoppingBag} label="SHOP" active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
            <NavButton icon={Award} label="WIN" active={activeTab === 'event'} onClick={() => setActiveTab('event')} />
        </nav>
      </div>
      )}
    </div>
  )
}

function NavButton({ icon: Icon, label, active, onClick }: any) {
    return (
        <button type="button" onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-all flex-1 h-full justify-center relative z-10", active ? "text-white" : "text-white/20")}>
            {active && (
                <div className="absolute inset-x-2 inset-y-2 bg-white rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-xl">
                    <div className="flex flex-col items-center gap-0.5">
                        <Icon className="h-5 w-5 text-black fill-current" />
                        <span className="text-[7px] font-black uppercase text-black tracking-tighter">{label}</span>
                    </div>
                </div>
            )}
            {!active && (
                <>
                    <Icon className="h-5 w-5 mb-0.5" />
                    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
                </>
            )}
        </button>
    )
}

function AuthUI({ onLogin, onGoogle, onSignUp }: any) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')

    return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8 text-white relative">
            <AppBackground />

            <div className="relative z-10 text-center mb-12 animate-in slide-in-from-top duration-700">
                <h1 className="text-7xl font-black italic mb-2 tracking-tighter uppercase leading-[0.8]">
                    Helix<br/><span className="text-orange-600">Empire</span>
                </h1>
                <p className="text-orange-600/60 uppercase tracking-[0.4em] text-[10px] font-black italic mt-4 underline decoration-2 underline-offset-8">Ascend the Throne</p>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    isLogin ? onLogin(email, password) : onSignUp(email, password, username);
                }}
                className="w-full max-w-sm space-y-3 relative z-10"
            >
                {!isLogin && (
                    <div className="bg-white/5 border border-white/5 rounded-3xl flex items-center px-5 py-5 backdrop-blur-md shadow-xl">
                        <UserIcon className="h-5 w-5 text-white/20 mr-4" />
                        <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-black uppercase text-sm text-white placeholder:text-white/10" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                )}
                <div className="bg-white/5 border border-white/5 rounded-3xl flex items-center px-5 py-5 backdrop-blur-md shadow-xl">
                    <Mail className="h-5 w-5 text-white/20 mr-4" />
                    <input type="email" placeholder="Email Address" className="bg-transparent outline-none w-full font-black uppercase text-sm text-white placeholder:text-white/10" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl flex items-center px-5 py-5 backdrop-blur-md shadow-xl">
                    <Lock className="h-5 w-5 text-white/20 mr-4" />
                    <input type="password" placeholder="Password" className="bg-transparent outline-none w-full font-black uppercase text-sm text-white placeholder:text-white/10" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <div className="pt-4">
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white py-6 rounded-[35px] font-black uppercase text-xl italic shadow-2xl active:scale-95 transition-all tracking-tighter">
                        {isLogin ? 'Enter Arena' : 'Join Empire'}
                    </button>
                </div>

                <div className="relative py-6 flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">Secure Access</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-4 underline tracking-[0.2em] italic"
                >
                    {isLogin ? "Need an account? Sign Up" : "Back to Login"}
                </button>

                <p className="text-center text-[10px] text-white/30 mt-6 leading-relaxed">
                    By continuing you agree to our{" "}
                    <a href={CONFIG.PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">Privacy Policy</a>
                    {" "}and{" "}
                    <a href={CONFIG.TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">Terms</a>.
                </p>
            </form>
        </div>
    )
}

function InventoryUI({ current, onSelect, profile }: any) {
    const SKINS = [
        { id: 'fire', name: 'Viral Spark', cost: 0, color: 'bg-orange-600', icon: '🔥' },
        { id: 'gold', name: 'Liquid Gold', cost: 250, color: 'bg-yellow-500', icon: '📀' },
        { id: 'ice', name: 'Neon Phantom', cost: 500, color: 'bg-blue-400', icon: '🔮' },
        { id: 'toxic', name: 'Tomabox', cost: 1000, color: 'bg-lime-500', icon: '🛍️' },
    ]

    return (
        <div className="h-full w-full pt-20 px-6 overflow-y-auto pb-64 no-scrollbar relative">
            <AppBackground />
            <div className="relative z-10">
                <h2 className="text-5xl font-black italic uppercase mb-2 text-center">Inventory</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 text-center mb-12 italic">1/5 Unlocked</p>
                <div className="grid grid-cols-2 gap-4 pb-20">
                    {SKINS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => onSelect(s.id)}
                            className={cn(
                                "p-8 rounded-[40px] border-4 transition-all flex flex-col items-center gap-4 relative overflow-hidden",
                                current === s.id ? "border-orange-600 bg-orange-600/10" : "border-white/5 bg-white/5 opacity-40"
                            )}
                        >
                            {current === s.id && <div className="absolute top-4 right-4 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>}
                            <div className="text-4xl mb-2">{s.icon}</div>
                            <div className="flex flex-col items-center">
                                <span className="font-black uppercase text-[10px] tracking-tight text-white mb-1">{s.name}</span>
                                {s.cost > 0 && <span className="text-[8px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1"><Zap className="h-2 w-2" /> {s.cost} VC</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StoreUI({ profile, onPurchase, billingReady }: { profile: any; onPurchase: (id: string) => void; billingReady: boolean }) {
    return (
        <div className="h-full w-full pt-20 px-6 overflow-y-auto pb-64 no-scrollbar relative">
            <AppBackground />
            <div className="relative z-10">
                <h2 className="text-5xl font-black italic uppercase mb-2 text-center text-white">Empire Shop</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 text-center mb-12 italic">Official Premium Store</p>

                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-900 p-10 rounded-[50px] flex items-center justify-between shadow-2xl relative overflow-hidden border border-white/10">
                       <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                       <div className="flex items-center gap-6 relative z-10 text-left">
                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                <Sparkles className="h-8 w-8 text-blue-300" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black uppercase italic leading-none">Empire<br/>Pack</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest mt-2 opacity-60">No Ads + All Apps Pro</span>
                            </div>
                       </div>
                       <button
                         type="button"
                         onClick={() => onPurchase(PRODUCT_EMPIRE_PACK)}
                         disabled={!billingReady}
                         className="bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                       >
                         Upgrade
                       </button>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-10 rounded-[50px] flex items-center justify-between shadow-xl backdrop-blur-xl">
                       <div className="flex items-center gap-6 text-left">
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-3xl flex items-center justify-center border border-yellow-500/20">
                                <div className="w-8 h-8 rounded-full border-4 border-yellow-500 flex items-center justify-center text-[10px] font-black text-yellow-500">VC</div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black uppercase italic leading-none">1,000<br/>ViralCoins</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest mt-2 opacity-30">Global Shared Currency</span>
                            </div>
                       </div>
                       <button
                         type="button"
                         onClick={() => onPurchase(PRODUCT_COINS_1000)}
                         disabled={!billingReady}
                         className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                       >
                         $4.99
                       </button>
                    </div>
                </div>

                <p className="text-center text-[7px] font-black uppercase tracking-[0.5em] text-white/10 mt-12">Transactions secured by Google Play</p>
            </div>
        </div>
    )
}

function LeaderboardUI({ profile, onEnterEvent, onDeleteAccount }: { profile: any; onEnterEvent: () => void; onDeleteAccount: () => Promise<void> }) {
    const { signOut } = useAuth()
    const handleDelete = async () => {
        if (!confirm("Permanently delete your account and all Helix Empire data? This cannot be undone.")) return;
        try {
            await onDeleteAccount();
            toast.success("Account deleted");
        } catch (e: any) {
            toast.error(e.message || "Could not delete account");
        }
    }
    return (
        <div className="h-full w-full pt-20 px-6 overflow-y-auto pb-64 no-scrollbar relative">
            <AppBackground />
            <div className="relative z-10">
                <h2 className="text-5xl font-black italic uppercase mb-2 text-center text-white">Challenges</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 text-center mb-12 flex items-center justify-center gap-2 italic">
                    <Zap className="h-3 w-3 fill-current" /> Live Server Hub
                </p>

                <div className="bg-gradient-to-br from-purple-700 to-indigo-950 p-12 rounded-[60px] shadow-2xl relative overflow-hidden text-center border border-white/5">
                    <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-8 opacity-90 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                    <h3 className="text-3xl font-black italic uppercase mb-1">Grand Masters</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-10 leading-none italic">Reach Stage 100 to win 5,000 ViralCoins</p>

                    <button type="button" onClick={onEnterEvent} className="w-full bg-white text-black py-6 rounded-[30px] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all">Enter Event</button>
                </div>

                <div className="mt-20 flex flex-col items-center gap-6 text-center pb-20">
                    <button type="button" onClick={handleDelete} className="text-red-500/20 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-100 transition-opacity underline italic">Delete Account</button>
                    <button onClick={signOut} className="mt-4 text-white/20 text-[10px] font-black uppercase tracking-[0.2em] italic">Sign Out</button>
                </div>
            </div>
        </div>
    )
}
