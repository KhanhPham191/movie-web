'use client';

import dynamic from 'next/dynamic';

// Dynamic import Shaka Player (client-side only)
const ShakaPlayer = dynamic(() => import('./ShakaPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full flex items-center justify-center bg-black rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-3"></div>
        <p className="text-white text-sm">Đang tải player...</p>
      </div>
    </div>
  ),
});

interface VideoPlayerClientProps {
  embedUrl: string;
  poster?: string;
  title?: string;
  className?: string;
}

export default function VideoPlayerClient({ 
  embedUrl, 
  poster, 
  title,
  className
}: VideoPlayerClientProps) {
  // CHỈ DÙNG SHAKA PLAYER - KHÔNG CÓ FALLBACK EMBED
  return (
    <ShakaPlayer
      embedUrl={embedUrl}
      poster={poster}
      title={title}
      className={className}
    />
  );
}
