import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/chrome';

export function AuscultationPlayer({ src, title }: { src: string; title?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 my-3 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary text-white shadow-md shadow-primary/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        title={isPlaying ? 'Pauza' : 'Ijro etish'}
      >
        <Icon name={isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} className="text-lg" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <span className="text-emerald-900 dark:text-emerald-300 truncate flex items-center gap-1.5">
            <Icon name="ri-stethoscope-line" className="text-sm text-primary" />
            {title || 'Auskultatsiya yozuvi (Yurak / O‘pka shovqini)'}
          </span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        </div>
        <div
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = clickPos * duration;
          }}
          className="relative h-1.5 w-full rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 cursor-pointer overflow-hidden"
        >
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
