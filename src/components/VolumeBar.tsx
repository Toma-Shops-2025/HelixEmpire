import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { readVolumeSettings, setMuted, setVolume, subscribeVolume } from '@/lib/bgm-control';

export function VolumeBar({ className }: { className?: string }) {
  const [volume, setVol] = useState(() => readVolumeSettings().volume);
  const [isMuted, setIsMuted] = useState(() => readVolumeSettings().muted);

  useEffect(() => subscribeVolume(() => {
    const s = readVolumeSettings();
    setVol(s.volume);
    setIsMuted(s.muted);
  }), []);

  return (
    <div
      className={cn(
        'fixed left-3 right-3 z-[9100] flex items-center gap-3 bg-black/95 border border-orange-600/40 rounded-2xl px-4 py-3 backdrop-blur-xl shadow-[0_0_24px_rgba(255,69,0,0.15)]',
        className ?? 'bottom-[8.75rem]',
      )}
    >
      <button
        type="button"
        onClick={() => setMuted(!isMuted)}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className={cn(
          'shrink-0 p-2.5 rounded-xl border active:scale-95 transition-transform',
          isMuted ? 'bg-white/5 border-white/10' : 'bg-orange-600/20 border-orange-600/50',
        )}
      >
        {isMuted ? <VolumeX className="h-6 w-6 text-white/40" /> : <Volume2 className="h-6 w-6 text-orange-500" />}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round((isMuted ? 0 : volume) * 100)}
        onChange={(e) => {
          const next = Number(e.target.value) / 100;
          setVolume(next);
          setVol(next);
          if (next > 0 && isMuted) {
            setMuted(false);
            setIsMuted(false);
          }
        }}
        className="flex-1 h-2 accent-orange-600 cursor-pointer"
        aria-label="Volume"
      />
      <span className="text-[11px] font-black text-orange-500 w-8 text-right tabular-nums">
        {isMuted ? 0 : Math.round(volume * 100)}
      </span>
    </div>
  );
}
