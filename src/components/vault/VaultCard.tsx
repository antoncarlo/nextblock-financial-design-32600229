import { Link } from 'react-router-dom';
import { useVaultInfo, useUserShares } from '@/hooks/useVaultData';
import { useVaultPolicyIds } from '@/hooks/useVaultPolicies';
import { useGlobalPoliciesData } from '@/hooks/useVaultPolicies';
import { useAccount } from 'wagmi';
import { VerificationDot } from '@/components/shared/VerificationBadge';
import {
  formatUSDCCompact,
  getSharePriceNumber,
  formatFeeBps,
  formatBufferRatio,
  shortenAddress,
} from '@/lib/formatting';

const VAULT_DISPLAY: Record<string, { manager: string; strategy: string; riskLevel: string; riskColor: string; targetApy: string; }> = {
  'Balanced Core': { manager: 'NextBlock Core Team', strategy: 'Diversified across all verification types', riskLevel: 'Moderate', riskColor: 'badge-institutional', targetApy: '8-12%' },
  'DeFi Alpha': { manager: 'AlphaRe Capital', strategy: 'Automated-only, no off-chain verification', riskLevel: 'Higher', riskColor: 'badge-institutional', targetApy: '10-14%' },
};

function getVaultDisplay(name: string) {
  for (const [key, value] of Object.entries(VAULT_DISPLAY)) {
    if (name.includes(key)) return value;
  }
  return { manager: 'Vault Manager', strategy: 'Custom strategy', riskLevel: 'Moderate', riskColor: 'badge-institutional', targetApy: '8-14%' };
}

interface VaultCardProps {
  vaultAddress: `0x${string}`;
}

export function VaultCard({ vaultAddress }: VaultCardProps) {
  const { address: userAddress } = useAccount();
  const { data: vaultInfo, isLoading, error } = useVaultInfo(vaultAddress);
  const { data: policyIds } = useVaultPolicyIds(vaultAddress);
  const { data: globalPolicies } = useGlobalPoliciesData(policyIds);
  const { data: userShares } = useUserShares(vaultAddress, userAddress);

  if (isLoading) return <VaultCardSkeleton />;

  if (error || !vaultInfo) {
    return (
      <div className="card-institutional p-6" style={{ borderColor: 'rgba(220, 50, 50, 0.15)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--accent-navy)' }}>
          Vault {shortenAddress(vaultAddress)}
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {error ? (error as Error).message?.split('\n')[0] || 'Contract call failed' : 'No data returned'}
        </p>
      </div>
    );
  }

  const [name, , assets, shares, , bufferBps, feeBps, , , policyCount] =
    vaultInfo as unknown as [string, `0x${string}`, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

  const display = getVaultDisplay(name);
  const sharePrice = getSharePriceNumber(assets, shares);
  const hasPosition = userShares !== undefined && userShares > 0n;

  const verificationTypes: Set<number> = new Set();
  if (globalPolicies) {
    for (const gp of globalPolicies) {
      if (gp.status === 'success' && gp.result) {
        const policy = gp.result as unknown as { verificationType: number };
        verificationTypes.add(policy.verificationType);
      }
    }
  }

  return (
    <Link to={`/vault/${vaultAddress}`}>
      <div className="card-institutional group relative p-6 transition-all">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg" style={{ color: 'var(--text-heading)' }}>{name}</h3>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{display.manager}</p>
          </div>
          <span className={display.riskColor}>{display.riskLevel}</span>
        </div>

        <p className="mb-4 text-sm" style={{ color: 'var(--text-body)' }}>{display.strategy}</p>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="section-label">Target APY</p>
            <p className="stat-number mt-1 text-2xl">{display.targetApy}</p>
          </div>
          <div>
            <p className="section-label">TVL</p>
            <p className="stat-number mt-1 text-2xl">{formatUSDCCompact(assets)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium" style={{ color: 'var(--text-body)' }}>{Number(policyCount)}</span>{' '}
              {Number(policyCount) === 1 ? 'policy' : 'policies'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Fee: <span className="font-medium" style={{ color: 'var(--text-body)' }}>{formatFeeBps(feeBps)}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Buffer: <span className="font-medium" style={{ color: 'var(--text-body)' }}>{formatBufferRatio(bufferBps)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from(verificationTypes).sort().map((vt) => (
              <VerificationDot key={vt} type={vt} />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Share price</span>
          <span className="font-mono-num text-sm font-medium" style={{ color: 'var(--accent-navy)' }}>
            ${sharePrice.toFixed(4)}
          </span>
        </div>

        {hasPosition && userShares && (
          <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(27, 58, 107, 0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--accent-navy)' }}>Your position</span>
              <span className="font-mono-num text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                ${((Number(userShares) * sharePrice) / 1e18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function VaultCardSkeleton() {
  return (
    <div className="card-institutional animate-pulse p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="h-5 w-32 rounded" style={{ background: 'var(--bg-secondary)' }} />
          <div className="mt-2 h-4 w-24 rounded" style={{ background: 'var(--bg-secondary)' }} />
        </div>
        <div className="h-5 w-16 rounded-full" style={{ background: 'var(--bg-secondary)' }} />
      </div>
      <div className="mb-4 h-4 w-48 rounded" style={{ background: 'var(--bg-secondary)' }} />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-secondary)' }} />
          <div className="mt-2 h-6 w-20 rounded" style={{ background: 'var(--bg-secondary)' }} />
        </div>
        <div>
          <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-secondary)' }} />
          <div className="mt-2 h-6 w-20 rounded" style={{ background: 'var(--bg-secondary)' }} />
        </div>
      </div>
      <div className="pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="h-4 w-full rounded" style={{ background: 'var(--bg-secondary)' }} />
      </div>
    </div>
  );
}
