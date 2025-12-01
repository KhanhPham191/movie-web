"use client";

import { useEffect, useRef, useState } from "react";
import "shaka-player/dist/controls.css";

interface ShakaPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
}

export function ShakaPlayer({ src, poster, autoPlay = true }: ShakaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let player: any = null;

    const init = async () => {
      const shakaModule = await import("shaka-player/dist/shaka-player.compiled.js");
      const shaka = (shakaModule.default ?? shakaModule) as typeof import("shaka-player");

      if (!shaka.Player.isBrowserSupported()) {
        setError("Trình duyệt không hỗ trợ phát video.");
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      player = new shaka.Player(video);
      player.addEventListener("error", (event: any) => {
        console.error("Shaka error", event.detail);
        setError(event.detail?.message || "Không phát được video");
      });

      try {
        await player.load(src);
        if (autoPlay) {
          await video.play().catch(() => undefined);
        }
      } catch (err: any) {
        console.error("Shaka load error", err);
        setError(err.message || "Không phát được video");
      }
    };

    init();

    return () => {
      player?.destroy();
    };
  }, [src, autoPlay]);

  return (
    <div className="shaka-player w-full h-full relative">
      <video
        ref={videoRef}
        className="w-full h-full rounded-[28px] bg-black"
        poster={poster}
        controls
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
