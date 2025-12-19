"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface M3u8PlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export function M3u8Player({
  src,
  title = "Player",
  className = "w-full h-full",
  autoPlay = true,
  muted = true,
  controls = true,
}: M3u8PlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        backBufferLength: 90,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari / iOS native HLS
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  if (!src) return null;

  return (
    <div className={`${className} relative`}>
      <video
        ref={videoRef}
        className="h-full w-full object-contain bg-black"
        title={title}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
      />
    </div>
  );
}

