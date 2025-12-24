"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "lucide-react";

interface NetflixPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  title?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

async function loadShaka() {
  const mod: any = await import("shaka-player/dist/shaka-player.compiled.js");
  return mod.default || mod;
}

export function NetflixPlayer({
  src,
  poster,
  className = "w-full h-full",
  title,
  onTimeUpdate,
}: NetflixPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeSliderRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedHUD, setShowSpeedHUD] = useState(false);
  const speedHUDTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile gesture state
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekDelta, setSeekDelta] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [volumeDelta, setVolumeDelta] = useState(0);
  const [keyboardSeekDelta, setKeyboardSeekDelta] = useState(0);
  const [showKeyboardHUD, setShowKeyboardHUD] = useState(false);
  const keyboardHUDTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isForceTouching, setIsForceTouching] = useState(false);
  const forceTouchStartTime = useRef(0);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const startVolume = useRef(0);
  const gestureType = useRef<"seek" | "volume" | "brightness" | "speed" | null>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Double tap state
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Shaka Player
  useEffect(() => {
    let destroyed = false;
    let player: any = null;

    async function init() {
      const video = videoRef.current;
      if (!video || !src) return;

      try {
        setIsLoading(true);
        const shaka = await loadShaka();
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          setError("Trình duyệt không hỗ trợ Shaka Player.");
          setIsLoading(false);
          return;
        }

        if (destroyed) return;

        player = new shaka.Player(video);
        playerRef.current = player;

        // Configure player
        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 2,
            bufferBehind: 30,
          },
        });

        await player.load(src);
        setIsLoading(false);
      } catch (err) {
        if (!destroyed) {
          setError("Không phát được video (m3u8).");
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      if (player) {
        player.destroy().catch(() => {});
      }
      // Cleanup speed HUD timeout
      if (speedHUDTimeoutRef.current) {
        clearTimeout(speedHUDTimeoutRef.current);
      }
      // Cleanup tap timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      // Cleanup long press timeout
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, [src]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const dur = video.duration || 0;
      
      // Only update if values are valid
      if (!isNaN(current) && current >= 0) {
        setCurrentTime(current);
      }
      if (!isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
      onTimeUpdate?.(current, dur);

      // Update buffered progress
      if (video.buffered.length > 0 && dur > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / dur) * 100);
      }
    };

    const handleSeeking = () => {
      // Prevent any interference during seek
      setIsLoading(true);
    };

    const handleSeeked = () => {
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [onTimeUpdate]);

  // Fullscreen handler (supports both standard and webkit APIs for iOS)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isWebkit = doc.webkitFullscreenElement !== undefined;
      
      if (isWebkit) {
        setIsFullscreen(!!doc.webkitFullscreenElement);
      } else {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      const container = containerRef.current;
      if (!video || !container) return;

      // Only handle keyboard shortcuts when player is visible/focused
      // Check if user is interacting with input/textarea (don't interfere)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(-10, true); // Show HUD
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(10, true); // Show HUD
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (keyboardHUDTimeoutRef.current) {
        clearTimeout(keyboardHUDTimeoutRef.current);
      }
    };
  }, []);

  // Player controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    resetControlsTimeout();
  };

  const seek = (seconds: number, showHUD = false) => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure duration is loaded before seeking
    if (!duration || isNaN(duration) || duration === 0) {
      // Wait for duration to be available
      const checkDuration = () => {
        if (video.duration && video.duration > 0) {
          const newTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
          video.currentTime = newTime;
          resetControlsTimeout();

          // Show HUD for keyboard seek
          if (showHUD) {
            setKeyboardSeekDelta(seconds);
            setShowKeyboardHUD(true);
            
            // Clear existing timeout
            if (keyboardHUDTimeoutRef.current) {
              clearTimeout(keyboardHUDTimeoutRef.current);
            }
            
            // Hide HUD after 1 second
            keyboardHUDTimeoutRef.current = setTimeout(() => {
              setShowKeyboardHUD(false);
              setKeyboardSeekDelta(0);
            }, 1000);
          }
        } else {
          // Retry after a short delay
          setTimeout(checkDuration, 100);
        }
      };
      checkDuration();
      return;
    }

    const newTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    
    // Use requestAnimationFrame to ensure video is ready
    requestAnimationFrame(() => {
      if (video && !video.paused) {
        video.currentTime = newTime;
      } else if (video) {
        video.currentTime = newTime;
      }
    });
    
    resetControlsTimeout();

    // Show HUD for keyboard seek
    if (showHUD) {
      setKeyboardSeekDelta(seconds);
      setShowKeyboardHUD(true);
      
      // Clear existing timeout
      if (keyboardHUDTimeoutRef.current) {
        clearTimeout(keyboardHUDTimeoutRef.current);
      }
      
      // Hide HUD after 1 second
      keyboardHUDTimeoutRef.current = setTimeout(() => {
        setShowKeyboardHUD(false);
        setKeyboardSeekDelta(0);
      }, 1000);
    }
  };

  const seekTo = (percent: number) => {
    const video = videoRef.current;
    if (!video) return;

    // Use actual video duration if state duration is not available
    const videoDuration = video.duration || duration;
    if (!videoDuration || isNaN(videoDuration) || videoDuration === 0) return;

    const targetTime = (percent / 100) * videoDuration;
    
    // Use requestAnimationFrame to ensure video is ready
    requestAnimationFrame(() => {
      if (video) {
        video.currentTime = Math.max(0, Math.min(targetTime, videoDuration));
      }
    });
    
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    resetControlsTimeout();
  };

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = newVolume;
    video.muted = newVolume === 0;
    resetControlsTimeout();
  };

  const setVolumeValue = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    video.muted = value === 0;
    setShowVolumeSlider(false);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    try {
      const doc = document as any;
      
      // Check if already in fullscreen
      const isFullscreenActive = 
        document.fullscreenElement || 
        doc.webkitFullscreenElement || 
        doc.mozFullScreenElement || 
        doc.msFullscreenElement;

      if (isFullscreenActive) {
        // Exit fullscreen
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      } else {
        // Enter fullscreen
        // iOS Safari: Try video element first, then container
        if (isIOS) {
          // iOS Safari prefers video element for fullscreen
          if ((video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          } else if ((container as any).webkitRequestFullscreen) {
            await (container as any).webkitRequestFullscreen();
          } else if (container.requestFullscreen) {
            await container.requestFullscreen();
          }
        } else {
          // Standard fullscreen API for other browsers
          if (container.requestFullscreen) {
            await container.requestFullscreen();
          } else if ((container as any).webkitRequestFullscreen) {
            await (container as any).webkitRequestFullscreen();
          } else if ((container as any).mozRequestFullScreen) {
            await (container as any).mozRequestFullScreen();
          } else if ((container as any).msRequestFullscreen) {
            await (container as any).msRequestFullscreen();
          }
        }
      }
      resetControlsTimeout();
    } catch (err) {
      console.error("Fullscreen error:", err);
      // Fallback: Try video element directly on iOS
      if (isIOS && video) {
        try {
          if ((video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        } catch (fallbackErr) {
          console.error("Fullscreen fallback error:", fallbackErr);
        }
      }
    }
  };

  // Mobile gesture handlers (works in both normal and fullscreen mode)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    // Reset gesture state
    setIsSeeking(false);
    setSeekDelta(0);
    setVolumeDelta(0);
    gestureType.current = null;

    // iOS: Check for force touch (pressure > 0.7 or webkitForce)
    if (isIOS) {
      const pressure = (e as any).pressure || (e.nativeEvent as any).webkitForce || 0;
      
      // If force touch detected (pressure > 0.7), activate speed control
      if (pressure > 0.7) {
        setIsForceTouching(true);
        gestureType.current = "speed";
        forceTouchStartTime.current = Date.now();
        setShowSpeedHUD(true);
        
        // Set initial speed based on pressure with smoother mapping
        const minSpeed = 0.5;
        const maxSpeed = 2.0;
        const speedRange = maxSpeed - minSpeed;
        // Normalize pressure from 0.7-1.0 to 0-1, then apply easing for smoother response
        const normalizedPressure = Math.min(1, Math.max(0, (pressure - 0.7) / 0.3));
        // Apply easing function for smoother speed changes
        const easedPressure = normalizedPressure * normalizedPressure; // Quadratic easing
        const initialSpeed = minSpeed + (easedPressure * speedRange);
        // Round to nearest 0.25x increment
        const roundedSpeed = Math.round(initialSpeed * 4) / 4;
        video.playbackRate = roundedSpeed;
        setPlaybackSpeed(roundedSpeed);
        
        resetControlsTimeout();
        return;
      }
    } else {
      // Android: Use long press (500ms) to activate speed control
      longPressTimeoutRef.current = setTimeout(() => {
        setIsForceTouching(true);
        gestureType.current = "speed";
        forceTouchStartTime.current = Date.now();
        setShowSpeedHUD(true);
        // Start at 1.0x speed
        video.playbackRate = 1.0;
        setPlaybackSpeed(1.0);
        resetControlsTimeout();
      }, 500);
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = video.currentTime;
    startVolume.current = video.volume;
    resetControlsTimeout();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    // Get container bounds (works in both normal and fullscreen)
    const container = containerRef.current;
    if (!container) return;

    // Handle force touch / long press speed control
    if (gestureType.current === "speed" && isForceTouching) {
      if (isIOS) {
        // iOS: Use pressure sensitivity
        const pressure = (e as any).pressure || (e.nativeEvent as any).webkitForce || 0;
        
        if (pressure > 0.7) {
          // Calculate speed based on pressure (0.7-1.0 pressure maps to 0.5x-2.0x speed)
          const minSpeed = 0.5;
          const maxSpeed = 2.0;
          const speedRange = maxSpeed - minSpeed;
          // Normalize pressure from 0.7-1.0 to 0-1
          const normalizedPressure = Math.min(1, Math.max(0, (pressure - 0.7) / 0.3));
          // Apply easing function for smoother, more controlled speed changes
          const easedPressure = normalizedPressure * normalizedPressure; // Quadratic easing
          const newSpeed = minSpeed + (easedPressure * speedRange);
          
          // Round to nearest 0.25x increment for cleaner UI
          const roundedSpeed = Math.round(newSpeed * 4) / 4;
          video.playbackRate = roundedSpeed;
          setPlaybackSpeed(roundedSpeed);
          setShowSpeedHUD(true);
          
          // Clear existing timeout
          if (speedHUDTimeoutRef.current) {
            clearTimeout(speedHUDTimeoutRef.current);
          }
        } else if (pressure <= 0.7) {
          // Pressure dropped below threshold, reset speed
          video.playbackRate = 1;
          setPlaybackSpeed(1);
          setShowSpeedHUD(false);
          setIsForceTouching(false);
          gestureType.current = null;
        }
      } else {
        // Android: Use vertical swipe distance to control speed
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const deltaY = startY.current - e.clientY; // Negative = up (faster), positive = down (slower)
        const maxDelta = containerRect.height * 0.4; // Use container height for better responsiveness
        const normalizedDelta = Math.max(-1, Math.min(1, deltaY / maxDelta));
        
        // Map -1 to 1 (down to up) to 0.5x to 2.0x speed
        const minSpeed = 0.5;
        const maxSpeed = 2.0;
        const speedRange = maxSpeed - minSpeed;
        // Invert: up (negative delta) = faster, down (positive delta) = slower
        const speedFactor = (normalizedDelta + 1) / 2; // Convert -1..1 to 0..1
        const newSpeed = minSpeed + (speedFactor * speedRange);
        
        // Round to nearest 0.25x increment
        const roundedSpeed = Math.round(newSpeed * 4) / 4;
        video.playbackRate = roundedSpeed;
        setPlaybackSpeed(roundedSpeed);
        setShowSpeedHUD(true);
        
        // Clear existing timeout
        if (speedHUDTimeoutRef.current) {
          clearTimeout(speedHUDTimeoutRef.current);
        }
      }
      return;
    }

    // Don't process other gestures if speed control is active
    if (gestureType.current === "speed") {
      return;
    }

    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Cancel long press timeout if user starts moving (not a long press)
    if (longPressTimeoutRef.current && (absDeltaX > 5 || absDeltaY > 5)) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // Determine gesture type on first significant movement
    // Only set gesture type if not already set and movement is significant
    if (!gestureType.current && (absDeltaX > 10 || absDeltaY > 10)) {
      if (absDeltaX > absDeltaY) {
        // Horizontal movement = seek
        gestureType.current = "seek";
      } else {
        // Vertical movement = brightness or volume based on position
        const rect = container.getBoundingClientRect();
        const touchX = e.clientX - rect.left;
        const isLeftHalf = touchX < rect.width / 2;
        gestureType.current = isLeftHalf ? "brightness" : "volume";
      }
    }

    // Process gestures (only if not in speed mode)
    const containerRect = container.getBoundingClientRect();
    
    if (gestureType.current === "seek") {
      const seekSeconds = (deltaX / containerRect.width) * duration;
      setSeekDelta(seekSeconds);
      setIsSeeking(true);
    } else if (gestureType.current === "brightness") {
      // Swipe down = darker, swipe up = brighter
      const brightnessChange = 1 - (deltaY / (containerRect.height * 0.5));
      const newBrightness = Math.max(0.3, Math.min(1, brightnessChange));
      setBrightness(newBrightness);
    } else if (gestureType.current === "volume") {
      // Swipe down = quieter, swipe up = louder
      const volumeChange = 1 - (deltaY / (containerRect.height * 0.5));
      const newVolume = Math.max(0, Math.min(1, volumeChange));
      video.volume = newVolume;
      video.muted = newVolume === 0;
      setVolumeDelta(newVolume - startVolume.current);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    // Cancel long press timeout if it exists (Android)
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // Handle force touch / long press release
    if (gestureType.current === "speed" && isForceTouching) {
      // Reset speed to 1x after a short delay
      if (speedHUDTimeoutRef.current) {
        clearTimeout(speedHUDTimeoutRef.current);
      }
      
      speedHUDTimeoutRef.current = setTimeout(() => {
        if (video) {
          video.playbackRate = 1;
          setPlaybackSpeed(1);
        }
        setShowSpeedHUD(false);
      }, 500);
      
      setIsForceTouching(false);
      gestureType.current = null;
      resetControlsTimeout();
      return;
    }

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (gestureType.current === "seek" && isSeeking) {
      video.currentTime = Math.max(0, Math.min(startTime.current + seekDelta, duration));
    }

    setIsSeeking(false);
    setSeekDelta(0);
    setVolumeDelta(0);
    setBrightness(1);
    gestureType.current = null;
    resetControlsTimeout();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Toggle play/pause on center click (not on controls)
    const target = e.target as HTMLElement;
    if (!target.closest(".player-controls") && !target.closest("video")) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // 300ms để detect double tap
      
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        e.preventDefault();
        e.stopPropagation();
        
        // Clear single tap timeout
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
          tapTimeoutRef.current = null;
        }
        
        // Determine tap position (left or right half)
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const tapX = e.clientX - rect.left;
          const isLeftHalf = tapX < rect.width / 2;
          
          // Seek backward 10s if left, forward 10s if right
          seek(isLeftHalf ? -10 : 10, true);
        }
        
        lastTapRef.current = 0; // Reset
      } else {
        // Single tap - delay to check for double tap
        lastTapRef.current = now;
        
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        
        tapTimeoutRef.current = setTimeout(() => {
          // Single tap confirmed - toggle play/pause
          togglePlay();
          tapTimeoutRef.current = null;
        }, DOUBLE_TAP_DELAY);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/40 text-white/70 text-sm`}>
        Không có nguồn m3u8
      </div>
    );
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`${className} relative bg-black group ${
        isFullscreen && isMobile ? "flex items-center justify-center" : ""
      }`}
      style={{ 
        filter: `brightness(${brightness})`,
        ...(isFullscreen && isMobile ? { display: "flex", alignItems: "center", justifyContent: "center" } : {})
      }}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
      onClick={handleContainerClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${
          isFullscreen && isMobile ? "object-center" : ""
        }`}
        poster={poster}
        playsInline
        {...(isIOS ? { 'webkit-playsinline': 'true' } : {})}
        autoPlay
        preload="metadata"
        key={src}
        style={
          isFullscreen && isMobile
            ? {
                objectFit: "contain",
                objectPosition: "center",
                margin: "0 auto",
              }
            : undefined
        }
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm">
          {error}
        </div>
      )}

      {/* Gesture HUD (Mobile) */}
      {isMobile && (isSeeking || volumeDelta !== 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="px-6 py-4 rounded-full bg-black/80 backdrop-blur-sm text-white text-lg font-semibold">
            {isSeeking && (
              <div className="flex items-center gap-2">
                {seekDelta > 0 ? (
                  <SkipForward className="w-6 h-6" />
                ) : (
                  <SkipBack className="w-6 h-6" />
                )}
                <span>{Math.abs(Math.round(seekDelta))}s</span>
              </div>
            )}
            {volumeDelta !== 0 && (
              <div className="flex items-center gap-2">
                {volumeDelta > 0 ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
                <span>{Math.round((startVolume.current + volumeDelta) * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speed HUD (Mobile) - Fast forward icon on the right */}
      {isMobile && showSpeedHUD && isForceTouching && playbackSpeed > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none z-30">
          <div className="p-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-[#F6C453]/60 animate-pulse">
            <SkipForward className="w-4 h-4 text-[#F6C453]" />
          </div>
        </div>
      )}

      {/* Keyboard Seek HUD (Desktop) - Position based on direction */}
      {!isMobile && showKeyboardHUD && keyboardSeekDelta !== 0 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-30 animate-fade-in ${
            keyboardSeekDelta > 0 ? "right-8" : "left-8"
          }`}
        >
          <div className="px-8 py-5 rounded-full bg-black/90 backdrop-blur-sm text-white text-xl font-semibold flex items-center gap-3 shadow-2xl border border-white/20">
            {keyboardSeekDelta > 0 ? (
              <SkipForward className="w-7 h-7 text-[#F6C453]" />
            ) : (
              <SkipBack className="w-7 h-7 text-[#F6C453]" />
            )}
            <span className="text-2xl">{Math.abs(keyboardSeekDelta)}s</span>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Controls Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
            {title && (
              <h3 className="text-white text-lg font-semibold truncate max-w-[60%] select-none pointer-events-none">
                {title}
              </h3>
            )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
            {/* Fullscreen button - hidden on mobile, shown in bottom controls */}
            {!isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Center Play Button - Only show when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className={`player-controls p-4 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all pointer-events-auto ${
                showControls || !isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            >
              <Play className="w-12 h-12 text-white ml-1" />
            </button>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 space-y-3 transition-all ${
            showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {/* Progress Bar */}
          <div className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer group/progress">
            {/* Buffered Progress */}
            <div
              className="absolute left-0 top-0 h-full bg-white/30 rounded-full transition-all"
              style={{ width: `${buffered}%` }}
            />
            {/* Current Progress */}
            <div
              ref={progressBarRef}
              className="absolute left-0 top-0 h-full bg-[#F6C453] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Progress Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F6C453] rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
            {/* Clickable Area */}
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  seek(-10);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>

              {/* Forward 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  seek(10);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>

              {/* Volume Control - Icon and Slider together */}
              <div
                className="relative flex items-center gap-2 group/volume"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* Volume Slider - Slides out from icon with big handle */}
                <div
                  ref={volumeSliderRef}
                  className={`flex items-center gap-2 transition-all duration-300 overflow-hidden ${
                    showVolumeSlider ? "w-28 opacity-100" : "w-0 opacity-0"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full relative min-w-[96px] group/volume-track">
                    {/* Filled volume */}
                    <div
                      className="absolute left-0 top-0 h-full bg-[#F6C453] rounded-full transition-all"
                      style={{ width: `${volume * 100}%` }}
                    />
                    {/* Volume handle (big dot) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#F6C453] rounded-full shadow-[0_0_8px_rgba(246,196,83,0.8)] border border-black/60 transition-transform -translate-x-1/2 pointer-events-none"
                      style={{ left: `${volume * 100}%` }}
                    />
                    {/* Invisible range input to capture interactions */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolumeValue(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Fullscreen button - only on mobile */}
              {isMobile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
              {/* Settings Menu */}
              {showSettings && (
                <div
                  className="absolute bottom-16 right-0 bg-black/95 backdrop-blur-sm rounded-lg p-2 min-w-[180px] z-30 shadow-xl border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-white text-sm p-3 hover:bg-white/20 rounded cursor-pointer flex items-center justify-between">
                    <span>Chất lượng</span>
                    <span className="text-white/60 text-xs">Auto</span>
                  </div>
                  <div className="text-white text-sm p-3 hover:bg-white/20 rounded cursor-pointer flex items-center justify-between">
                    <span>Phụ đề</span>
                    <span className="text-white/60 text-xs">Tắt</span>
                  </div>
                  <div className="text-white text-sm p-3 hover:bg-white/20 rounded cursor-pointer flex items-center justify-between">
                    <span>Tốc độ phát</span>
                    <span className="text-white/60 text-xs">1.0x</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

