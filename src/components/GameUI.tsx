import { ShoppingBag, Award, Box, Check, Trophy, Gift, ArrowLeft, Zap, Smartphone, CreditCard, ShoppingCart } from 'lucide-react';
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

const REWARDS = [
    { id: 'visa5', name: '$5 Visa Card', jp: 5000, provider: 'Visa' },
    { id: 'visa10', name: '$10 Visa Card', jp: 10000, provider: 'Visa' },
    { id: 'pay10', name: '$10 PayPal', jp: 10500, provider: 'PayPal' },
    { id: 'amz25', name: '$25 Amazon', jp: 24000, provider: 'Amazon' },
    { id: 'visa50', name: '$50 Visa Card', jp: 48000, provider: 'Visa' },
];

export function GameUI({
  activeTab,
  setActiveTab,
  currentSkin,
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
        (activeTab === 'play' || isHidden) ? "translate-y-full opacity-0 invisible" : "translate-y-0 opacity-100 visible bg-black/95 backdrop-blur-3xl"
      )}>

        {/* SKINS MENU */}
        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8">
            <h2 className="text-5xl font-black italic text-center uppercase tracking-tighter">Skins</h2>
            <div className="grid grid-cols-2 gap-4">
              {SKINS.map(skin => (
                <button key={skin.id} onClick={() => onSkinSelect(skin.id)} className={cn("p-6 rounded-[32px] border-4 flex flex-col items-center gap-3 relative active:scale-95 transition-all", currentSkin === skin.id ? "border-primary bg-primary/20" : "border-white/10 bg-white/5")}>
                    <span className="text-5xl">{skin.emoji}</span>
                    <span className="font-black uppercase text-[10px] tracking-widest">{skin.name}</span>
                    {currentSkin === skin.id && <div className="absolute top-3 right-3 bg-primary rounded-full p-1"><Check className="h-3 w-3" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SHOP MENU */}
        {activeTab === 'store' && (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-5xl font-black italic text-yellow-400 uppercase tracking-tighter">Shop</h2>
            <div className="space-y-4">
                <button onClick={() => setActiveTab('store_pack')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] flex justify-between items-center shadow-xl active:scale-95 transition-all">
                    <span className="font-black uppercase text-lg text-white">Empire Pack</span>
                    <span className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs uppercase">View</span>
                </button>
                <button onClick={() => setActiveTab('store_coins')} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center active:scale-95 transition-all">
                    <span className="font-black uppercase text-lg text-left">1,000 Coins</span>
                    <span className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow uppercase">View</span>
                </button>
            </div>
          </div>
        )}

        {/* SHOP: EMPIRE PACK DETAIL */}
        {activeTab === 'store_pack' && (
            <div className="w-full max-w-md space-y-8 text-center">
                <button onClick={() => setActiveTab('store')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8"><ArrowLeft className="h-4 w-4" /> Back to Shop</button>
                <div className="bg-white/5 border-4 border-primary/20 p-8 rounded-[50px] space-y-6">
                    <Smartphone className="h-24 w-24 text-primary mx-auto" />
                    <h3 className="text-3xl font-black italic uppercase">Empire Bundle</h3>
                    <ul className="text-left text-sm text-white/60 space-y-2 list-disc list-inside">
                        <li>Exclusive "Grand Crown" Skin</li>
                        <li>No Interstitial Ads</li>
                        <li>500 Instant Bonus Coins</li>
                        <li>VIP Leaderboard Badge</li>
                    </ul>
                    <button onClick={() => purchase(PRODUCT_EMPIRE_PACK)} className="w-full bg-primary py-6 rounded-3xl font-black text-xl shadow-glow active:scale-95 transition-all">GET IT NOW</button>
                </div>
            </div>
        )}

        {/* SHOP: COINS DETAIL */}
        {activeTab === 'store_coins' && (
            <div className="w-full max-w-md space-y-8 text-center">
                <button onClick={() => setActiveTab('store')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8"><ArrowLeft className="h-4 w-4" /> Back to Shop</button>
                <div className="bg-white/5 border-4 border-yellow-500/20 p-8 rounded-[50px] space-y-6">
                    <ShoppingCart className="h-24 w-24 text-yellow-400 mx-auto" />
                    <h3 className="text-3xl font-black italic uppercase">Coin Satchel</h3>
                    <p className="text-sm text-white/60">Instantly add 1,000 ViralCoins to your balance to unlock premium skins and power-ups.</p>
                    <button onClick={() => purchase(PRODUCT_COINS_1000)} className="w-full bg-yellow-500 text-black py-6 rounded-3xl font-black text-xl active:scale-95 transition-all">$4.99 - BUY</button>
                </div>
            </div>
        )}

        {/* WIN MENU */}
        {activeTab === 'event' && (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-5xl font-black italic text-blue-400 uppercase tracking-tighter">Win</h2>
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-[50px] border-4 border-white/10 mb-8 shadow-2xl">
                <Gift className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic">Rewards</h3>
                <div className="mt-4 text-sm font-bold bg-black/20 py-4 rounded-2xl border border-white/5">
                    Your Balance: <span className="text-blue-400">{(profile?.jump_balance || 0).toLocaleString()} JP</span>
                </div>
                <button onClick={() => setActiveTab('catalog')} className="w-full bg-white text-green-900 py-5 rounded-3xl font-black mt-6 active:scale-95 transition-all shadow-lg">BROWSE CATALOG</button>
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

        {/* CATALOG VIEW */}
        {activeTab === 'catalog' && (
            <div className="w-full max-w-md space-y-8 text-center pb-20">
                <button onClick={() => setActiveTab('event')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8"><ArrowLeft className="h-4 w-4" /> Back</button>
                <h2 className="text-4xl font-black italic uppercase text-green-400">Prize Catalog</h2>
                <div className="grid grid-cols-1 gap-4">
                    {REWARDS.map(reward => (
                        <div key={reward.id} className={cn("bg-white/5 border-2 p-6 rounded-[40px] flex justify-between items-center transition-opacity", (profile?.jump_balance || 0) < reward.jp ? "opacity-40 border-white/5" : "border-green-500/50")}>
                            <div className="text-left">
                                <span className="block font-black uppercase text-lg italic">{reward.name}</span>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{reward.jp.toLocaleString()} JP required</span>
                            </div>
                            <CreditCard className="h-10 w-10 text-white/20" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {user && <button onClick={signOut} className="w-full py-5 bg-white/5 border-2 border-white/10 rounded-3xl font-black uppercase text-[10px] tracking-widest opacity-40 mt-8 active:scale-95 transition-all">Logout of Empire</button>}
      </div>

      {/* Navbar */}
      <nav className={cn(
        "bg-black/95 backdrop-blur-3xl border-t border-white/10 flex items-center justify-around px-2 py-6 pb-10 pointer-events-auto transition-transform duration-500 z-[3000]",
        (isHidden && activeTab === 'play') ? "translate-y-full" : "translate-y-0"
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
