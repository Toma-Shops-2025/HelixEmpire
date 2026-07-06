import { useState } from 'react';
import { Home, ShoppingBag, Award, Box, Coins, Check, LogOut, Zap, Trophy, Flame, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

type Tab = 'play' | 'inventory' | 'store' | 'event';

const SKINS = [
  { id: 'fire', name: 'Viral Spark', emoji: '🔥', price: 0, type: 'viralcoins' },
  { id: 'gold', name: 'Liquid Gold', emoji: '📀', price: 250, type: 'viralcoins' },
  { id: 'glass', name: 'Neon Phantom', emoji: '🔮', price: 500, type: 'viralcoins' },
  { id: 'yellow', name: 'TomaBox', emoji: '🛍️', price: 1000, type: 'jumppoints' },
  { id: 'crown', name: 'Grand Crown', emoji: '👑', price: 2000, type: 'viralcoins' },
];

export function GameUI({ viralCoins = 0, jumpPoints = 0, currentSkin = 'fire', onSkinSelect, isHidden = false, onTabChange }) {
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [ownedSkins, setOwnedSkins] = useState(['fire']);
  const { user, signOut } = useAuth();

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const buySkin = (skin) => {
    if (ownedSkins.includes(skin.id)) {
        onSkinSelect(skin.id);
        return;
    }
    const canAfford = skin.type === 'viralcoins' ? viralCoins >= skin.price : jumpPoints >= skin.price;
    if (canAfford) {
        setOwnedSkins([...ownedSkins, skin.id]);
        onSkinSelect(skin.id);
        toast.success(`Unlocked ${skin.name}!`, { icon: '✨' });
    } else {
        toast.error(`Not enough ${skin.type === 'viralcoins' ? 'VC' : 'JP'}. Play more to earn!`);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-white transition-opacity duration-300 z-[200]">
      <div />

      <main className={cn(
        "flex-1 flex flex-col items-center p-6 transition-all duration-500 overflow-y-auto pt-32 pb-32",
        activeTab === 'play' ? "opacity-0 translate-y-20 pointer-events-none" : "opacity-100 bg-black/95 backdrop-blur-3xl pointer-events-auto translate-y-0"
      )}>

        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gradient-fire leading-none">Inventory</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/40 uppercase tracking-widest">{ownedSkins.length}/{SKINS.length} Unlocked</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {SKINS.map(skin => {
                const isOwned = ownedSkins.includes(skin.id);
                return (
                    <button
                        key={skin.id}
                        onClick={() => buySkin(skin)}
                        className={cn(
                            "p-6 rounded-[32px] border-4 transition-all active:scale-95 flex flex-col items-center gap-3 relative overflow-hidden group",
                            currentSkin === skin.id ? "border-primary bg-primary/20 shadow-glow" : "border-white/10 bg-white/5",
                            !isOwned && "border-white/5 bg-black"
                        )}
                    >
                        <span className={cn("text-5xl group-hover:scale-110 transition-transform", !isOwned && "grayscale opacity-30")}>{skin.emoji}</span>
                        <div className="flex flex-col items-center">
                            <span className="font-black uppercase text-[10px] tracking-widest">{skin.name}</span>
                        </div>
                        {currentSkin === skin.id && <div className="absolute top-3 right-3 bg-primary rounded-full p-1 shadow-lg"><Check className="h-3 w-3" /></div>}
                    </button>
                )
              })}
            </div>
            {user && (
              <button onClick={signOut} className="w-full flex items-center justify-center gap-3 bg-white/5 border-2 border-white/10 py-5 rounded-3xl active:bg-red-500/20 active:border-red-500/40 transition-all group mt-8">
                <LogOut className="h-4 w-4 text-white/40 group-hover:text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Logout of Empire</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'store' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gradient-gold leading-none">Empire Shop</h2>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-2 italic">Official Premium Store</p>
            </div>
            <div className="space-y-4">
                <button onClick={() => toast.success("PRO Pack coming soon!", { icon: '💎' })} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] border-b-8 border-black/30 flex justify-between items-center shadow-xl group active:scale-95 transition-all pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">💎</div>
                        <div className="flex flex-col text-left">
                            <span className="font-black uppercase tracking-tighter text-lg leading-none">Empire Pack</span>
                            <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-1">No Ads + All Apps PRO</span>
                        </div>
                    </div>
                    <div className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs shadow-lg">UPGRADE</div>
                </button>

                <button onClick={() => toast.info("Google Play Billing initializing...", { icon: '💸' })} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center group active:scale-95 transition-all pointer-events-auto">
                    <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 bg-yellow-400/20 rounded-2xl flex items-center justify-center">
                            <Coins className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black uppercase tracking-tighter leading-none text-lg">1,000 ViralCoins</span>
                            <span className="text-[9px] font-bold opacity-40 uppercase mt-1">Global Shared Currency</span>
                        </div>
                    </div>
                    <div className="bg-primary px-6 py-3 rounded-2xl font-black text-xs shadow-glow">$4.99</div>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'event' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
             <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-blue-400 leading-none">Challenges</h2>
                <div className="flex items-center justify-center gap-1 mt-2">
                    <Zap className="h-3 w-3 text-blue-400 fill-current" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Live Server Hub</span>
                </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-[50px] border-4 border-white/10 text-center shadow-2xl relative overflow-hidden group pointer-events-auto">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/5 rounded-full blur-3xl" />
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Grand Masters</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-8">Reach Stage 100 to win 5,000 ViralCoins</p>
                <button onClick={() => toast.success("Entry registered! Good luck, master.", { icon: '🏁' })} className="w-full bg-white text-indigo-900 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform hover:bg-blue-50">ENTER EVENT</button>
            </div>
          </div>
        )}
      </main>

      <nav className="p-6 pb-12 flex justify-center pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-3xl border-2 border-white/10 rounded-[40px] p-1.5 flex gap-1 shadow-2xl ring-1 ring-white/10">
          <NavButton icon={Home} label="Play" active={activeTab === 'play'} onClick={() => handleTab('play')} />
          <NavButton icon={Box} label="Skins" active={activeTab === 'inventory'} onClick={() => handleTab('inventory')} />
          <NavButton icon={ShoppingBag} label="Shop" active={activeTab === 'store'} onClick={() => handleTab('store')} />
          <NavButton icon={Award} label="Win" active={activeTab === 'event'} onClick={() => handleTab('event')} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-5 py-4 rounded-[35px] transition-all active:scale-90 group",
        active ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]" : "text-white/30 hover:text-white"
      )}
    >
      <Icon className="h-6 w-6 group-active:scale-110 transition-transform" />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}
