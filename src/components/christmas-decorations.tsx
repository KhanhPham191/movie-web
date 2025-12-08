"use client";

import { useEffect, useState } from "react";

// Snowflake component
function Snowflake({ delay, duration, left }: { delay: number; duration: number; left: number }) {
  return (
    <div
      className="absolute text-white/80 text-xs pointer-events-none select-none"
      style={{
        left: `${left}%`,
        animation: `snowfall ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        fontSize: `${Math.random() * 10 + 10}px`,
      }}
    >
      ❄
    </div>
  );
}

// Christmas lights
function ChristmasLight({ delay, left }: { delay: number; left: number }) {
  const colors = ["#FF2EBC", "#D946EF", "#FFD700", "#FF6B6B", "#4ECDC4"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <div
      className="absolute top-0 w-2 h-2 rounded-full pointer-events-none"
      style={{
        left: `${left}%`,
        background: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
        animation: `twinkle ${2 + Math.random() * 2}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Star decoration
function Star({ delay, top, left, size }: { delay: number; top: number; left: number; size: number }) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        fontSize: `${size}px`,
        animation: `star-twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      ⭐
    </div>
  );
}

export function ChristmasDecorations() {
  const [snowflakes, setSnowflakes] = useState<Array<{ delay: number; duration: number; left: number }>>([]);
  const [lights, setLights] = useState<Array<{ delay: number; left: number }>>([]);
  const [stars, setStars] = useState<Array<{ delay: number; top: number; left: number; size: number }>>([]);

  useEffect(() => {
    // Generate snowflakes
    const snowflakeCount = 30;
    const newSnowflakes = Array.from({ length: snowflakeCount }, () => ({
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
      left: Math.random() * 100,
    }));
    setSnowflakes(newSnowflakes);

    // Generate Christmas lights
    const lightCount = 20;
    const newLights = Array.from({ length: lightCount }, () => ({
      delay: Math.random() * 2,
      left: (Math.random() * 100),
    }));
    setLights(newLights);

    // Generate stars
    const starCount = 15;
    const newStars = Array.from({ length: starCount }, () => ({
      delay: Math.random() * 3,
      top: Math.random() * 30,
      left: Math.random() * 100,
      size: 10 + Math.random() * 15,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Snowflakes */}
      <div className="absolute inset-0">
        {snowflakes.map((snowflake, index) => (
          <Snowflake
            key={`snowflake-${index}`}
            delay={snowflake.delay}
            duration={snowflake.duration}
            left={snowflake.left}
          />
        ))}
      </div>

      {/* Christmas Lights at top */}
      <div className="absolute top-0 left-0 right-0 h-1">
        {lights.map((light, index) => (
          <ChristmasLight
            key={`light-${index}`}
            delay={light.delay}
            left={light.left}
          />
        ))}
      </div>

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star, index) => (
          <Star
            key={`star-${index}`}
            delay={star.delay}
            top={star.top}
            left={star.left}
            size={star.size}
          />
        ))}
      </div>

      {/* Christmas gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_10%,rgba(255,46,188,0.1),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_10%,rgba(217,70,239,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_90%,rgba(255,215,0,0.05),transparent_50%)]" />
      </div>
    </div>
  );
}

