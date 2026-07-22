import { ShoppingBag, Award, Box, Check, Trophy, Gift, ArrowLeft, Smartphone, CreditCard, ShoppingCart, Info, DollarSign } from 'lucide-react';
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
    { id: 'v5', name: '$5 Visa Card', jp: 25000, type: 'Visa' },
    { id: 'a5', name: '$5 Amazon Gift', jp: 25000, type: 'Amazon' },
    { id: 'p5', name: '$5 PayPal Cash', jp: 25000, type: 'PayPal' },
    { id: 'v10', name: '$10 Visa Card', jp: 50000, type: 'Visa' },
    { id: 'a10', name: '$10 Amazon Gift', jp: 50000, type: 'Amazon' },
    { id: 'p10', name: '$10 PayPal Cash', jp: 50000, type: 'PayPal' },
];

interface GameUIProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    currentSkin: string;
    onSkinSelect: (skin: string) => void;
    isHidden: boolean;
}

export function GameUI({ activeTab, setActiveTab, currentSkin, onSkinSelect, isHidden }: GameUIProps) {
  const { user, signOut, supabase, addViralCoins, profile } = useAuth();
  const { purchase } = useBilling(addViralCoins);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('username, jump_balance').order('jump_balance', { ascending: false }).limit(10);
    if (data) setLeaderboard(data);
  };

  useEffect(() => {
    if (activeTab === 'event') fetchLeaderboard();
  }, [activeTab]);

  return (
    <div className="absolute inset-0 flex flex-col justify-end text-white z-[2500] pointer-events-none">
      <div className={cn(
        "absolute inset-0 flex flex-col items-center p-6 pt-32 pb-32 transition-all duration-500 overflow-y-auto pointer-events-auto",
        (activeTab === 'play' || isHidden) ? "translate-y-full opacity-0 invisible" : "translate-y-0 opacity-100 visible bg-black/95 backdrop-blur-3xl"
      )}>

        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8">
            <h2 className="text-5xl font-black italic text-center uppercase tracking-tighter">Skins</h2>
            <div className="grid grid-cols-2 gap-4">
              {SKINS.map(skin => (
                <button key={skin.id} onClick={() => onSkinSelect(skin.id)} className={cn("p-6 rounded-[32px] border-4 flex flex-col items-center gap-3 relative active:scale-95 transition-all", currentSkin === skin.id ? "border-primary bg-primary/20" : "border-white/10 bg-white/5")}>
                    <span className="text-5xl">{skin.emoji}</span>
                    <span className="font-black uppercase text-[10px] tracking-widest">{skin.name}</span>
                    {currentSkin === skin.id && <div className="absolute top-3 right-3 bg-primary rounded-full p-1"><Check className="h-3 w-3 text-white" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-5xl font-black italic text-yellow-400 uppercase tracking-tighter">Shop</h2>
            <div className="space-y-4">
                <button onClick={() => setActiveTab('store_pack')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] flex justify-between items-center shadow-xl active:scale-95 transition-all">
                    <div className="flex flex-col text-left">
                        <span className="font-black uppercase text-lg text-white leading-none">Empire Pack</span>
                        <span className="text-[8px] opacity-60 uppercase font-black tracking-widest mt-1">Unlock Crown Skin + Ad Free</span>
                    </div>
                    <span className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">View</span>
                </button>
                <button onClick={() => setActiveTab('store_coins')} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center active:scale-95 transition-all">
                    <span className="font-black uppercase text-lg text-left leading-none">1,000 Coins</span>
                    <span className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow uppercase text-white">View</span>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'store_pack' && (
            <div className="w-full max-w-md space-y-8 text-center animate-in zoom-in duration-300">
                <button onClick={() => setActiveTab('store')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8 active:scale-90 transition-transform"><ArrowLeft className="h-4 w-4" /> Back to Shop</button>
                <div className="bg-white/5 border-4 border-primary/20 p-8 rounded-[50px] space-y-6 relative overflow-hidden group">
                    <Smartphone className="h-24 w-24 text-primary mx-auto relative z-10 drop-shadow-glow" />
                    <h3 className="text-3xl font-black italic uppercase relative z-10">Empire Bundle</h3>
                    <ul className="text-left text-sm text-white/60 space-y-2 font-bold uppercase relative z-10">
                        <li>• Exclusive "Grand Crown" Skin</li>
                        <li>• Permanent Ad Removal</li>
                        <li>• 500 Instant Bonus Coins</li>
                    </ul>
                    <button onClick={() => purchase(PRODUCT_EMPIRE_PACK)} className="w-full bg-primary text-white py-6 rounded-3xl font-black text-xl shadow-glow active:scale-95 transition-all relative z-10">$9.99 - BUY</button>
                </div>
            </div>
        )}

        {activeTab === 'store_coins' && (
            <div className="w-full max-w-md space-y-8 text-center animate-in zoom-in duration-300">
                <button onClick={() => setActiveTab('store')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8 active:scale-90 transition-transform"><ArrowLeft className="h-4 w-4" /> Back to Shop</button>
                <div className="bg-white/5 border-4 border-yellow-500/20 p-8 rounded-[50px] space-y-6 relative overflow-hidden group">
                    <ShoppingCart className="h-24 w-24 text-yellow-400 mx-auto relative z-10 drop-shadow-glow" />
                    <h3 className="text-3xl font-black italic uppercase relative z-10">1,000 Coins</h3>
                    <p className="text-xs text-white/40 font-bold uppercase leading-relaxed">Boost your balance to unlock items and skip levels!</p>
                    <button onClick={() => purchase(PRODUCT_COINS_1000)} className="w-full bg-yellow-500 text-black py-6 rounded-3xl font-black text-xl active:scale-95 transition-all relative z-10">$4.99 - BUY</button>
                </div>
            </div>
        )}

        {activeTab === 'event' && (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-5xl font-black italic text-blue-400 uppercase tracking-tighter">Win</h2>
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-[50px] border-4 border-white/10 mb-8 shadow-2xl relative overflow-hidden">
                <Gift className="h-16 w-16 text-green-400 mb-4" />
                <h3 className="text-2xl font-black uppercase italic leading-none mb-2">Jackpot Rewards</h3>
                <div className="mt-4 text-xs font-black uppercase bg-black/40 py-4 rounded-2xl border border-white/5 inline-block px-8">
                    Your Total: <span className="text-blue-400">{(profile?.jump_balance || 0).toLocaleString()} JP</span>
                </div>
                <button onClick={() => setActiveTab('catalog')} className="w-full bg-white text-green-900 py-5 rounded-3xl font-black mt-6 active:scale-95 transition-all shadow-lg uppercase tracking-widest text-xs">Browse Catalog</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('how_to_play')} className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all">Rules</button>
                <button onClick={() => setActiveTab('faq')} className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all">F.A.Q.</button>
            </div>

            <div className="bg-white/5 rounded-[40px] p-8 border-2 border-white/10">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="font-black uppercase italic mb-6 text-xs opacity-50 tracking-widest">Global Leaderboard</h3>
                <div className="space-y-3">
                    {leaderboard.length > 0 ? (
                        leaderboard.map((u, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-2">
                                <span className="flex items-center gap-2"><span className="opacity-30">{i+1}.</span> {u.username}</span>
                                <span className="text-primary italic">{(u.jump_balance || 0).toLocaleString()} JP</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-[10px] font-black opacity-20 uppercase italic py-4">No scores yet today</div>
                    )}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
            <div className="w-full max-w-md space-y-8 text-center pb-20 px-2">
                <button onClick={() => setActiveTab('event')} className="flex items-center gap-2 text-white/30 uppercase font-black text-[10px] mb-8 active:scale-90"><ArrowLeft className="h-4 w-4" /> Back</button>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 text-emerald-400">Prizes</h2>
                <div className="grid grid-cols-1 gap-3">
                    {REWARDS.map(reward => (
                        <div key={reward.id} className={cn("bg-white/5 border-2 p-6 rounded-[35px] flex justify-between items-center", (profile?.jump_balance || 0) < reward.jp ? "opacity-30 border-white/5" : "border-emerald-500/50")}>
                            <div className="text-left">
                                <span className="block font-black uppercase text-lg italic leading-none mb-1">{reward.name}</span>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{reward.jp.toLocaleString()} JP Required</span>
                            </div>
                            {reward.type === 'PayPal' ? <DollarSign className="h-8 w-8 text-blue-400" /> : <CreditCard className="h-8 w-8 text-white/40" />}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'how_to_play' && (
            <div className="w-full max-w-md space-y-8 pb-20 text-left">
                <button onClick={() => setActiveTab('event')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8 active:scale-90"><ArrowLeft className="h-4 w-4" /> Back</button>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 text-blue-400 text-center">Rules</h2>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-6 font-bold uppercase">
                    <section>
                        <h3 className="text-primary text-xs mb-2 italic tracking-widest font-black">Scoring</h3>
                        <p className="text-sm text-white/60 leading-relaxed">Pass platforms to earn JP. Clear the stage to save your points and earn 50 Viral Coins!</p>
                    </section>
                    <section>
                        <h3 className="text-primary text-xs mb-2 italic tracking-widest font-black">Controls</h3>
                        <p className="text-sm text-white/60 leading-relaxed">Swipe to rotate. Avoid red zones. Use Lucky Daub (ads) to revive if you fail!</p>
                    </section>
                </div>
            </div>
        )}

        {activeTab === 'faq' && (
            <div className="w-full max-w-md space-y-8 pb-20 text-left px-2">
                <button onClick={() => setActiveTab('event')} className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] mb-8 active:scale-90"><ArrowLeft className="h-4 w-4" /> Back</button>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 text-blue-400 text-center">F.A.Q.</h2>
                <div className="space-y-4 font-bold uppercase">
                    {[
                        { q: "How long do payouts take?", a: "Most payouts are processed within 48 business hours." },
                        { q: "Can I play on multiple devices?", a: "Yes, just login with your same email to sync your balance." },
                        { q: "Is the app free?", a: "Yes! You earn rewards just by playing and watching ads." }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                            <h3 className="font-black text-[10px] text-primary mb-2 italic tracking-widest">{item.q}</h3>
                            <p className="text-xs text-white/40 leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {user && (
            <div className="mt-8 flex flex-col items-center gap-4 w-full">
                <div className="flex flex-col items-center opacity-40 uppercase font-black text-[10px] tracking-widest">
                    <span>Active Player</span>
                    <span className="text-primary text-lg italic border-b border-primary/20 pb-1 mt-1">{profile?.username || 'Gamer'}</span>
                </div>
                <button onClick={signOut} className="w-full py-5 bg-white/5 border-2 border-white/10 rounded-3xl font-black uppercase text-[10px] tracking-widest opacity-20 active:scale-95 transition-all">Sign Out</button>
            </div>
        )}
      </div>

      <nav className={cn(
        "bg-black/95 backdrop-blur-3xl border-t border-white/10 flex items-center justify-around px-2 py-6 pb-10 pointer-events-auto transition-transform duration-500 z-[3000]",
        isHidden && activeTab === 'play' ? "translate-y-full" : "translate-y-0"
      )}>
        <NavButton icon={Box} label="Skins" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavButton icon={ShoppingBag} label="Shop" active={activeTab === 'store' || activeTab === 'store_pack' || activeTab === 'store_coins'} onClick={() => setActiveTab('store')} />
        <NavButton icon={Award} label="Win" active={activeTab === 'event' || activeTab === 'catalog'} onClick={() => setActiveTab('event')} />
        {activeTab !== 'play' && (
            <button onClick={() => setActiveTab('play')} className="bg-primary p-4 rounded-full shadow-glow active:scale-90 transition-transform">
                <span className="font-black text-xs uppercase italic px-4 text-white">Exit</span>
            </button>
        )}
      </nav>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90", active ? "text-primary scale-110" : "text-white/30")}>
      <Icon className={cn("h-6 w-6", active && "fill-current")} />
      <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-40")}>{label}</span>
    </button>
  );
}
