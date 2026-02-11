"use client";

import { useVaultAddresses } from "@/hooks/useVaultData";
import { VaultTable } from "@/components/vault/VaultTable";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { VerificationType } from "@/config/constants";

export default function VaultDiscoveryPage() {
  const { data: vaultAddresses, isLoading, error } = useVaultAddresses();

  return (
    <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8" style={{ maxWidth: '1400px' }}>
      {/* Hero */}
      <div className="mb-10">
        <p className="section-label mb-3">Insurance Vaults</p>
        <h1 className="text-4xl tracking-tight" style={{ color: 'var(--text-heading)' }}>
          Earn on your terms
        </h1>
        <p className="mt-3 max-w-2xl text-base" style={{ color: 'var(--text-body)', lineHeight: '1.7' }}>
          Insurance-backed yield from independent curators. Pick a vault,
          deposit capital, and earn premiums as yield while your funds provide
          underwriting capacity.
        </p>
      </div>

      {/* Platform info */}
      <div className="card-institutional mt-8 mb-10 p-8">
        <h2 className="text-xl" style={{ color: 'var(--text-heading)' }}>How It Works</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(27, 58, 107, 0.08)' }}>
              <span className="stat-number text-base font-semibold">1</span>
            </div>
            <h3 className="text-base" style={{ color: 'var(--text-heading)' }}>
              Tokenized Policies
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              Insurance policies are tokenized on-chain with transparent terms,
              coverage, and verification methods.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(27, 58, 107, 0.08)' }}>
              <span className="stat-number text-base font-semibold">2</span>
            </div>
            <h3 className="text-base" style={{ color: 'var(--text-heading)' }}>
              Curated Vaults
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              Vault managers build diversified portfolios from tokenized
              policies. Different strategies for different risk appetites.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(27, 58, 107, 0.08)' }}>
              <span className="stat-number text-base font-semibold">3</span>
            </div>
            <h3 className="text-base" style={{ color: 'var(--text-heading)' }}>Earn Premiums</h3>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              Your deposit provides underwriting capacity. Premiums accrue as
              yield over time. Withdraw anytime from the liquidity buffer.
            </p>
          </div>
        </div>
      </div>

      {/* Verification legend */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="section-label">
          Insurance verification types:
        </span>
        <VerificationBadge type={VerificationType.ON_CHAIN} />
        <VerificationBadge type={VerificationType.ORACLE_DEPENDENT} />
        <VerificationBadge type={VerificationType.OFF_CHAIN} />
      </div>

      {/* Vault table */}
      {isLoading ? (
        <VaultTableSkeleton />
      ) : error ? (
        <div className="card-institutional p-8 text-center" style={{ borderColor: 'rgba(220, 50, 50, 0.15)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-navy)' }}>
            Failed to load vaults
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Make sure contracts are deployed and addresses are configured.
          </p>
        </div>
      ) : !vaultAddresses || vaultAddresses.length === 0 ? (
        <div className="card-institutional p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(27, 58, 107, 0.08)' }}>
            <svg
              className="h-6 w-6"
              style={{ color: 'var(--accent-navy)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-base" style={{ color: 'var(--text-heading)' }}>No vaults found</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Deploy contracts and run the setup script to create vaults.
          </p>
        </div>
      ) : (
        <VaultTable vaultAddresses={vaultAddresses} />
      )}
    </div>
  );
}

function VaultTableSkeleton() {
  return (
    <div className="card-institutional overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <th className="section-label px-6 py-3">Vault</th>
            <th className="section-label px-6 py-3">TVL</th>
            <th className="section-label px-6 py-3">Curator</th>
            <th className="section-label px-6 py-3">Exposure</th>
            <th className="section-label px-6 py-3 text-center">Policies</th>
            <th className="section-label px-6 py-3 text-right">Target APY</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <td className="px-6 py-4">
                <div className="h-4 w-28 animate-pulse rounded" style={{ background: 'var(--bg-secondary)' }} />
                <div className="mt-1.5 h-3 w-20 animate-pulse rounded" style={{ background: 'var(--bg-secondary)' }} />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-16 animate-pulse rounded" style={{ background: 'var(--bg-secondary)' }} />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-24 animate-pulse rounded" style={{ background: 'var(--bg-secondary)' }} />
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--bg-secondary)' }} />
                  <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--bg-secondary)' }} />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="mx-auto h-4 w-6 animate-pulse rounded" style={{ background: 'var(--bg-secondary)' }} />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="ml-auto h-4 w-14 animate-pulse rounded" style={{ background: 'var(--bg-secondary)' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
