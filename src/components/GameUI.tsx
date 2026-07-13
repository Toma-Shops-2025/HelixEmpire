import { useState, useEffect } from 'react';
import { Home, ShoppingBag, Award, Box, Coins, Check, LogOut, Trophy, Gift, X, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

type Tab = 'play' | 'inventory' | 'store' | 'event';

const SKINS = [
  { id: 'fire', name: 'Viral Spark', emoji: '🔥', price: 0 },
  { id: 'gold', name: 'Liquid Gold', emoji: '📀', price: 0 },
  { id: 'glass', name: 'Neon Phantom', emoji: '🔮', price: 0 },
  { id: 'yellow', name: 'TomaBox', emoji: '🛍️', price: 0 },
  { id: 'crown', name: 'Grand Crown', emoji: '👑', price: 0 },
];

export function GameUI({ viralCoins = 0, jumpPoints = 0, currentSkin = 'fire', onSkinSelect, isHidden = false, onTabChange, requestPayout }) {
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [showRedeem, setShowRedeem] = useState(false);
  const [shopDetailType, setShopDetailType] = useState<'pack' | 'coins' | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{username: string, score: number}[]>([]);
  const { user, signOut, supabase } = useAuth();

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
        .from('profiles')
        .select('username, jump_balance')
        .order('jump_balance', { ascending: false })
        .limit(10);

    if (data) {
        setLeaderboard(data.map(d => ({
            username: d.username || 'Anonymous Player',
            score: Number(d.jump_balance)
        })));
    }
  };

  const openTournament = () => {
      fetchLeaderboard();
      setShowEventDetail(true);
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end text-white z-[1000]">

      {/* Content Area (Menus) */}
      <main className={cn(
        "absolute inset-0 flex flex-col items-center p-6 transition-all duration-500 overflow-y-auto pt-32 pb-32",
        activeTab === 'play' ? "opacity-0 pointer-events-none" : "opacity-100 bg-black/95 backdrop-blur-3xl pointer-events-auto"
      )}>

        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Skins</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {SKINS.map(skin => (
                    <button
                        key={skin.id}
                        onClick={() => onSkinSelect(skin.id)}
                        className={cn(
                            "p-6 rounded-[32px] border-4 transition-all active:scale-95 flex flex-col items-center gap-3 relative overflow-hidden group",
                            currentSkin === skin.id ? "border-primary bg-primary/20 shadow-glow" : "border-white/10 bg-white/5"
                        )}
                    >
                        <span className="text-5xl group-hover:scale-110 transition-transform">{skin.emoji}</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">{skin.name}</span>
                        {currentSkin === skin.id && <div className="absolute top-3 right-3 bg-primary rounded-full p-1 shadow-lg"><Check className="h-3 w-3" /></div>}
                    </button>
              ))}
            </div>
            {user && (
              <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl active:bg-red-500/20 active:border-red-500/40 transition-all group mt-4">
                <LogOut className="h-4 w-4 text-white/40 group-hover:text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'store' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-yellow-400">Shop</h2>
            </div>
            <div className="space-y-4">
                <button onClick={() => setShopDetailType('pack')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] border-b-8 border-black/30 flex justify-between items-center shadow-xl active:scale-95 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">💎</div>
                        <div className="flex flex-col text-left">
                            <span className="font-black uppercase tracking-tighter text-lg leading-none">Empire Pack</span>
                            <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-1">No Ads + Pro Status</span>
                        </div>
                    </div>
                    <div className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs shadow-lg">UPGRADE</div>
                </button>

                <button onClick={() => setShopDetailType('coins')} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center active:scale-95 transition-all">
                    <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 bg-yellow-400/20 rounded-2xl flex items-center justify-center">
                            <Coins className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black uppercase tracking-tighter leading-none text-lg">1,000 ViralCoins</span>
                            <span className="text-[9px] font-bold opacity-40 uppercase mt-1">Shared Currency</span>
                        </div>
                    </div>
                    <div className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow">$4.99</div>
                </button>
            </div>
            {user && (
              <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl active:bg-red-500/20 active:border-red-500/40 transition-all group mt-4">
                <LogOut className="h-4 w-4 text-white/40 group-hover:text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'event' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12 text-center">
             <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-blue-400 leading-none">Win</h2>
            </div>

            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-[50px] border-4 border-white/10 text-center shadow-2xl relative overflow-hidden group">
                <Gift className="h-20 w-20 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Redeem Points</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-8">Trade JumpPoints for Rewards</p>
                <button onClick={() => setShowRedeem(true)} className="w-full bg-white text-green-900 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">BROWSE CATALOG</button>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-[50px] border-4 border-white/10 text-center shadow-2xl relative overflow-hidden group">
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Tournaments</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-8">Top the leaderboard to win VC</p>
                <button onClick={openTournament} className="w-full bg-white text-indigo-900 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">ENTER EVENT</button>
            </div>

            {user && (
              <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl active:bg-red-500/20 active:border-red-500/40 transition-all group mt-4">
                <LogOut className="h-4 w-4 text-white/40 group-hover:text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* OVERLAY: REDEMPTION */}
      {showRedeem && (
        <div className="fixed inset-0 z-[2000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in zoom-in-95">
            <button onClick={() => setShowRedeem(false)} className="absolute top-12 right-8 text-white/40 p-2 hover:text-white"><X className="h-10 w-10" /></button>
            <div className="w-full max-w-sm space-y-8 overflow-y-auto max-h-[80vh] px-2">
                <div className="text-center space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Redeem JP</h2>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Available: <span className="text-green-400">{jumpPoints.toLocaleString()} JP</span></p>
                </div>
                <div className="space-y-4">
                    <PayoutOption icon="💳" name="PayPal Cashout" req="500,000 JP" current={jumpPoints} val="$5.00" onClaim={() => requestPayout('PayPal $5', 500000)} />
                    <PayoutOption icon="🛒" name="Amazon Gift Card" req="250,000 JP" current={jumpPoints} val="$2.00" onClaim={() => requestPayout('Amazon $2', 250000)} />
                    <PayoutOption icon="📱" name="Google Play" req="250,000 JP" current={jumpPoints} val="$2.00" onClaim={() => requestPayout('Google Play $2', 250000)} />
                    <PayoutOption icon="🍎" name="Apple Gift Card" req="500,000 JP" current={jumpPoints} val="$5.00" onClaim={() => requestPayout('Apple $5', 500000)} />
                </div>
                <Link to="/how-to-redeem" onClick={() => setShowRedeem(false)} className="text-center block w-full text-[10px] font-black uppercase tracking-widest text-primary underline py-4">How it works & Rules</Link>
            </div>
        </div>
      )}

      {/* OVERLAY: SHOP DETAIL */}
      {shopDetailType && (
        <div className="fixed inset-0 z-[2000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in slide-in-from-bottom-10">
            <button onClick={() => setShopDetailType(null)} className="absolute top-12 right-8 text-white/40 p-2 hover:text-white"><X className="h-10 w-10" /></button>
            <div className="w-full max-w-sm space-y-10 text-center">
                <div className={cn(
                    "h-32 w-32 rounded-[40px] flex items-center justify-center mx-auto ring-4",
                    shopDetailType === 'pack' ? "bg-blue-600/20 ring-blue-600/40" : "bg-yellow-400/20 ring-yellow-400/40"
                )}>
                    {shopDetailType === 'pack' ? <Diamond className="h-16 w-16 text-blue-400" /> : <Coins className="h-16 w-16 text-yellow-400" />}
                </div>
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
                    {shopDetailType === 'pack' ? 'Empire Pack' : '1,000 ViralCoins'}
                </h2>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-4 leading-relaxed">
                    {shopDetailType === 'pack'
                        ? 'Ad-Free Gaming + Pro status in all Empire Network apps + Exclusive Skins.'
                        : 'Get 1,000 ViralCoins to spend across the entire Empire Network ecosystem.'}
                </p>
                <button onClick={() => toast.info("Google Play Billing starting...")} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xl shadow-2xl active:scale-95 transition-all">
                    {shopDetailType === 'pack' ? 'SUBSCRIBE NOW' : 'BUY FOR $4.99'}
                </button>
            </div>
        </div>
      )}

      {/* OVERLAY: EVENT DETAIL & LEADERBOARD */}
      {showEventDetail && (
        <div className="fixed inset-0 z-[2000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in zoom-in-95">
            <button onClick={() => setShowEventDetail(false)} className="absolute top-12 right-8 text-white/40 p-2 hover:text-white"><X className="h-10 w-10" /></button>
            <div className="w-full max-w-sm space-y-6 text-center">
                <div className="space-y-2">
                    <Trophy className="h-20 w-20 text-yellow-400 mx-auto animate-bounce" />
                    <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">Masters</h2>
                    <p className="text-[10px] font-black uppercase text-white/40">Current Prize: <span className="text-yellow-400">5,000 VC</span></p>
                </div>

                <div className="bg-white/5 border-2 border-white/10 rounded-[40px] p-2 space-y-1 overflow-hidden">
                    {leaderboard.length > 0 ? (
                        leaderboard.map((entry, i) => (
                            <div key={i} className={cn(
                                "flex items-center justify-between px-6 py-3 rounded-[30px]",
                                i === 0 ? "bg-yellow-400 text-black shadow-lg" : "bg-white/5"
                            )}>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-xs opacity-40">{i+1}</span>
                                    <span className="font-black uppercase text-[10px] truncate max-w-[120px]">{entry.username}</span>
                                </div>
                                <span className="font-black italic text-xs">{entry.score.toLocaleString()} JP</span>
                            </div>
                        ))
                    ) : (
                        <p className="py-12 text-[10px] font-black uppercase opacity-20">Loading Masters...</p>
                    )}
                </div>

                <button onClick={() => toast.success("You are competing!")} className="w-full bg-primary py-6 rounded-3xl font-black uppercase text-xl shadow-glow active:scale-95 transition-all">JOIN TOURNAMENT</button>
            </div>
        </div>
      )}

      {/* PLAY STORE STANDARD BOTTOM NAVIGATION */}
      <nav className={cn(
        "bg-black/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 py-4 pb-8 pointer-events-auto transition-transform duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
        isHidden && activeTab === 'play' ? "translate-y-full" : "translate-y-0"
      )}>
        <NavButton icon={Home} label="Play" active={activeTab === 'play'} onClick={() => handleTab('play')} />
        <NavButton icon={Box} label="Skins" active={activeTab === 'inventory'} onClick={() => handleTab('inventory')} />
        <NavButton icon={ShoppingBag} label="Shop" active={activeTab === 'store'} onClick={() => handleTab('store')} />
        <NavButton icon={Award} label="Win" active={activeTab === 'event'} onClick={() => handleTab('event')} />
      </nav>
    </div>
  );
}

function PayoutOption({ icon, name, req, current, val, onClaim }) {
    const rawReq = parseInt(req.replace(/,/g, ''));
    const isLocked = current < rawReq;

    return (
        <div className="bg-white/5 border-2 border-white/10 rounded-[35px] p-5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <span className="text-3xl">{icon}</span>
                <div className="flex flex-col">
                    <span className="font-black uppercase tracking-tighter text-sm leading-none">{name}</span>
                    <span className="text-[9px] font-bold opacity-40 uppercase mt-1">{req}</span>
                </div>
            </div>
            <button
                onClick={() => isLocked ? toast.error(`Keep playing! You need ${req} for this reward.`) : onClaim()}
                className={cn(
                    "px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg",
                    isLocked ? "bg-white/10 text-white/20" : "bg-green-500 text-white shadow-green-500/20"
                )}
            >
                {isLocked ? 'Locked' : `Claim ${val}`}
            </button>
        </div>
    )
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90",
        active ? "text-primary" : "text-white/30"
      )}
    >
      <div className={cn(
          "px-5 py-1.5 rounded-2xl transition-all",
          active ? "bg-primary/10" : ""
      )}>
        <Icon className={cn("h-6 w-6", active ? "stroke-[3px]" : "stroke-[2px]")} />
      </div>
      <span className={cn(
          "text-[10px] font-black uppercase tracking-tighter",
          active ? "opacity-100" : "opacity-40"
      )}>{label}</span>
    </button>
  );
}
