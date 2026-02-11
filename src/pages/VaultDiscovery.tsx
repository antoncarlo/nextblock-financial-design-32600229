import { useVaultAddresses } from '@/hooks/useVaultData';
import { VaultTable } from '@/components/vault/VaultTable';
import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { VerificationType } from '@/config/constants';

export default function VaultDiscoveryPage() {
  const { data: vaultAddresses, isLoading, error } = useVaultAddresses();

  return (
    <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8" style={{ maxWidth: '1400px' }}>
      <div className="mb-10">
        <p className="section-label mb-3">Insurance Vaults</p>
        <h1 className="text-4xl tracking-tight" style={{ color: 'var(--text-heading)' }}>Earn on your terms</h1>
        <p className="mt-3 max-w-2xl text-base" style={{ color: 'var(--text-body)', lineHeight: '1.7' }}>
          Insurance-backed yield from independent curators. Pick a vault, deposit capital, and earn premiums as yield while your funds provide underwriting capacity.
        </p>
      </div>

      <div className="card-institutional mt-8 mb-10 p-8">
        <h2 className="text-xl" style={{ color: 'var(--text-heading)' }}>How It Works</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {[
            { n: '1', title: 'Tokenized Policies', desc: 'Insurance policies are tokenized on-chain with transparent terms, coverage, and verification methods.' },
            { n: '2', title: 'Curated Vaults', desc: 'Vault managers build diversified portfolios from tokenized policies. Different strategies for different risk appetites.' },
            { n: '3', title: 'Earn Premiums', desc: 'Your deposit provides underwriting capacity. Premiums accrue as yield over time. Withdraw anytime from the liquidity buffer.' },
          ].map((item) => (
            <div key={item.n}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(27, 58, 107, 0.08)' }}>
                <span className="stat-number text-base font-semibold">{item.n}</span>
              </div>
              <h3 className="text-base" style={{ color: 'var(--text-heading)' }}>{item.title}</h3>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="section-label">Insurance verification types:</span>
        <VerificationBadge type={VerificationType.ON_CHAIN} />
        <VerificationBadge type={VerificationType.ORACLE_DEPENDENT} />
        <VerificationBadge type={VerificationType.OFF_CHAIN} />
      </div>

      {isLoading ? (
        <div className="card-institutional p-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading vaults...</p>
        </div>
      ) : error ? (
        <div className="card-institutional p-8 text-center" style={{ borderColor: 'rgba(220, 50, 50, 0.15)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-navy)' }}>Failed to load vaults</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Make sure contracts are deployed and addresses are configured.</p>
        </div>
      ) : !vaultAddresses || vaultAddresses.length === 0 ? (
        <div className="card-institutional p-12 text-center">
          <h3 className="text-base" style={{ color: 'var(--text-heading)' }}>No vaults found</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Deploy contracts and run the setup script to create vaults.</p>
        </div>
      ) : (
        <VaultTable vaultAddresses={vaultAddresses} />
      )}
    </div>
  );
}
