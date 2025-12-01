"use client";

import { useRef, useState } from "react";

interface VideoGesturesPlayerProps {
  src: string;
  poster?: string;
}

type GestureMode = "none" | "horizontal" | "vertical-left" | "vertical-right";

interface GestureState {
  startX: number;
  startY: number;
  mode: GestureMode;
  initialTime: number;
  initialVolume: number;
  initialBrightness: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function VideoGesturesPlayer({ src, poster }: VideoGesturesPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<GestureState | null>(null);

  const [brightness, setBrightness] = useState(1);
  const [hud, setHud] = useState<string | null>(null);

  const showHud = (text: string) => {
    setHud(text);
    window.clearTimeout((showHud as any)._t);
    (showHud as any)._t = window.setTimeout(() => setHud(null), 700);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const initialVolume = video.volume ?? 1;
    const initialBrightness = brightness;

    gestureRef.current = {
      startX,
      startY,
      mode: "none",
      initialTime,
      initialVolume,
      initialBrightness,
    };

    container.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const container = containerRef.current;
    const gesture = gestureRef.current;
    if (!video || !container || !gesture) return;

    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;

    if (gesture.mode === "none") {
      const threshold = 10;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        gesture.mode = "horizontal";
      } else {
        const rect = container.getBoundingClientRect();
        const isLeft = e.clientX < rect.left + rect.width / 2;
        gesture.mode = isLeft ? "vertical-left" : "vertical-right";
      }
    }

    if (gesture.mode === "horizontal") {
      const deltaSeconds = (dx / 80) * 10; // 80px ~ 10s
      const duration = video.duration || gesture.initialTime + deltaSeconds;
      const newTime = clamp(gesture.initialTime + deltaSeconds, 0, duration);
      video.currentTime = newTime;
      showHud(`Tua: ${Math.round(newTime)}s`);
      return;
    }

    if (gesture.mode === "vertical-right") {
      const delta = -dy / 200; // 200px ~ 1.0 volume
      const newVolume = clamp(gesture.initialVolume + delta, 0, 1);
      video.volume = newVolume;
      showHud(`Âm lượng: ${Math.round(newVolume * 100)}%`);
      return;
    }

    if (gesture.mode === "vertical-left") {
      const delta = -dy / 300; // 300px ~ 0.5 brightness
      const newBrightness = clamp(gesture.initialBrightness + delta, 0.4, 1.5);
      setBrightness(newBrightness);
      showHud(`Độ sáng: ${Math.round(newBrightness * 100)}%`);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    gestureRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-[28px] overflow-hidden bg-black"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="w-full h-full" style={{ filter: `brightness(${brightness})` }}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain bg-black"
          controls
          controlsList="nodownload"
          playsInline
        />
      </div>

      {hud && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-black/70 text-white text-xs sm:text-sm font-semibold">
            {hud}
          </div>
        </div>
      )}
    </div>
  );
}
