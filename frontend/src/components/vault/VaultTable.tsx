'use client';

import { VaultRow } from './VaultRow';

interface VaultTableProps {
  vaultAddresses: readonly `0x${string}`[];
}

export function VaultTable({ vaultAddresses }: VaultTableProps) {
  return (
    <div className="card-institutional overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <th className="section-label px-6 py-3 text-left">Vault</th>
            <th className="section-label px-6 py-3 text-left">TVL</th>
            <th className="section-label px-6 py-3 text-left">Curator</th>
            <th className="section-label px-6 py-3 text-left">Exposure</th>
            <th className="section-label px-6 py-3 text-center">Policies</th>
            <th className="section-label px-6 py-3 text-right">Target APY</th>
          </tr>
        </thead>
        <tbody>
          {vaultAddresses.map((address) => (
            <VaultRow key={address} vaultAddress={address} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
