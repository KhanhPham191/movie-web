"use client";

interface IframePlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export function IframePlayer({
  src,
  title = "Player",
  className = "w-full h-full",
}: IframePlayerProps) {
  if (!src) return null;

  return (
    <div className={`${className} relative`}>
      <iframe
        key={src}
        src={src}
        className="h-full w-full border-0 pointer-events-auto"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          position: "relative",
        }}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        title={title}
        loading="eager"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
 