import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HelixEngine } from '@/game/HelixEngine'
import { GameUI } from '@/components/GameUI'
import { useAuth } from '@/hooks/use-auth'
import { AndroidEdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge'
import { Capacitor } from '@capacitor/core'

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

  // Apply Edge-to-Edge
  useEffect(() => {
    if (Capacitor.getPlatform() === 'android') {
        AndroidEdgeToEdge.setBackgroundColor({ color: '#00000000' });
        AndroidEdgeToEdge.setNavigationBarStyle({ style: 'dark' });
    }
  }, []);

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
  }, [])

  const startGame = () => {
    // 1. Hard Audio Force
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    const audio = new Audio(`/music/tier${((level-1) % 15) + 1}.MP3`);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Music failed:", e));
    audioRef.current = audio;

    // 2. Wake up Engine
    setScore(0);
    setGameState('PLAYING');
    if (engineRef.current) {
        engineRef.current.setupLevel(level);
        engineRef.current.setPaused(false);
    }
  }

  const handleRestart = () => {
    setGameState('HOME');
    engineRef.current?.resetToStart();
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/30">
            <h1 className="text-6xl font-black italic mb-12 text-center drop-shadow-2xl">HELIX<br/>EMPIRE</h1>
            <button onClick={startGame} className="w-64 h-24 bg-primary rounded-full text-4xl font-black italic shadow-glow transition-transform active:scale-95">PLAY</button>
        </div>
      )}

      {gameState === 'WIN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] bg-black/90">
            <h2 className="text-5xl font-black mb-8 italic">SUCCESS</h2>
            <button onClick={() => { setLevel(l => l+1); handleRestart(); }} className="w-64 py-6 bg-white text-black rounded-3xl font-black text-xl">NEXT STAGE</button>
        </div>
      )}

      {gameState === 'REVIVE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] bg-black/90">
            <h2 className="text-5xl font-black mb-8 italic text-red-500">FAILED</h2>
            <button onClick={handleRestart} className="w-64 py-6 bg-primary text-white rounded-3xl font-black text-xl">TRY AGAIN</button>
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
