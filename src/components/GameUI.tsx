import { ShoppingBag, Award, Box, Check, Trophy, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useBilling, PRODUCT_EMPIRE_PACK, PRODUCT_COINS_1000 } from '@/hooks/use-billing';
import { useEffect, useState } from 'react';

const SKINS = [
  { id: 'fire', name: 'Viral Spark', emoji: '🔥' },
  { id: 'gold', name: 'Liquid Gold', emoji: '📀' },
  { id: 'glass', name: 'Neon Phantom', emoji: '🔮' },
  { id: 'yellow', name: 'TomaBox', emoji: '🛍️' },
  { id: 'crown', name: 'Grand Crown', emoji: '👑' },
];

export function GameUI({
  activeTab,
  setActiveTab,
  currentSkin,
  setCurrentSkin,
  onSkinSelect,
  isHidden
}) {
  const { user, signOut, supabase, addViralCoins, profile } = useAuth();
  const { purchase } = useBilling(addViralCoins);
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
        .from('profiles')
        .select('username, jump_balance')
        .order('jump_balance', { ascending: false })
        .limit(10);
    if (data) setLeaderboard(data);
  };

  useEffect(() => {
    if (activeTab === 'event') fetchLeaderboard();
  }, [activeTab]);

  return (
    <div className="absolute inset-0 flex flex-col justify-end text-white z-[2500] pointer-events-none">

      {/* Dynamic Content Layer */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center p-6 pt-32 pb-32 transition-all duration-500 overflow-y-auto pointer-events-auto",
        activeTab === 'play' ? "translate-y-full opacity-0 invisible" : "translate-y-0 opacity-100 visible bg-black/95 backdrop-blur-3xl"
      )}>

        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8">
            <h2 className="text-5xl font-black italic text-center uppercase tracking-tighter">Skins</h2>
            <div className="grid grid-cols-2 gap-4">
              {SKINS.map(skin => (
                <button key={skin.id} onClick={() => { onSkinSelect(skin.id); setCurrentSkin(skin.id); }} className={cn("p-6 rounded-[32px] border-4 flex flex-col items-center gap-3 relative active:scale-95 transition-all", currentSkin === skin.id ? "border-primary bg-primary/20" : "border-white/10 bg-white/5")}>
                    <span className="text-5xl">{skin.emoji}</span>
                    <span className="font-black uppercase text-[10px] tracking-widest">{skin.name}</span>
                    {currentSkin === skin.id && <div className="absolute top-3 right-3 bg-primary rounded-full p-1"><Check className="h-3 w-3" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-5xl font-black italic text-yellow-400 uppercase tracking-tighter">Shop</h2>
            <div className="space-y-4">
                <button onClick={() => purchase(PRODUCT_EMPIRE_PACK)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] flex justify-between items-center shadow-xl active:scale-95 transition-all">
                    <span className="font-black uppercase text-lg text-white">Empire Pack</span>
                    <span className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs">BUY</span>
                </button>
                <button onClick={() => purchase(PRODUCT_COINS_1000)} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center active:scale-95 transition-all">
                    <span className="font-black uppercase text-lg text-left">1,000 Coins</span>
                    <span className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow">$4.99</span>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'event' && (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-5xl font-black italic text-blue-400 uppercase tracking-tighter">Win</h2>
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-[50px] border-4 border-white/10 mb-8 shadow-2xl">
                <Gift className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic">Rewards Catalog</h3>
                <div className="mt-4 text-sm font-bold bg-black/20 py-4 rounded-2xl border border-white/5">
                    Your Balance: <span className="text-blue-400">{(profile?.jump_balance || 0).toLocaleString()} JP</span>
                </div>
                <button className="w-full bg-white text-green-900 py-5 rounded-3xl font-black mt-6 active:scale-95 transition-all shadow-lg">BROWSE ITEMS</button>
            </div>
            <div className="bg-white/5 rounded-[40px] p-6 border-2 border-white/10">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="font-black uppercase italic mb-4">Leaderboard</h3>
                <div className="space-y-2">
                    {leaderboard.map((u, i) => (
                        <div key={i} className="flex justify-between text-[10px] font-black border-b border-white/5 pb-2">
                            <span>{i+1}. {u.username || 'Player'}</span>
                            <span className="text-yellow-400">{(u.jump_balance || 0).toLocaleString()} JP</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {user && <button onClick={signOut} className="w-full py-5 bg-white/5 border-2 border-white/10 rounded-3xl font-black uppercase text-[10px] tracking-widest opacity-40 mt-8 active:scale-95 transition-all">Logout of Empire</button>}
      </div>

      <nav className={cn(
        "bg-black/95 backdrop-blur-3xl border-t border-white/10 flex items-center justify-around px-2 py-6 pb-10 pointer-events-auto transition-transform duration-500 z-[3000]",
        isHidden && activeTab === 'play' ? "translate-y-full" : "translate-y-0"
      )}>
        <NavButton icon={Box} label="Skins" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavButton icon={ShoppingBag} label="Shop" active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
        <NavButton icon={Award} label="Win" active={activeTab === 'event'} onClick={() => setActiveTab('event')} />
        {activeTab !== 'play' && (
            <button onClick={() => setActiveTab('play')} className="bg-primary p-4 rounded-full shadow-glow active:scale-90 transition-all">
                <span className="font-black text-xs uppercase italic px-4 text-white">Exit</span>
            </button>
        )}
      </nav>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90", active ? "text-primary" : "text-white/30")}>
      <Icon className="h-6 w-6" />
      <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-40")}>{label}</span>
    </button>
  );
}
