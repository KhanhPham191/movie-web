"use client";

import { useEffect, useRef, useState } from "react";

async function loadHls() {
  const mod = await import("hls.js");
  return mod.default;
}

interface HlsGesturePlayerProps {
  src: string;
  poster?: string;
}

export function HlsGesturePlayer({ src, poster }: HlsGesturePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekDelta, setSeekDelta] = useState(0);
  const [brightness, setBrightness] = useState(1);

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const startVolume = useRef(0);

  useEffect(() => {
    let hls: any;

    async function init() {
      const video = videoRef.current;
      if (!video) return;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }

      const Hls = await loadHls();
      if (!Hls.isSupported()) {
        setError("Trình duyệt không hỗ trợ HLS.");
        return;
      }

      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
        console.error("[HLS] error", data);
        setError("Không phát được video.");
      });
    }

    init();

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = video.currentTime;
    startVolume.current = video.volume;
    setIsSeeking(false);
    setSeekDelta(0);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || (!e.buttons && e.pointerType !== "touch")) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      setIsSeeking(true);
      const seconds = dx / 10;
      setSeekDelta(seconds);
      video.currentTime = Math.max(0, startTime.current + seconds);
    } else if (Math.abs(dy) > 20 && e.clientX > e.currentTarget.clientWidth * (2 / 3)) {
      const delta = -dy / 200;
      const vol = Math.min(1, Math.max(0, startVolume.current + delta));
      video.volume = vol;
    } else if (Math.abs(dy) > 20 && e.clientX < e.currentTarget.clientWidth / 3) {
      const delta = -dy / 300;
      setBrightness((b) => Math.min(1.3, Math.max(0.3, b + delta)));
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsSeeking(false);
    setSeekDelta(0);
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-[28px] bg-black"
      style={{ filter: `brightness(${brightness})` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        autoPlay
        playsInline
        controls={false}
      />
      {isSeeking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-black/70 text-white text-sm">
            {seekDelta > 0 ? ">>" : "<<"} {Math.abs(Math.round(seekDelta))}s
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
