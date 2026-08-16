import { createFileRoute } from '@tanstack/react-router';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';
import { Gift, CheckCircle, Trophy, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/how-to-redeem')({
  component: HowToRedeemPage,
});

function HowToRedeemPage() {
  return (
    <LegalLayout title="Empire Perks">
      <div className="space-y-6 py-4">
        <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-6 rounded-[30px] flex gap-4">
            <Gift className="h-8 w-8 text-yellow-500 shrink-0" />
            <p className="text-xs font-bold text-yellow-200">Earn JumpPoints (JP) and ViralCoins by playing. Unlock in-app perks and ranks — virtual rewards only, no cash value.</p>
        </div>

        <LegalSection title="Rank Milestones">
            <ul className="space-y-3 text-[11px] opacity-80">
                <li className="flex justify-between border-b border-white/5 pb-2"><span>250,000 JP</span> <span className="text-green-400 font-black">Bronze Helix Badge</span></li>
                <li className="flex justify-between border-b border-white/5 pb-2"><span>500,000 JP</span> <span className="text-green-400 font-black">Gold Helix Frame</span></li>
                <li className="flex justify-between"><span>1,000,000 JP</span> <span className="text-green-400 font-black">Empire Crown Flair</span></li>
            </ul>
        </LegalSection>

        <LegalSection title="How It Works">
            <div className="space-y-4">
                <div className="flex gap-3 items-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <p className="text-[10px]">Perks unlock automatically when you reach each JP milestone.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <Trophy className="h-4 w-4 text-primary" />
                    <p className="text-[10px]">Compete on the leaderboard for Hall of Fame status.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-[10px]">JP and ViralCoins have no cash value and cannot be exchanged for money or gift cards.</p>
                </div>
            </div>
        </LegalSection>
      </div>
    </LegalLayout>
  );
}
