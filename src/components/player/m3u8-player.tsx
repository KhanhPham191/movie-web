"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, FastForward } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  
  // Touch state for double tap
  const lastTapRef = useRef<number>(0);
  const lastTapXRef = useRef<number>(0);
  
  // Long press state
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isLongPressActiveRef = useRef<boolean>(false);

  // Detect mobile device and iOS
  useEffect(() => {
    const checkMobile = () => {
      const mobile = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
      
      const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsIOS(ios);
    };
    checkMobile();
  }, []);

  // Update playback rate when it changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Update buffered progress
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleProgress = () => {
      // Update buffered progress when video buffers
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenActive);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

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

  // Handle double tap to skip 10s and long press for 2x speed
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    const tapX = touch.clientX;
    
    // Store touch start time for long press
    touchStartTimeRef.current = now;
    isLongPressActiveRef.current = false;
    
    // Double tap detection (within 300ms)
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Cancel any pending long press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      e.preventDefault();
      const video = videoRef.current;
      if (!video) return;
      
      // Determine skip direction based on tap position (left half = backward, right half = forward)
      const container = containerRef.current;
      if (container) {
        const containerWidth = container.offsetWidth;
        const isLeftSide = tapX < containerWidth / 2;
        const skipSeconds = isLeftSide ? -10 : 10;
        
        const newTime = Math.max(0, Math.min(video.duration, video.currentTime + skipSeconds));
        video.currentTime = newTime;
      }
      
      lastTapRef.current = 0; // Reset to prevent triple tap
      return;
    }
    
    lastTapRef.current = now;
    lastTapXRef.current = tapX;
    touchStartXRef.current = tapX;
    touchStartYRef.current = touch.clientY;
    
    // Start long press timer (500ms) - works in both normal and fullscreen mode
    longPressTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !isLongPressActiveRef.current) {
        isLongPressActiveRef.current = true;
        setPlaybackRate(2);
        setShowSpeedIndicator(true);
        // Prevent default behaviors that might interfere
        e.preventDefault();
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    // Calculate movement distance to cancel long press if moved too much
    const moveThreshold = 15; // pixels
    if (touchStartTimeRef.current > 0) {
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      const moveDistance = Math.sqrt(
        Math.pow(currentX - touchStartXRef.current, 2) + Math.pow(currentY - touchStartYRef.current, 2)
      );
      
      // Cancel long press if user moves finger significantly
      if (moveDistance > moveThreshold) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        
        // If long press was active and user moves, cancel it
        if (isLongPressActiveRef.current) {
          isLongPressActiveRef.current = false;
          setPlaybackRate(1);
          setShowSpeedIndicator(false);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Cancel long press timer if it hasn't fired yet
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If long press was active, reset to normal speed after a short delay
    // This allows the user to see the speed indicator briefly
    if (isLongPressActiveRef.current) {
      setTimeout(() => {
        isLongPressActiveRef.current = false;
        setPlaybackRate(1);
        setShowSpeedIndicator(false);
      }, 100);
    }
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "00:00";
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const value = parseFloat(e.target.value);
    video.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Math.min(1, Math.max(0, parseFloat(e.target.value)));
    video.volume = v;
    setVolume(v);
    if (v === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleToggleFullscreen = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!container) return;

    // iOS Safari requires webkitEnterFullscreen on video element
    if (isIOS && video) {
      if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
      return;
    }

    // Standard fullscreen API for other browsers
    const isFullscreenActive = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFullscreenActive) {
      const requestFullscreen = 
        container.requestFullscreen ||
        (container as any).webkitRequestFullscreen ||
        (container as any).mozRequestFullScreen ||
        (container as any).msRequestFullscreen;
      
      if (requestFullscreen) {
        requestFullscreen.call(container).catch(() => {});
      }
    } else {
      const exitFullscreen = 
        document.exitFullscreen ||
        (document as any).webkitExitFullscreen ||
        (document as any).mozCancelFullScreen ||
        (document as any).msExitFullscreen;
      
      if (exitFullscreen) {
        exitFullscreen.call(document).catch(() => {});
      }
    }
  };

  if (!src) return null;

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className={`${className} relative`}
        style={{
          ...(isFullscreen ? {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          } : {})
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-contain bg-black"
          style={{
            ...(isFullscreen ? {
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
            } : {})
          }}
          title={title}
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          controls={false}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'manipulation' }}
        />
        
        {/* Speed indicator icon for mobile when at 2x - works in fullscreen too */}
        {showSpeedIndicator && isMobile && playbackRate === 2 && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none z-[100]">
            <div className="bg-black/40 rounded-full p-2 backdrop-blur-sm">
              <FastForward className="w-4 h-4 text-[#F6C453]" />
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Controls - Below video frame, outside of video container */}
      {controls && (
        <div className="w-full bg-transparent backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 mt-16 sm:mt-20">
          {/* Progress bar */}
          <div className="mb-2 sm:mb-3">
            <div 
              className="relative transition-all duration-300 ease-out"
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => setIsHoveringProgress(false)}
            >
              {/* Background track */}
              <div className={`absolute inset-y-0 left-0 my-auto rounded-full bg-gray-900 transition-all duration-300 ${isHoveringProgress ? 'h-1.5' : 'h-1'}`} />
              {/* In-progress line (buffered/loaded) */}
              <div
                className={`absolute inset-y-0 left-0 my-auto rounded-full bg-gray-600 transition-all duration-300 ${isHoveringProgress ? 'h-1.5' : 'h-1'}`}
                style={{
                  width: duration > 0 ? `${Math.min(100, Math.max(0, (buffered / duration) * 100))}%` : "0%",
                }}
              />
              {/* Current progress line */}
              <div
                className={`absolute inset-y-0 left-0 my-auto rounded-full bg-[#F6C453] transition-all duration-300 ${isHoveringProgress ? 'h-1.5' : 'h-1'}`}
                style={{
                  width: duration > 0 ? `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` : "0%",
                }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Number.isFinite(currentTime) ? currentTime : 0}
                onChange={handleSeek}
                className={`relative z-10 w-full cursor-pointer appearance-none bg-transparent transition-all duration-300
                  ${isHoveringProgress ? 'h-5' : 'h-4'}
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#F6C453]
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:duration-300
                  ${isHoveringProgress 
                    ? '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(0,0,0,0.7)]' 
                    : '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(0,0,0,0.7)]'
                  }
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[#F6C453]
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:transition-all
                  [&::-moz-range-thumb]:duration-300
                  ${isHoveringProgress 
                    ? '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4' 
                    : '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3'
                  }`}
              />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-black hover:bg-white hover:scale-105 transition focus:outline-none"
                aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-[1px]" />
                )}
              </button>

              {/* Time display */}
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/80 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none"
                  aria-label="Âm lượng"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <div className="relative hidden w-20 sm:w-24 items-center sm:flex">
                  <div className="pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-white/15" />
                  <div
                    className="pointer-events-none absolute h-0.5 rounded-full bg-[#F6C453]"
                    style={{ width: `${Math.round((volume || 0) * 100)}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent
                      [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F6C453] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none"
              aria-label="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

