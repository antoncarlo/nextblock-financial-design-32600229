import { useEffect, useState } from 'react';

export function FlowchartLines() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Left flowing line */}
      <svg
        className="absolute left-[12%] top-0 h-full w-32"
        viewBox="0 0 120 1200"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M60 0 C60 100, 20 150, 40 250 S80 350, 60 450 S30 550, 50 650 S90 750, 60 850 S40 950, 60 1050 S70 1150, 60 1200"
          stroke="var(--accent-navy)"
          strokeWidth="1.5"
          strokeOpacity="0.18"
          fill="none"
        />
        {/* Accent dots */}
        <circle cx="40" cy="250" r="3" fill="var(--accent-navy)" fillOpacity="0.15" />
        <circle cx="60" cy="450" r="2.5" fill="var(--accent-navy)" fillOpacity="0.12" />
        <circle cx="50" cy="650" r="3" fill="var(--accent-navy)" fillOpacity="0.18" />
        <circle cx="60" cy="850" r="2" fill="var(--accent-navy)" fillOpacity="0.14" />
      </svg>

      {/* Right flowing line */}
      <svg
        className="absolute right-[10%] top-0 h-full w-32"
        viewBox="0 0 120 1200"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M60 0 C60 80, 90 160, 70 280 S40 380, 60 480 S85 580, 65 680 S35 780, 55 880 S80 980, 60 1100 S50 1150, 60 1200"
          stroke="var(--accent-navy)"
          strokeWidth="2"
          strokeOpacity="0.12"
          fill="none"
        />
        <circle cx="70" cy="280" r="2.5" fill="var(--accent-navy)" fillOpacity="0.15" />
        <circle cx="65" cy="680" r="3" fill="var(--accent-navy)" fillOpacity="0.12" />
      </svg>

      {/* Center subtle line */}
      <svg
        className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2"
        viewBox="0 0 100 1200"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M50 200 C50 300, 30 350, 50 450 S70 550, 50 650 S30 750, 50 850"
          stroke="var(--accent-navy)"
          strokeWidth="1.5"
          strokeOpacity="0.08"
          strokeDasharray="8 12"
          fill="none"
        />
      </svg>
    </div>
  );
}
