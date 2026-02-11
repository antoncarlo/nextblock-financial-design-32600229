import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { useVaultInfo, useUserShares, useMaxWithdraw, usePendingClaims } from '@/hooks/useVaultData';
import { useVaultPolicies } from '@/hooks/useVaultPolicies';
import { useCurrentTime } from '@/hooks/usePolicyRegistry';
import { PolicyRow } from '@/components/vault/PolicyRow';
import { AllocationBar } from '@/components/vault/AllocationBar';
import { BufferVisualization } from '@/components/vault/BufferVisualization';
import { YieldTicker } from '@/components/vault/YieldTicker';
import { DepositSidebar } from '@/components/deposit/DepositSidebar';
import { useEnsName } from '@/hooks/useEns';
import { formatUSDC, formatFeeBps, formatBufferRatio, shortenAddress, getSharePriceNumber } from '@/lib/formatting';

const VAULT_DISPLAY: Record<string, { manager: string; strategy: string; riskLevel: string; targetApy: string; }> = {
  'Balanced Core': { manager: 'NextBlock Core Team', strategy: 'Full-spectrum insurance diversification, steady yield', riskLevel: 'Moderate', targetApy: '8-12%' },
  'Digital Asset Shield': { manager: 'AlphaRe Capital', strategy: 'Automated on-chain claims only, pure crypto risk exposure', riskLevel: 'Higher', targetApy: '10-14%' },
  'Parametric Shield': { manager: 'StormGuard Capital', strategy: 'Oracle-verified parametric insurance only', riskLevel: 'Moderate', targetApy: '9-13%' },
  'Conservative Yield': { manager: 'Klapton Re Partners', strategy: 'Low-volatility off-chain reinsurance portfolio', riskLevel: 'Lower', targetApy: '5-8%' },
  'Catastrophe & Specialty': { manager: 'Alpine Re', strategy: 'Catastrophe-focused with specialty lines diversification', riskLevel: 'High', targetApy: '14-18%' },
  'Traditional Lines': { manager: 'BondSecure Capital', strategy: 'Established commercial and liability reinsurance', riskLevel: 'Lower', targetApy: '6-9%' },
  'Technology & Specialty': { manager: 'CyberGuard Partners', strategy: 'Digital asset and technology risk with property diversification', riskLevel: 'Moderate', targetApy: '8-11%' },
  'Multi-Line Diversified': { manager: 'Meridian Risk Mgmt', strategy: 'Maximum diversification across all categories', riskLevel: 'Moderate', targetApy: '9-13%' },
};

function getVaultDisplay(name: string) {
  for (const [key, value] of Object.entries(VAULT_DISPLAY)) {
    if (name.includes(key)) return value;
  }
  return { manager: 'Vault Manager', strategy: 'Custom strategy', riskLevel: 'Moderate', targetApy: '8-14%' };
}

const EXPLORER_URLS: Record<number, string> = {
  84532: 'https://sepolia.basescan.org', 8453: 'https://basescan.org',
  11155111: 'https://sepolia.etherscan.io', 5042002: 'https://testnet.arcscan.app',
};

type Tab = 'overview' | 'risk';

