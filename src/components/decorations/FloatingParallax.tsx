import { useEffect, useState, useRef, type ReactNode } from 'react';

interface FloatingElement {
  id: number;
  x: string;
  y: string;
  speed: number;
  size: string;
  opacity: number;
  content: ReactNode;
}

const inkElements: Omit<FloatingElement, 'id'>[] = [
  {
    x: '5%', y: '15%', speed: 0.03, size: 'w-28 h-28', opacity: 0.12,
    content: (
      <svg viewBox="0 0 100 100" fill="none">
        <path d="M20 80 C25 60, 35 40, 50 30 S75 25, 80 40 C85 55, 70 65, 55 70 S30 75, 20 80Z" stroke="var(--accent-navy)" strokeWidth="1" opacity="0.8" />
        <path d="M30 75 C35 65, 40 55, 50 50" stroke="var(--accent-navy)" strokeWidth="0.8" opacity="0.5" />
        <circle cx="50" cy="30" r="2" fill="var(--accent-navy)" opacity="0.4" />
      </svg>
    ),
  },
  {
    x: '88%', y: '25%', speed: 0.05, size: 'w-24 h-24', opacity: 0.1,
    content: (
      <svg viewBox="0 0 100 100" fill="none">
        <path d="M10 50 Q30 20, 50 30 T90 50 Q70 80, 50 70 T10 50Z" stroke="var(--accent-navy)" strokeWidth="0.8" opacity="0.7" />
        <path d="M40 35 L50 45 L60 35" stroke="var(--accent-navy)" strokeWidth="0.6" opacity="0.4" />
        <line x1="50" y1="45" x2="50" y2="65" stroke="var(--accent-navy)" strokeWidth="0.6" opacity="0.3" />
      </svg>
    ),
  },
  {
    x: '92%', y: '55%', speed: 0.02, size: 'w-20 h-20', opacity: 0.14,
    content: (
      <svg viewBox="0 0 100 100" fill="none">
        <path d="M50 10 C70 20, 85 40, 80 60 S60 90, 40 85 S10 65, 15 45 S30 15, 50 10Z" stroke="var(--accent-navy)" strokeWidth="1" opacity="0.6" />
        <path d="M35 40 Q50 30, 65 40" stroke="var(--accent-navy)" strokeWidth="0.7" opacity="0.4" />
      </svg>
    ),
  },
  {
    x: '3%', y: '60%', speed: 0.04, size: 'w-32 h-32', opacity: 0.08,
    content: (
      <svg viewBox="0 0 120 120" fill="none">
        <path d="M20 100 C30 70, 50 50, 60 30 C65 20, 75 15, 85 20 C95 25, 100 40, 95 55 C90 70, 75 80, 60 85 L50 100" stroke="var(--accent-navy)" strokeWidth="1.2" opacity="0.7" />
        <path d="M60 30 C55 40, 45 45, 40 55" stroke="var(--accent-navy)" strokeWidth="0.6" opacity="0.4" strokeDasharray="3 3" />
        <circle cx="85" cy="20" r="1.5" fill="var(--accent-navy)" opacity="0.5" />
        <circle cx="60" cy="85" r="1.5" fill="var(--accent-navy)" opacity="0.3" />
      </svg>
    ),
  },
  {
    x: '75%', y: '80%', speed: 0.035, size: 'w-22 h-22', opacity: 0.11,
    content: (
      <svg viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="35" ry="20" stroke="var(--accent-navy)" strokeWidth="0.8" opacity="0.5" />
        <path d="M25 50 Q35 35, 50 38 T75 50" stroke="var(--accent-navy)" strokeWidth="0.6" opacity="0.4" />
        <circle cx="50" cy="42" r="4" stroke="var(--accent-navy)" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>
    ),
  },
  {
    x: '45%', y: '85%', speed: 0.025, size: 'w-16 h-16', opacity: 0.1,
    content: (
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M10 70 L30 20 L50 50 L70 10" stroke="var(--accent-navy)" strokeWidth="1" opacity="0.6" />
        <circle cx="30" cy="20" r="2" fill="var(--accent-navy)" opacity="0.4" />
        <circle cx="50" cy="50" r="2" fill="var(--accent-navy)" opacity="0.4" />
        <circle cx="70" cy="10" r="2" fill="var(--accent-navy)" opacity="0.4" />
      </svg>
    ),
  },
];

export function FloatingParallax() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current as number);
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {inkElements.map((el, i) => (
        <div
          key={i}
          className={`absolute ${el.size}`}
          style={{
            left: el.x,
            top: el.y,
            opacity: el.opacity,
            transform: `translateY(${scrollY * el.speed * (i % 2 === 0 ? -1 : 1)}px)`,
            willChange: 'transform',
          }}
        >
          {el.content}
        </div>
      ))}
    </div>
  );
}
