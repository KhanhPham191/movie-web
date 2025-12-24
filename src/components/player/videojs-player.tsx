"use client";

import { useEffect, useRef } from "react";
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from "video.js";
import "video.js/dist/video-js.css";

interface VideoJsPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
}

export function VideoJsPlayer({
  src,
  poster,
  className = "w-full h-full",
  autoplay = true,
}: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!src) return;

    // Nếu player đã tồn tại, chỉ cập nhật source để tránh dispose/khởi tạo lại gây giật
    if (playerRef.current) {
      playerRef.current.src({
        src,
        type: "application/x-mpegURL",
      });
      if (poster) {
        playerRef.current.poster(poster);
      }
      return;
    }

    const options: VideoJsPlayerOptions = {
      controls: true,
      autoplay,
      preload: "auto",
      fluid: true,
      sources: [
        {
          src,
          type: "application/x-mpegURL",
        },
      ],
      poster,
    };

    const player = videojs(videoElement, options);
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, autoplay]);

  if (!src) return null;

  return (
    <div className={className}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered"
          playsInline
        />
      </div>
    </div>
  );
}


