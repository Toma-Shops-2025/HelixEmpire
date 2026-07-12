import { useState, useEffect } from 'react';
import { Home, ShoppingBag, Award, Box, Coins, Check, LogOut, Zap, Trophy, Flame, Star, ShieldCheck, Gift, ArrowRight, X, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

type Tab = 'play' | 'inventory' | 'store' | 'event';

const SKINS = [
  { id: 'fire', name: 'Viral Spark', emoji: '🔥', price: 0, type: 'viralcoins' },
  { id: 'gold', name: 'Liquid Gold', emoji: '📀', price: 0, type: 'viralcoins' },
  { id: 'glass', name: 'Neon Phantom', emoji: '🔮', price: 0, type: 'viralcoins' },
  { id: 'yellow', name: 'TomaBox', emoji: '🛍️', price: 0, type: 'jumppoints' },
  { id: 'crown', name: 'Grand Crown', emoji: '👑', price: 0, type: 'viralcoins' },
];

export function GameUI({ viralCoins = 0, jumpPoints = 0, currentSkin = 'fire', onSkinSelect, isHidden = false, onTabChange, onOpenShop, onOpenEvent, requestPayout }) {
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [ownedSkins, setOwnedSkins] = useState(['fire', 'gold', 'glass', 'yellow', 'crown']);
  const [showRedeem, setShowRedeem] = useState(false);
  const { user, signOut } = useAuth();

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const buySkin = (skin) => {
    onSkinSelect(skin.id);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-white transition-opacity duration-300 z-[1000]">
      <div />

      <main className={cn(
        "flex-1 flex flex-col items-center p-6 transition-all duration-500 overflow-y-auto pt-32 pb-32",
        activeTab === 'play' ? "opacity-0 translate-y-20 pointer-events-none" : "opacity-100 bg-black/95 backdrop-blur-3xl pointer-events-auto translate-y-0"
      )}>

        {activeTab === 'inventory' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gradient-fire leading-none">Inventory</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 pb-20">
              {SKINS.map(skin => (
                    <button
                        key={skin.id}
                        onClick={() => buySkin(skin)}
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
                <button onClick={onOpenShop} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[40px] border-b-8 border-black/30 flex justify-between items-center shadow-xl active:scale-95 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">💎</div>
                        <div className="flex flex-col text-left">
                            <span className="font-black uppercase tracking-tighter text-lg leading-none">Empire Pack</span>
                            <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-1">No Ads + All Apps PRO</span>
                        </div>
                    </div>
                    <div className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs shadow-lg">UPGRADE</div>
                </button>

                <button onClick={onOpenShop} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-[40px] flex justify-between items-center active:scale-95 transition-all">
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
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-blue-400 leading-none">Rewards</h2>
            </div>

            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-[50px] border-4 border-white/10 text-center shadow-2xl relative overflow-hidden group">
                <Gift className="h-20 w-20 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Redeem Points</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-8">Trade your JumpPoints for Gift Cards & PayPal</p>
                <button onClick={() => setShowRedeem(true)} className="w-full bg-white text-green-900 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">BROWSE CATALOG</button>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-[50px] border-4 border-white/10 text-center shadow-2xl relative overflow-hidden group">
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Grand Masters</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-8">Reach Stage 100 to win 5,000 ViralCoins</p>
                <button onClick={onOpenEvent} className="w-full bg-white text-indigo-900 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">ENTER EVENT</button>
            </div>
          </div>
        )}
      </main>

      {/* REDEMPTION OVERLAY */}
      {showRedeem && (
        <div className="fixed inset-0 z-[600] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 pointer-events-auto animate-in zoom-in-95">
            <button onClick={() => setShowRedeem(false)} className="absolute top-12 right-8 text-white/40 p-2 hover:text-white"><X className="h-10 w-10" /></button>
            <div className="w-full max-w-sm space-y-8">
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

                <div className="pt-4">
                    <Link to="/how-to-redeem" className="text-center block w-full text-[10px] font-black uppercase tracking-widest text-primary underline">How it works & Rules</Link>
                </div>
            </div>
        </div>
      )}

      {/* Bottom Navigation - Now a "Ghost Menu" during play */}
      <nav className={cn(
        "p-6 pb-12 flex justify-center pointer-events-auto transition-all duration-700",
        isHidden && activeTab === 'play' ? "opacity-20 scale-90 pointer-events-none" : "opacity-100 scale-100"
      )}>
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
        "flex flex-col items-center gap-1 px-5 py-4 rounded-[35px] transition-all active:scale-90",
        active ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]" : "text-white/30 hover:text-white"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}
