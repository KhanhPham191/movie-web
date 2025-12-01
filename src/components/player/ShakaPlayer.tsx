'use client';

import { useEffect, useRef, useState } from 'react';
import { extractVideoFromEmbed, getProxiedVideoUrl } from '@/lib/videoProxy';

interface ShakaPlayerProps {
  embedUrl: string;
  poster?: string;
  className?: string;
  onError?: () => void;
}

declare global {
  interface Window {
    shaka: any;
  }
}

export default function ShakaPlayer({ embedUrl, poster, className, onError }: ShakaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Đang tải...');

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Step 1: Extract video URL from embed
        setStatus('Đang trích xuất video...');
        const result = await extractVideoFromEmbed(embedUrl);
        
        if (!mounted) return;
        
        if (!result.success || !result.videoUrl) {
          console.error('[SHAKA] Extract failed:', result);
          setError('Không thể trích xuất video');
          setIsLoading(false);
          onError?.();
          return;
        }

        console.log('[SHAKA] Extracted video:', result.videoUrl);
        
        // Step 2: Load Shaka Player
        setStatus('Đang tải Shaka Player...');
        console.log('[SHAKA] Loading Shaka script...');
        await loadShakaScript();
        
        if (!mounted) return;
        
        // Step 3: Initialize player
        setStatus('Đang phát video...');
        console.log('[SHAKA] Initializing player with:', result.videoUrl);
        await initPlayer(result.videoUrl, result.type || 'hls');
        console.log('[SHAKA] Player initialized successfully!');
        
      } catch (err: any) {
        if (mounted) {
          console.error('[SHAKA] Error:', err.message, err);
          setError(err.message || 'Lỗi không xác định');
          setIsLoading(false);
          onError?.();
        }
      }
    };

    const loadShakaScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.shaka) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.7.11/shaka-player.compiled.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Shaka Player'));
        document.head.appendChild(script);
      });
    };

    const initPlayer = async (videoUrl: string, type: string) => {
      const shaka = window.shaka;
      shaka.polyfill.installAll();

      if (!shaka.Player.isBrowserSupported()) {
        throw new Error('Browser không hỗ trợ');
      }

      const video = videoRef.current;
      if (!video) return;

      const player = new shaka.Player(video);
      playerRef.current = player;

      // Configure player
      player.configure({
        streaming: {
          bufferingGoal: 30,
          rebufferingGoal: 2,
          bufferBehind: 30,
        },
      });

      // Proxy all network requests
      player.getNetworkingEngine().registerRequestFilter((type: any, request: any) => {
        if (request.uris && request.uris.length > 0) {
          request.uris = request.uris.map((uri: string) => {
            // Don't double-proxy
            if (uri.includes('proxypey')) return uri;
            return getProxiedVideoUrl(uri);
          });
        }
      });

      player.addEventListener('error', (event: any) => {
        console.error('[SHAKA] Player Error:', event.detail);
        setError('Lỗi phát video');
        onError?.();
      });

      // Proxy the main video URL
      const proxiedUrl = getProxiedVideoUrl(videoUrl);
      console.log('[SHAKA] Loading:', proxiedUrl);

      await player.load(proxiedUrl);
      setIsLoading(false);
      setStatus('');
    };

    init();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [embedUrl, onError]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">⚠️ {error}</p>
          <p className="text-gray-400 text-sm">Đang chuyển sang embed player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-3"></div>
            <p className="text-white text-sm">{status}</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        controls
        autoPlay
        className="w-full h-full"
        playsInline
      />
    </div>
  );
}
