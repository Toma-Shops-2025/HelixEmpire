import { useState, useEffect } from 'react';
import { Home, ShoppingBag, Award, Box, Coins, Check, LogOut, Trophy, Gift, X, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useBilling, PRODUCT_EMPIRE_PACK, PRODUCT_COINS_1000 } from '@/hooks/use-billing';
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
  const { user, signOut, supabase, addViralCoins } = useAuth();
  const { purchase } = useBilling(addViralCoins);

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const fetchLeaderboard = async () => {
    console.log("Fetching leaderboard...");
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, jump_balance')
            .order('jump_balance', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error fetching leaderboard:", error);
            return;
        }

        if (data) {
            console.log("Leaderboard data received:", data);
            setLeaderboard(data.map(d => ({
                username: d.username || 'Anonymous Player',
                score: Number(d.jump_balance || 0)
            })));
        }
    } catch (err) {
        console.error("Exception in fetchLeaderboard:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'event') {
        fetchLeaderboard();
    }
  }, [activeTab]);

  return (
    <div className="absolute inset-0 flex flex-col justify-end text-white z-[1000] pointer-events-none">
      <main className={cn(
        "absolute inset-0 flex flex-col items-center p-6 transition-all duration-500 overflow-y-auto pt-32 pb-32 pointer-events-auto",
        activeTab === 'play' ? "hidden" : "bg-black/95 backdrop-blur-3xl"
      )}>

        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-center">Skins</h2>
            <div className="grid grid-cols-2 gap-4">
              {SKINS.map(skin => (
                    <button key={skin.id} onClick={() => onSkinSelect(skin.id)} className={cn("p-6 rounded-[32px] border-4 flex flex-col items-center gap-3 relative overflow-hidden", currentSkin === skin.id ? "border-primary bg-primary/20" : "border-white/10 bg-white/5")}>
                        <span className="text-5xl">{skin.emoji}</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">{skin.name}</span>
                        {currentSkin === skin.id && <div className="absolute top-3 right-3 bg-primary rounded-full p-1"><Check className="h-3 w-3" /></div>}
                    </button>
              ))}
            </div>
            {user && <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl mt-4"><LogOut className="h-4 w-4 text-white/40" /><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span></button>}
          </div>
        )}

        {activeTab === 'store' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-yellow-400">Shop</h2>
            <div className="space-y-4">
                <button onClick={() => purchase(PRODUCT_EMPIRE_PACK)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] flex justify-between items-center shadow-xl">
                    <span className="font-black uppercase tracking-tighter text-lg">Empire Pack</span>
                    <span className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs">BUY</span>
                </button>
                <button onClick={() => purchase(PRODUCT_COINS_1000)} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center">
                    <span className="font-black uppercase tracking-tighter text-lg text-left">1,000 ViralCoins</span>
                    <span className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow">$4.99</span>
                </button>
            </div>
            {user && <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl mt-4"><LogOut className="h-4 w-4 text-white/40" /><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span></button>}
          </div>
        )}

        {activeTab === 'event' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12 text-center">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-blue-400 leading-none">Win</h2>
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-[50px] border-4 border-white/10 shadow-2xl">
                <Gift className="h-20 w-20 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic">Redeem Points</h3>
                <button onClick={() => setShowRedeem(true)} className="w-full bg-white text-green-900 py-5 rounded-3xl font-black uppercase tracking-widest mt-8">BROWSE CATALOG</button>
            </div>
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-[50px] border-4 border-white/10 shadow-2xl">
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic">Leaderboard</h3>
                <div className="bg-black/40 rounded-3xl p-4 mt-4 space-y-2">
                    {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl">
                            <span className="text-[10px] font-black">{i+1}. {entry.username}</span>
                            <span className="text-[10px] font-bold text-yellow-400">{entry.score.toLocaleString()} JP</span>
                        </div>
                    )) : <p className="text-[10px] opacity-40 py-4">Loading Masters...</p>}
                </div>
                <button onClick={() => fetchLeaderboard()} className="w-full bg-primary py-5 rounded-3xl font-black uppercase tracking-widest mt-8">REFRESH</button>
            </div>
            {user && <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl mt-4"><LogOut className="h-4 w-4 text-white/40" /><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span></button>}
          </div>
        )}
      </main>

      <nav className={cn(
        "bg-black/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 py-4 pb-8 pointer-events-auto transition-transform duration-500",
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

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90", active ? "text-primary" : "text-white/30")}>
      <div className={cn("px-5 py-1.5 rounded-2xl transition-all", active ? "bg-primary/10" : "")}><Icon className="h-6 w-6" /></div>
      <span className={cn("text-[10px] font-black uppercase tracking-tighter", active ? "opacity-100" : "opacity-40")}>{label}</span>
    </button>
  );
}