export default function VaultDetailPage() {
  const { address: addrParam } = useParams<{ address: string }>();
  const vaultAddress = addrParam as `0x${string}`;
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: vaultInfo, isLoading: vaultLoading } = useVaultInfo(vaultAddress);
  const { policies, isLoading: policiesLoading } = useVaultPolicies(vaultAddress);
  const { data: currentTime } = useCurrentTime();
  const { data: userShares } = useUserShares(vaultAddress, userAddress);
  const { data: maxWithdraw } = useMaxWithdraw(vaultAddress, userAddress);
  const { data: pendingClaimsData } = usePendingClaims(vaultAddress);

  const managerAddr = vaultInfo ? ((vaultInfo as unknown as [string, `0x${string}`])[1]) : undefined;
  const { ensName: managerEns } = useEnsName(managerAddr);

  if (vaultLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-40 rounded bg-gray-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white" />
            <div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white" />
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white" />
        </div>
      </div>
    );
  }

  if (!vaultInfo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Vault not found</h1>
        <p className="mt-2 text-sm text-gray-500">Could not load vault at address {shortenAddress(vaultAddress)}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">Back to vaults</Link>
      </div>
    );
  }

  const [name, manager, assets, shares, , bufferBps, feeBps, availableBuffer, deployedCapital, policyCount] =
    vaultInfo as unknown as [string, `0x${string}`, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

  const display = getVaultDisplay(name);
  const sharePrice = getSharePriceNumber(assets, shares);
  const hasPosition = userShares !== undefined && userShares > 0n;
  const userValue = hasPosition && userShares ? (Number(userShares) * sharePrice) / 1e18 : 0;
  const pendingClaims = pendingClaimsData ?? 0n;
  const freeCapital = assets > deployedCapital + pendingClaims ? assets - deployedCapital - pendingClaims : 0n;
  const effectiveMaxWithdraw = maxWithdraw !== undefined ? (freeCapital < maxWithdraw ? freeCapital : maxWithdraw) : undefined;

  const explorerUrl = EXPLORER_URLS[chainId] ? `${EXPLORER_URLS[chainId]}/address/${vaultAddress}` : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-500 transition-colors hover:text-gray-700">Vaults</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{name}</span>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button onClick={() => setTab('overview')} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
        <button onClick={() => setTab('risk')} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'risk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Risk</button>
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                    {name}
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 transition-colors hover:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                          <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l5.47-5.47H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">Managed by <span className="font-medium text-gray-700">{managerEns || display.manager}</span></p>
                  <p className="mt-1 text-sm italic text-gray-400">&quot;{display.strategy}&quot;</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Target APY</p>
                  <p className="font-mono-num text-2xl font-bold text-gray-900">{display.targetApy}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-4 border-t border-gray-100 pt-4">
                <div><p className="text-xs text-gray-400">TVL</p><p className="font-mono-num text-sm font-semibold text-gray-900">{formatUSDC(assets)}</p></div>
                <div><p className="text-xs text-gray-400">Share Price</p><p className="font-mono-num text-sm font-semibold text-gray-900">${sharePrice.toFixed(4)}</p></div>
                <div><p className="text-xs text-gray-400">Mgmt Fee</p><p className="text-sm font-semibold text-gray-900">{formatFeeBps(feeBps)}</p></div>
                <div><p className="text-xs text-gray-400">Buffer Ratio</p><p className="text-sm font-semibold text-gray-900">{formatBufferRatio(bufferBps)}</p></div>
              </div>
            </div>

            <YieldTicker totalAssets={assets} totalSupply={shares} />

            {isConnected && hasPosition && userShares && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-blue-800">Your Position</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-xs text-blue-600">Shares</p><p className="font-mono-num text-sm font-semibold text-blue-900">{(Number(userShares) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 6 })}</p></div>
                  <div><p className="text-xs text-blue-600">Value</p><p className="font-mono-num text-sm font-semibold text-blue-900">${userValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                  <div><p className="text-xs text-blue-600">Max Withdraw</p><p className="font-mono-num text-sm font-semibold text-blue-900">{effectiveMaxWithdraw !== undefined ? formatUSDC(effectiveMaxWithdraw) : '--'}</p></div>
                </div>
              </div>
            )}

            {policies.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6"><AllocationBar policies={policies} /></div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <BufferVisualization totalAssets={assets} deployedCapital={deployedCapital} pendingClaims={pendingClaims} bufferBps={bufferBps} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4"><h3 className="text-sm font-medium text-gray-700">Policies ({Number(policyCount)})</h3></div>
              {policiesLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-50" />)}</div>
              ) : policies.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No policies in this vault.</p>
              ) : (
                <div className="space-y-3">{policies.map(p => <PolicyRow key={Number(p.policyId)} policy={p} currentTime={currentTime ?? 0n} />)}</div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <DepositSidebar vaultAddress={vaultAddress} totalAssets={assets} totalSupply={shares} policyCount={Number(policyCount)} maxWithdrawOverride={effectiveMaxWithdraw} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Risk Disclosures</h2>
            <div className="mt-4 space-y-4">
              <div><h3 className="text-sm font-medium text-gray-700">Vault Manager</h3><p className="mt-1 text-sm text-gray-500">{managerEns || display.manager} ({shortenAddress(manager)})</p></div>
              <div><h3 className="text-sm font-medium text-gray-700">Buffer Ratio</h3><p className="mt-1 text-sm text-gray-500">{formatBufferRatio(bufferBps)} of vault assets are held as liquid buffer for immediate withdrawals.</p></div>
              <div><h3 className="text-sm font-medium text-gray-700">Smart Contract Risk</h3><p className="mt-1 text-sm text-gray-500">This vault is deployed on a testnet for demonstration purposes. Smart contracts have not been audited.</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
