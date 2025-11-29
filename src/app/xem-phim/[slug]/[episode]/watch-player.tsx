"use client";

import { useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Monitor, Play } from "lucide-react";

interface WatchPlayerProps {
  embedUrl: string;
  m3u8Url: string;
  poster?: string;
  title?: string;
}

export function WatchPlayer({ embedUrl, m3u8Url, poster, title }: WatchPlayerProps) {
  // Default to m3u8 player (no debugger issues)
  const [playerType, setPlayerType] = useState<"m3u8" | "embed">(m3u8Url ? "m3u8" : "embed");

  return (
    <div className="space-y-3">
      {/* Player Toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground mr-2">Nguồn phát:</span>
        <Button
          variant={playerType === "m3u8" ? "default" : "outline"}
          size="sm"
          onClick={() => setPlayerType("m3u8")}
          disabled={!m3u8Url}
          className={playerType === "m3u8" ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          <Play className="w-4 h-4 mr-1" />
          HLS Player
        </Button>
        <Button
          variant={playerType === "embed" ? "default" : "outline"}
          size="sm"
          onClick={() => setPlayerType("embed")}
          className={playerType === "embed" ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          <Monitor className="w-4 h-4 mr-1" />
          Embed
        </Button>
      </div>

      {/* Video Player */}
      {playerType === "m3u8" && m3u8Url ? (
        <VideoPlayer src={m3u8Url} poster={poster} title={title} />
      ) : (
        <Card className="overflow-hidden bg-black">
          <div className="relative aspect-video">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              referrerPolicy="no-referrer"
            />
          </div>
        </Card>
      )}

      {/* Help text */}
      {playerType === "embed" && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Nếu gặp lỗi &quot;Paused in debugger&quot;, hãy chuyển sang &quot;HLS Player&quot;
        </p>
      )}
    </div>
  );
}

