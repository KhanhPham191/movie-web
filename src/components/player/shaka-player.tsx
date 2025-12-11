"use client";

import { useEffect, useRef, useState } from "react";

interface ShakaPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

async function loadShaka() {
  // Dùng bản compiled để tránh lỗi bundler
  const mod: any = await import("shaka-player/dist/shaka-player.compiled.js");
  return mod.default || mod;
}

export function ShakaPlayer({ src, poster, className = "w-full h-full" }: ShakaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let destroyed = false;
    let player: any = null;

    async function init() {
      const video = videoRef.current;
      if (!video || !src) return;

      try {
        const shaka = await loadShaka();
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          setError("Trình duyệt không hỗ trợ Shaka Player.");
          return;
        }

        if (destroyed) return;

        player = new shaka.Player(video);

        await player.load(src);
      } catch (err) {
        if (!destroyed) {
          setError("Không phát được video (m3u8).");
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      if (player) {
        player.destroy().catch(() => {});
      }
    };
  }, [src]);

  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/40 text-white/70 text-sm`}>
        Không có nguồn m3u8
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-black`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls
        autoPlay
        playsInline
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm">
          {error}
        </div>
      )}
    </div>
  );
}


