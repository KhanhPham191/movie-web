"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    const initPlayer = () => {
      setIsLoading(true);
      setError(null);

      // Check if it's an m3u8 stream
      if (src.includes(".m3u8")) {
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          
          hls.loadSource(src);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError("Lỗi mạng. Vui lòng thử lại.");
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError("Lỗi media. Đang thử khôi phục...");
                  hls?.recoverMediaError();
                  break;
                default:
                  setError("Không thể phát video này.");
                  break;
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Native HLS support (Safari)
          video.src = src;
          video.addEventListener("loadedmetadata", () => {
            setIsLoading(false);
          });
        } else {
          setError("Trình duyệt không hỗ trợ phát video này.");
        }
      } else {
        // Regular video file
        video.src = src;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
        });
      }
    };

    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  if (error) {
    return (
      <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-white border-white/30"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-blue-500/90 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer group/progress"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-blue-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-white" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {title && (
              <span className="text-white text-sm mr-4 hidden md:block">
                {title}
              </span>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoPlayerSkeleton() {
  return (
    <Skeleton className="aspect-video rounded-lg" />
  );
}

