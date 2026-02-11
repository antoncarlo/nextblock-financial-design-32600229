export function DecorativeGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Organic curved grid lines - horizontal */}
        <path
          d="M0 200 Q360 180, 720 210 T1440 195"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.06"
          fill="none"
        />
        <path
          d="M0 400 Q400 420, 800 390 T1440 405"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.05"
          fill="none"
        />
        <path
          d="M0 600 Q300 580, 600 610 T1200 595 T1440 600"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.06"
          fill="none"
        />

        {/* Organic curved grid lines - vertical */}
        <path
          d="M300 0 Q310 200, 295 400 T305 800 T300 900"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.05"
          fill="none"
        />
        <path
          d="M700 0 Q690 250, 710 500 T695 900"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.04"
          fill="none"
        />
        <path
          d="M1100 0 Q1110 200, 1095 450 T1105 900"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.05"
          fill="none"
        />

        {/* Ellipses */}
        <ellipse
          cx="250"
          cy="300"
          rx="60"
          ry="30"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.07"
          fill="none"
        />
        <ellipse
          cx="900"
          cy="500"
          rx="45"
          ry="22"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.06"
          fill="none"
        />
        <ellipse
          cx="1200"
          cy="250"
          rx="50"
          ry="25"
          stroke="var(--accent-navy)"
          strokeWidth="0.8"
          strokeOpacity="0.05"
          fill="none"
        />

        {/* Accent dots at intersections */}
        <circle cx="300" cy="200" r="2.5" fill="var(--accent-navy)" fillOpacity="0.1" />
        <circle cx="700" cy="400" r="2" fill="var(--accent-navy)" fillOpacity="0.08" />
        <circle cx="1100" cy="200" r="2.5" fill="var(--accent-navy)" fillOpacity="0.1" />
        <circle cx="300" cy="600" r="2" fill="var(--accent-navy)" fillOpacity="0.08" />
        <circle cx="700" cy="600" r="3" fill="var(--accent-navy)" fillOpacity="0.06" />
        <circle cx="1100" cy="600" r="2" fill="var(--accent-navy)" fillOpacity="0.09" />
      </svg>
    </div>
  );
}
