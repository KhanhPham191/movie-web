"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  Settings,
  X,
} from "lucide-react";

interface NetflixPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function NetflixPlayer({
  src,
  title = "Player",
  className = "w-full h-full",
  autoPlay = true,
  muted = true,
  onTimeUpdate,
}: NetflixPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Auto-hide controls - hide immediately when playing, show only on hover
  const hideControls = useCallback(() => {
    if (isPlaying && !isHovering && !isDragging) {
      setShowControls(false);
    }
  }, [isPlaying, isHovering, isDragging]);

  const showControlsWithTimeout = useCallback(() => {
    // Only show if hovering
    if (isHovering || !isPlaying) {
      setShowControls(true);
    }
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, [isHovering, isPlaying]);

  // Mouse movement handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      showControlsWithTimeout();
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      // Hide immediately when leaving if playing
      if (isPlaying) {
        setShowControls(false);
      }
    };

    const handleMouseEnter = () => {
      setIsHovering(true);
      // Show immediately when entering
      setShowControls(true);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [showControlsWithTimeout, hideControls, isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      // Hide controls immediately when video starts playing (unless hovering)
      if (!isHovering && !isDragging) {
        setShowControls(false);
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
      onTimeUpdate?.(time, video.duration);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleProgress = () => {
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
  }, [onTimeUpdate, hideControls]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // HLS setup
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
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  // Update playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    showControlsWithTimeout();
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
    showControlsWithTimeout();
  };

  const handleVolumeButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // On both mobile and desktop, toggle mute on click
    // Desktop: slider shows on hover
    // Mobile: only toggle mute, no slider
    handleToggleMute();
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
    showControlsWithTimeout();
  };

  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    showControlsWithTimeout();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (clientX === undefined) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * video.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
    showControlsWithTimeout();
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const hoverTimeValue = percent * video.duration;
    setHoverTime(hoverTimeValue);
    
  };


  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleProgressClick(e);
  };

  if (!src) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`${className} relative bg-black group select-none`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onMouseMove={showControlsWithTimeout}
      onTouchStart={() => {
        if (isMobile) {
          // Show controls on touch
          setShowControls(true);
        }
      }}
      onTouchEnd={() => {
        if (isMobile && isPlaying) {
          // Hide controls immediately after touch ends on mobile
          setTimeout(() => {
            if (isPlaying && !isDragging) {
              setShowControls(false);
            }
          }, 2000);
        }
      }}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain cursor-pointer select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }}
        title={title}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        controls={false}
        onClick={(e) => {
          e.stopPropagation();
          handleTogglePlay();
        }}
        onContextMenu={(e) => {
          // Prevent right-click context menu
          e.preventDefault();
        }}
      />

      {/* Center Play Button */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          style={{
            opacity: showControls ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePlay();
            }}
            className={`pointer-events-auto rounded-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] backdrop-blur-sm border-2 border-[#F6C453]/50 hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 hover:border-[#F6C453] hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-[0_8px_25px_rgba(246,196,83,0.4)] hover:shadow-[0_12px_35px_rgba(246,196,83,0.5)] ${isMobile ? 'w-14 h-14' : 'w-20 h-20'}`}
            aria-label="Phát"
          >
            <Play className={`text-black ml-1 ${isMobile ? 'w-7 h-7' : 'w-10 h-10'}`} fill="black" />
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <div className="bg-gradient-to-b from-black/80 via-black/60 to-transparent px-4 py-3">
          <h3 className="text-white text-sm font-medium truncate">{title}</h3>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 py-3 space-y-3">
          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            className="relative h-1 bg-white/20 rounded-full cursor-pointer pointer-events-auto group/progress touch-none"
            onMouseEnter={() => {
              setIsHoveringProgress(true);
            }}
            onMouseLeave={() => {
              setIsHoveringProgress(false);
              setHoverTime(null);
            }}
            onMouseMove={handleProgressMouseMove}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging(true);
              handleProgressClick(e);
            }}
            onMouseUp={() => {
              setIsDragging(false);
            }}
            onMouseLeaveCapture={() => {
              setIsDragging(false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
              // Set hover time for mobile tooltip
              const video = videoRef.current;
              const progressBar = progressBarRef.current;
              if (video && progressBar && e.touches[0]) {
                const rect = progressBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                const hoverTimeValue = percent * video.duration;
                setHoverTime(hoverTimeValue);
                // Seek to the position
                video.currentTime = hoverTimeValue;
                setCurrentTime(hoverTimeValue);
              }
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Update hover time and seek for mobile tooltip
              const video = videoRef.current;
              const progressBar = progressBarRef.current;
              if (video && progressBar && e.touches[0]) {
                const rect = progressBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                const hoverTimeValue = percent * video.duration;
                setHoverTime(hoverTimeValue);
                // Update video time while dragging
                video.currentTime = hoverTimeValue;
                setCurrentTime(hoverTimeValue);
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              // Keep tooltip visible briefly on mobile, then hide
              const wasDragging = true;
              setTimeout(() => {
                setHoverTime(null);
              }, 800);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragging) {
                handleProgressClick(e);
              }
            }}
          >
            {/* Buffered progress */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-all"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Current progress */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Progress thumb - always visible on mobile, hover on desktop */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] ${isMobile || isHoveringProgress || isDragging ? 'opacity-100' : 'opacity-0'} transition-opacity pointer-events-none shadow-[0_0_8px_rgba(246,196,83,0.6)]`}
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
            {/* Timeline tooltip - show on both mobile and desktop */}
            {hoverTime !== null && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-50"
                style={{ left: `${((hoverTime / duration) * 100)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="px-2 py-1 bg-black/95 backdrop-blur-sm rounded text-white text-xs whitespace-nowrap border border-white/20 shadow-lg">
                  {formatTime(hoverTime)}
                </div>
              </div>
            )}
            {/* Range input for better drag support - desktop only */}
            {!isMobile && (
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (!video) return;
                  const value = parseFloat(e.target.value);
                  video.currentTime = value;
                  setCurrentTime(value);
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onMouseUp={() => {
                  setIsDragging(false);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-full
                  [&::-webkit-slider-thumb]:h-full
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:w-full
                  [&::-moz-range-thumb]:h-full
                  [&::-moz-range-thumb]:cursor-pointer"
              />
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePlay();
                }}
                className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? (
                  <Pause className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="white" />
                ) : (
                  <Play className={`text-white ml-0.5 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="white" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip(-10);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 transition-all"
                aria-label="Lùi 10 giây"
              >
                <SkipBack className="w-4 h-4 text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip(10);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 transition-all"
                aria-label="Tới 10 giây"
              >
                <SkipForward className="w-4 h-4 text-white" />
              </button>

              {/* Volume - Inline slider for desktop */}
              <div className="relative flex items-center gap-2">
                <button
                  onClick={handleVolumeButtonClick}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all"
                  aria-label="Âm lượng"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                {/* Inline volume slider - desktop only */}
                {!isMobile && (
                  <div className="relative w-24 h-6 flex items-center">
                    {/* Background track */}
                    <div className="absolute inset-x-0 h-1 rounded-full bg-white/20" />
                    {/* Progress fill */}
                    <div
                      className="absolute inset-x-0 left-0 h-1 rounded-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] transition-all"
                      style={{ width: `${volume * 100}%` }}
                    />
                    {/* Slider input */}
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => {
                        handleVolumeChange(e);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      className="relative z-10 w-full h-1 appearance-none cursor-pointer bg-transparent
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[#F6C453]
                        [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(246,196,83,0.6)]
                        [&::-webkit-slider-thumb]:hover:scale-125
                        [&::-webkit-slider-thumb]:active:scale-125
                        [&::-moz-range-thumb]:w-3
                        [&::-moz-range-thumb]:h-3
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[#F6C453]
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:hover:scale-125
                        [&::-moz-range-thumb]:active:scale-125"
                    />
                  </div>
                )}
              </div>

              {/* Time Display - Hidden on mobile */}
              {!isMobile && (
                <div className="text-white text-sm font-medium tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Settings */}
              <div className="relative z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                  }}
                  className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                  aria-label="Cài đặt"
                >
                  <Settings className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </button>
                {showSettings && (
                  <div className={`absolute ${isMobile ? 'bottom-full left-0 mb-2' : 'bottom-full right-0 mb-2'} min-w-[160px] w-auto bg-black/95 backdrop-blur-sm rounded-lg p-2 space-y-1 border border-white/10 shadow-2xl z-[100] pointer-events-auto`}>
                    <div className="text-white text-xs px-3 py-2 border-b border-white/10 font-medium whitespace-nowrap">Tốc độ phát</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaybackRate(rate);
                          setShowSettings(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gradient-to-r hover:from-[#F6C453]/10 hover:to-[#D3A13A]/10 active:bg-gradient-to-r active:from-[#F6C453]/20 active:to-[#D3A13A]/20 transition-all whitespace-nowrap ${
                          playbackRate === rate
                            ? "text-[#F6C453] font-medium bg-gradient-to-r from-[#F6C453]/10 to-[#D3A13A]/10"
                            : "text-white"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFullscreen();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 transition-all"
                aria-label="Toàn màn hình"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-white" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside settings to close */}
      {showSettings && (
        <div
          className={`fixed inset-0 ${isMobile ? 'z-[90]' : 'z-20'}`}
          onClick={() => {
            setShowSettings(false);
          }}
          onTouchStart={(e) => {
            // Prevent event bubbling on mobile
            e.stopPropagation();
          }}
        />
      )}

    </div>
  );
}

