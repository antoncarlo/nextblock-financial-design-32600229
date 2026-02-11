import { PolicyStatus, STATUS_CONFIG } from '@/config/constants';

interface StatusBadgeProps {
  status: PolicyStatus | number;
  claimed?: boolean;
  expired?: boolean;
}

function getEffectiveStatus(status: number, claimed?: boolean, expired?: boolean): PolicyStatus {
  if (claimed) return PolicyStatus.CLAIMED;
  if (expired) return PolicyStatus.EXPIRED;
  return status as PolicyStatus;
}

export function StatusBadge({ status, claimed, expired }: StatusBadgeProps) {
  const effectiveStatus = getEffectiveStatus(status, claimed, expired);
  const config = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG[PolicyStatus.REGISTERED];

  return (
    <span className="badge-institutional">
      {config.label}
    </span>
  );
}
