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
  FastForward,
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
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const showSettingsRef = useRef(false);

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
  const [isIOS, setIsIOS] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [gestureIndicator, setGestureIndicator] = useState<{
    type: 'brightness' | 'volume';
    value: number;
  } | null>(null);

  // Long press state for 2x speed
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isLongPressActiveRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Gesture state for brightness and volume
  const gestureStartXRef = useRef<number>(0);
  const gestureStartYRef = useRef<number>(0);
  const gestureInitialBrightnessRef = useRef<number>(1);
  const gestureInitialVolumeRef = useRef<number>(1);
  const gestureModeRef = useRef<'none' | 'brightness' | 'volume' | 'horizontal'>('none');
  const gestureIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-hide controls - hide with delay when playing, but not when interacting
  const hideControls = useCallback(() => {
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Only hide if playing and not interacting
    if (isPlaying && !isHoveringRef.current && !isDraggingRef.current && !showSettingsRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        // Double check before hiding
        const video = videoRef.current;
        if (video && !video.paused && !isHoveringRef.current && !isDraggingRef.current && !showSettingsRef.current) {
          setShowControls(false);
        }
      }, 2000); // 2 second delay
    }
  }, [isPlaying]);

  const showControlsWithTimeout = useCallback(() => {
    // Show controls immediately
    setShowControls(true);
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set timeout to hide after 2 seconds if playing and not interacting
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        const video = videoRef.current;
        if (video && !video.paused && !isHoveringRef.current && !isDraggingRef.current && !showSettingsRef.current) {
          setShowControls(false);
        }
      }, 2000);
    }
  }, [isPlaying]);

  // Mouse movement handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      showControlsWithTimeout();
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      isHoveringRef.current = false;
      // Hide with delay when leaving if playing
      if (isPlaying) {
        hideControls();
      }
    };

    const handleMouseEnter = () => {
      setIsHovering(true);
      isHoveringRef.current = true;
      // Show immediately when entering
      setShowControls(true);
      // Clear timeout when entering
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
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
      // Hide controls with delay when video starts playing (unless interacting)
      if (!isHoveringRef.current && !isDraggingRef.current && !showSettingsRef.current) {
        hideControls();
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

  // Sync showSettings state with ref
  useEffect(() => {
    showSettingsRef.current = showSettings;
  }, [showSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (gestureIndicatorTimeoutRef.current) {
        clearTimeout(gestureIndicatorTimeoutRef.current);
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
    const video = videoRef.current;
    const container = containerRef.current;
    if (!container) return;

    // iOS Safari requires webkitEnterFullscreen on video element
    if (isIOS && video) {
      if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
      showControlsWithTimeout();
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

  // Handle long press for 2x speed on mobile (works in fullscreen too)
  const handleLongPressTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Don't trigger long press if touching controls
    const target = e.target as HTMLElement;
    if (target.closest('[data-settings-menu]') || 
        target.closest('button') || 
        target.closest('input') ||
        target.closest('.pointer-events-auto')) {
      return;
    }
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Store touch start info
    touchStartTimeRef.current = now;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isLongPressActiveRef.current = false;
    
    // Cancel if double tap (within 300ms)
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      lastTapRef.current = 0;
      return;
    }
    
    lastTapRef.current = now;
    
    // Don't start long press timer immediately - wait to see if user moves
    // Timer will be started in handleLongPressTouchMove if no significant movement
  };

  const handleLongPressTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Don't interfere if touching controls
    const target = e.target as HTMLElement;
    if (target.closest('[data-settings-menu]') || 
        target.closest('button') || 
        target.closest('input') ||
        target.closest('.pointer-events-auto')) {
      return;
    }
    
    // Don't start long press if gesture mode is already active (brightness/volume)
    if (gestureModeRef.current === 'brightness' || gestureModeRef.current === 'volume') {
      // Cancel any existing long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      // Cancel active long press if any
      if (isLongPressActiveRef.current) {
        isLongPressActiveRef.current = false;
        setPlaybackRate(1);
        setShowSpeedIndicator(false);
      }
      return;
    }
    
    const touch = e.touches[0];
    if (!touch) return;
    
    // Calculate movement distance
    const moveThreshold = 15; // pixels
    const moveDistance = Math.sqrt(
      Math.pow(touch.clientX - touchStartXRef.current, 2) + 
      Math.pow(touch.clientY - touchStartYRef.current, 2)
    );
    
    // If user moves significantly, cancel long press
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
    } else {
      // User is holding still - start long press timer if not already started
      if (!longPressTimerRef.current && !isLongPressActiveRef.current) {
        const timeSinceTouchStart = Date.now() - touchStartTimeRef.current;
        const remainingTime = Math.max(0, 500 - timeSinceTouchStart);
        
        longPressTimerRef.current = setTimeout(() => {
          const video = videoRef.current;
          if (video && !isLongPressActiveRef.current && 
              (gestureModeRef.current === 'none' || gestureModeRef.current === 'horizontal')) {
            isLongPressActiveRef.current = true;
            setPlaybackRate(2);
            setShowSpeedIndicator(true);
            showControlsWithTimeout();
          }
          longPressTimerRef.current = null;
        }, remainingTime);
      }
    }
  };

  const handleLongPressTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Cancel long press timer if it hasn't fired yet
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If long press was active, reset to normal speed after a short delay
    if (isLongPressActiveRef.current) {
      setTimeout(() => {
        isLongPressActiveRef.current = false;
        setPlaybackRate(1);
        setShowSpeedIndicator(false);
      }, 100);
    }
  };

  // Handle vertical swipe gestures for brightness and volume (Netflix-style) - Mobile only
  const handleTouchStartGesture = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Don't interfere with controls or progress bar
    const target = e.target as HTMLElement;
    if (target.closest('[data-settings-menu]') || 
        target.closest('button') || 
        target.closest('input') ||
        target.closest('.pointer-events-auto') ||
        target.closest('[class*="progress"]')) {
      return;
    }

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const touch = e.touches[0];
    if (!touch) return;

    gestureStartXRef.current = touch.clientX;
    gestureStartYRef.current = touch.clientY;
    gestureInitialBrightnessRef.current = brightness;
    // If video is muted, use 0 as initial volume for gesture calculation
    // Otherwise use the actual video volume
    gestureInitialVolumeRef.current = video.muted ? 0 : video.volume;
    gestureModeRef.current = 'none';
  };

  const handleTouchMoveGesture = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - gestureStartXRef.current;
    const dy = touch.clientY - gestureStartYRef.current;
    const threshold = 10;

    // Determine gesture mode
    if (gestureModeRef.current === 'none') {
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe - seeking (handled by progress bar)
        gestureModeRef.current = 'horizontal';
        return;
      } else {
        // Vertical swipe - determine left or right side
        // Cancel long press timer immediately when vertical gesture is detected
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        
        // Cancel active long press if any
        if (isLongPressActiveRef.current) {
          isLongPressActiveRef.current = false;
          setPlaybackRate(1);
          setShowSpeedIndicator(false);
        }
        
        const rect = container.getBoundingClientRect();
        const isLeftSide = touch.clientX < rect.left + rect.width / 2;
        gestureModeRef.current = isLeftSide ? 'brightness' : 'volume';
      }
    }

    // Handle brightness (left side) - swipe up to increase, down to decrease
    if (gestureModeRef.current === 'brightness') {
      const delta = -dy / 300; // 300px = full range
      const newBrightness = Math.min(1, Math.max(0, gestureInitialBrightnessRef.current + delta));
      setBrightness(newBrightness);
      
      // Show indicator
      setGestureIndicator({
        type: 'brightness',
        value: newBrightness,
      });
      
      // Clear existing timeout
      if (gestureIndicatorTimeoutRef.current) {
        clearTimeout(gestureIndicatorTimeoutRef.current);
      }
      
      // Hide indicator after delay
      gestureIndicatorTimeoutRef.current = setTimeout(() => {
        setGestureIndicator(null);
      }, 1000);
      
      showControlsWithTimeout();
      e.preventDefault(); // Prevent scrolling
      return;
    }

    // Handle volume (right side) - swipe up to increase, down to decrease
    if (gestureModeRef.current === 'volume') {
      const delta = -dy / 200; // 200px = full range
      const newVolume = Math.min(1, Math.max(0, gestureInitialVolumeRef.current + delta));
      
      // Unmute first if volume is increased above 0 (important for mobile browsers)
      if (newVolume > 0 && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
      
      // Set volume after unmuting
      video.volume = newVolume;
      setVolume(newVolume);
      
      // If volume is 0, mute the video
      if (newVolume === 0 && !video.muted) {
        video.muted = true;
        setIsMuted(true);
      }
      
      // Show indicator
      setGestureIndicator({
        type: 'volume',
        value: newVolume,
      });
      
      // Clear existing timeout
      if (gestureIndicatorTimeoutRef.current) {
        clearTimeout(gestureIndicatorTimeoutRef.current);
      }
      
      // Hide indicator after delay
      gestureIndicatorTimeoutRef.current = setTimeout(() => {
        setGestureIndicator(null);
      }, 1000);
      
      showControlsWithTimeout();
      e.preventDefault(); // Prevent scrolling
      return;
    }
  };

  const handleTouchEndGesture = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Reset gesture mode
    gestureModeRef.current = 'none';
    
    // Hide indicator after a short delay
    if (gestureIndicatorTimeoutRef.current) {
      clearTimeout(gestureIndicatorTimeoutRef.current);
    }
    gestureIndicatorTimeoutRef.current = setTimeout(() => {
      setGestureIndicator(null);
    }, 1000);
  };

  if (!src) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`${className} relative bg-black group select-none`}
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none',
        filter: `brightness(${brightness})`,
        ...(isFullscreen ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } : {})
      }}
      onMouseMove={showControlsWithTimeout}
      onTouchStart={(e) => {
        if (isMobile) {
          // Show controls on touch
          setShowControls(true);
          // Handle long press for 2x speed
          handleLongPressTouchStart(e);
          // Handle gesture for brightness/volume
          handleTouchStartGesture(e);
        }
      }}
      onTouchMove={(e) => {
        if (isMobile) {
          // Always try to handle gesture first to determine mode
          handleTouchMoveGesture(e);
          // Only handle long press if not in gesture mode
          if (gestureModeRef.current === 'none' || gestureModeRef.current === 'horizontal') {
            handleLongPressTouchMove(e);
          }
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          // Handle gesture end
          handleTouchEndGesture(e);
          // Handle long press end
          handleLongPressTouchEnd(e);
          
          if (isPlaying) {
            // Hide controls after 2 seconds if not interacting
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
              const video = videoRef.current;
              if (video && !video.paused && !isHoveringRef.current && !isDraggingRef.current && !showSettingsRef.current) {
                setShowControls(false);
              }
            }, 2000);
          }
        }
      }}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain cursor-pointer select-none"
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none', 
          pointerEvents: 'auto', 
          touchAction: 'manipulation',
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
        onClick={(e) => {
          e.stopPropagation();
          handleTogglePlay();
        }}
        onContextMenu={(e) => {
          // Prevent right-click context menu
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            handleLongPressTouchStart(e);
            handleTouchStartGesture(e);
          }
        }}
        onTouchMove={(e) => {
          if (isMobile) {
            // Always try to handle gesture first to determine mode
            handleTouchMoveGesture(e);
            // Only handle long press if not in gesture mode
            if (gestureModeRef.current === 'none' || gestureModeRef.current === 'horizontal') {
              handleLongPressTouchMove(e);
            }
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            handleTouchEndGesture(e);
            handleLongPressTouchEnd(e);
          }
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
              setIsDragging(false);
              isDraggingRef.current = false;
            }}
            onMouseMove={handleProgressMouseMove}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging(true);
              isDraggingRef.current = true;
              handleProgressClick(e);
            }}
            onMouseUp={() => {
              setIsDragging(false);
              isDraggingRef.current = false;
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
              isDraggingRef.current = true;
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
              isDraggingRef.current = false;
              // Keep tooltip visible briefly on mobile, then hide
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
                  isDraggingRef.current = true;
                }}
                onMouseUp={() => {
                  setIsDragging(false);
                  isDraggingRef.current = false;
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
                className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                aria-label="Lùi 10 giây"
              >
                <SkipBack className={`text-white ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              </button>

              {/* Skip Forward */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip(10);
                }}
                className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                aria-label="Tới 10 giây"
              >
                <SkipForward className={`text-white ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              </button>

              {/* Volume - Inline slider for desktop */}
              <div className="relative flex items-center gap-2">
                <button
                  onClick={handleVolumeButtonClick}
                  className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                  aria-label="Âm lượng"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  ) : (
                    <Volume2 className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
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
                    const newValue = !showSettings;
                    setShowSettings(newValue);
                    showSettingsRef.current = newValue;
                  }}
                  className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                  aria-label="Cài đặt"
                >
                  <Settings className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </button>
                {showSettings && (
                  <>
                    {isMobile ? (
                      // Mobile: Full overlay panel
                      <div 
                        data-settings-menu
                        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] pointer-events-auto flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <div className="w-full max-w-sm px-3 py-4">
                          <div className="text-white text-sm font-semibold mb-3 text-center">Tốc độ phát</div>
                          <div className="space-y-1.5">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setPlaybackRate(rate);
                                  setShowSettings(false);
                                  showSettingsRef.current = false;
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setPlaybackRate(rate);
                                  setShowSettings(false);
                                  showSettingsRef.current = false;
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gradient-to-r hover:from-[#F6C453]/10 hover:to-[#D3A13A]/10 active:bg-gradient-to-r active:from-[#F6C453]/20 active:to-[#D3A13A]/20 transition-all ${
                                  playbackRate === rate
                                    ? "text-[#F6C453] font-semibold bg-gradient-to-r from-[#F6C453]/10 to-[#D3A13A]/10 border border-[#F6C453]/30"
                                    : "text-white border border-white/10"
                                }`}
                                style={{ 
                                  WebkitTapHighlightColor: 'transparent',
                                  touchAction: 'manipulation',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none'
                                }}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSettings(false);
                              showSettingsRef.current = false;
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowSettings(false);
                              showSettingsRef.current = false;
                            }}
                            className="mt-3 w-full px-3 py-1.5 text-white text-xs rounded-lg border border-white/20 hover:bg-white/10 active:bg-white/20 transition-all"
                            style={{ 
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation'
                            }}
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Desktop: Small dropdown menu
                      <div 
                        data-settings-menu
                        className="absolute bottom-full right-0 mb-2 min-w-[160px] w-auto bg-black/95 backdrop-blur-sm rounded-lg p-2 space-y-1 border border-white/10 shadow-2xl z-[110] pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.tagName !== 'BUTTON') {
                            e.stopPropagation();
                          }
                        }}
                      >
                        <div className="text-white text-xs px-3 py-2 border-b border-white/10 font-medium whitespace-nowrap pointer-events-none">Tốc độ phát</div>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setPlaybackRate(rate);
                              setShowSettings(false);
                              showSettingsRef.current = false;
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
                  </>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFullscreen();
                }}
                className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#F6C453]/20 hover:to-[#D3A13A]/20 hover:border hover:border-[#F6C453]/50 active:bg-gradient-to-r active:from-[#F6C453]/30 active:to-[#D3A13A]/30 transition-all ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                aria-label="Toàn màn hình"
              >
                {isFullscreen ? (
                  <Minimize2 className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                ) : (
                  <Maximize2 className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Speed indicator icon for mobile when at 2x - works in fullscreen too */}
      {showSpeedIndicator && isMobile && playbackRate === 2 && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none z-[100]">
          <div className="bg-black/40 rounded-full p-2 backdrop-blur-sm">
            <FastForward className="w-4 h-4 text-[#F6C453]" />
          </div>
        </div>
      )}

      {/* Gesture indicator for brightness and volume */}
      {gestureIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
          <div className="flex flex-col items-center gap-3">
            {/* Icon */}
            <div className="bg-black/80 rounded-full p-4 backdrop-blur-sm">
              {gestureIndicator.type === 'brightness' ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <Volume2 className="w-8 h-8 text-white" />
              )}
            </div>
            {/* Value */}
            <div className="bg-black/80 rounded-lg px-6 py-3 backdrop-blur-sm">
              <div className="text-white text-2xl font-semibold">
                {gestureIndicator.type === 'brightness'
                  ? `${Math.round(gestureIndicator.value * 100)}%`
                  : gestureIndicator.value === 0
                  ? 'Tắt tiếng'
                  : `${Math.round(gestureIndicator.value * 100)}%`}
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.max(0, gestureIndicator.value * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Click outside settings to close - only for desktop */}
      {showSettings && !isMobile && (
        <div
          className="fixed inset-0 z-20"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-settings-menu]')) {
              setShowSettings(false);
              showSettingsRef.current = false;
            }
          }}
        />
      )}

    </div>
  );
}

