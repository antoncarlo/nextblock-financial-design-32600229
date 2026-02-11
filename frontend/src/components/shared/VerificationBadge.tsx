'use client';

import { VerificationType, VERIFICATION_CONFIG } from '@/config/constants';

interface VerificationBadgeProps {
  type: VerificationType | number;
  size?: 'sm' | 'md';
}

export function VerificationBadge({ type, size = 'sm' }: VerificationBadgeProps) {
  const config = VERIFICATION_CONFIG[type as VerificationType] ?? VERIFICATION_CONFIG[VerificationType.ON_CHAIN];

  return (
    <span
      className="badge-institutional inline-flex items-center gap-1.5"
      style={{
        fontSize: size === 'sm' ? '12px' : '13px',
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: config.dotColor?.includes('emerald') ? '#059669' : config.dotColor?.includes('amber') ? '#D97706' : config.dotColor?.includes('blue') ? '#1B3A6B' : 'var(--accent-navy)' }}
      />
      {config.label}
    </span>
  );
}

/**
 * Compact dot-only version for vault cards.
 */
export function VerificationDot({ type }: { type: VerificationType | number }) {
  const config = VERIFICATION_CONFIG[type as VerificationType] ?? VERIFICATION_CONFIG[VerificationType.ON_CHAIN];

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${config.dotColor}`}
      title={config.label}
    />
  );
}
