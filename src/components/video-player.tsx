"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Monitor, Smartphone, AlertCircle, RefreshCw } from "lucide-react";

interface VideoPlayerProps {
  embedUrl: string;
  m3u8Url: string;
  title?: string;
}

export function VideoPlayer({ embedUrl, m3u8Url, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerMode, setPlayerMode] = useState<"embed" | "hls">("embed");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (playerMode !== "hls" || !m3u8Url || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls | null = null;

    setIsLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(m3u8Url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay blocked, user needs to click play
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError("Không thể phát video. Vui lòng thử chế độ Embed.");
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      video.src = m3u8Url;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError("Không thể phát video. Vui lòng thử chế độ Embed.");
        setIsLoading(false);
      });
    } else {
      setError("Trình duyệt không hỗ trợ HLS. Vui lòng dùng chế độ Embed.");
      setIsLoading(false);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [playerMode, m3u8Url]);

  return (
    <div className="space-y-3">
      {/* Player Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={playerMode === "embed" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPlayerMode("embed");
              setError(null);
            }}
            className={playerMode === "embed" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : ""}
          >
            <Monitor className="w-4 h-4 mr-1" />
            Embed
          </Button>
          {m3u8Url && (
            <Button
              variant={playerMode === "hls" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPlayerMode("hls");
                setError(null);
              }}
              className={playerMode === "hls" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : ""}
            >
              <Smartphone className="w-4 h-4 mr-1" />
              Native Player
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">
          {playerMode === "embed" ? "Dùng Embed nếu Native không hoạt động" : "Native Player tối ưu cho mobile"}
        </span>
      </div>

      {/* Video Player */}
      <Card className="overflow-hidden bg-black rounded-xl">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          {playerMode === "embed" ? (
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation"
              title={title || "Video Player"}
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full bg-black"
                controls
                playsInline
                preload="metadata"
                poster=""
              >
                Trình duyệt của bạn không hỗ trợ video.
              </video>
              
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-white text-sm">Đang tải video...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <p className="text-white text-sm">{error}</p>
                    <Button
                      size="sm"
                      onClick={() => setPlayerMode("embed")}
                      className="bg-gradient-to-r from-blue-500 to-blue-600"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Chuyển sang Embed
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Mobile Tip */}
      <p className="text-xs text-muted-foreground text-center sm:hidden">
        💡 Nếu video không phát được, hãy thử chuyển đổi giữa Embed và Native Player
      </p>
    </div>
  );
}

