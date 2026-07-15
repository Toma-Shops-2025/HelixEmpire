import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob'

export const Route = createFileRoute('/')({
  component: GamePage,
})

function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<HelixEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user, profile, addJumpPoints, refreshProfile, requestPayout } = useAuth()

  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'HOME' | 'PLAYING' | 'REVIVE' | 'WIN'>('HOME')
  const [activeTab, setActiveTab] = useState('play')
  const [localJP, setLocalJP] = useState(0)

  useEffect(() => {
    if (profile) setLocalJP(Number(profile.jump_balance))
  }, [profile])

  useEffect(() => {
    if (!containerRef.current) return
    const engine = new HelixEngine(containerRef.current, {
      score: 0,
      level: level,
      isGameOver: false,
      onWin: () => {
          setGameState('WIN');
          audioRef.current?.pause();
      },
      onLoss: () => {
          setGameState('REVIVE');
          audioRef.current?.pause();
      },
      onScoreUpdate: (pts) => {
          setScore(prev => prev + pts)
          setLocalJP(prev => prev + pts)
      }
    })
    engineRef.current = engine
    return () => engine.dispose()
  }, [level])

  const startGame = () => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/music/tier${((level-1) % 15) + 1}.MP3`);
    audio.loop = true;
    audio.play().catch(e => console.log("Audio play blocked", e));
    audioRef.current = audio;

    setScore(0);
    setGameState('PLAYING');
    engineRef.current?.setPaused(false);
  }

  const handleRevive = async () => {
    try {
        await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' });
        await AdMob.showRewardVideoAd();
        const listener = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
            setGameState('PLAYING');
            engineRef.current?.setPaused(false);
            audioRef.current?.play();
            listener.remove();
        });
    } catch (e) {
        setGameState('HOME');
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {gameState === 'PLAYING' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
            <div className="text-[10px] opacity-50 uppercase font-black">Stage {level}</div>
            <div className="text-7xl font-black italic">{score}</div>
        </div>
      )}

      {gameState === 'HOME' && activeTab === 'play' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/20">
            <h1 className="text-6xl font-black italic mb-12 text-center">HELIX<br/>EMPIRE</h1>
            <button onClick={startGame} className="w-64 h-24 bg-primary rounded-full text-4xl font-black italic shadow-glow">PLAY</button>
            <div className="mt-8 flex gap-6 text-[10px] uppercase font-bold opacity-40">
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
            </div>
        </div>
      )}

      {gameState === 'WIN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] bg-black/90">
            <h2 className="text-5xl font-black mb-8 italic">SUCCESS</h2>
            <button onClick={() => { setLevel(l => l+1); setGameState('HOME'); }} className="w-64 py-6 bg-white text-black rounded-3xl font-black text-xl">NEXT STAGE</button>
        </div>
      )}

      {gameState === 'REVIVE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] bg-black/90">
            <h2 className="text-5xl font-black mb-4 italic text-red-500">FAILED</h2>
            <button onClick={handleRevive} className="w-64 py-4 bg-green-500 rounded-2xl font-bold mb-4">WATCH AD TO REVIVE</button>
            <button onClick={() => { setLevel(1); setGameState('HOME'); }} className="w-64 py-4 border-2 border-white/20 rounded-2xl font-bold">START OVER</button>
        </div>
      )}

      <GameUI
        viralCoins={profile?.coin_balance || 0}
        jumpPoints={localJP}
        onSkinSelect={(s) => engineRef.current?.setSkin(s)}
        isHidden={gameState === 'PLAYING'}
        onTabChange={(t) => { setActiveTab(t); if(t !== 'play') setGameState('HOME'); }}
        requestPayout={requestPayout}
      />
    </div>
  )
}
