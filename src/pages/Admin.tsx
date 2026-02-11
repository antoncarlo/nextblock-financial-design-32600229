import { useAccount } from 'wagmi';
import { useVaultAddresses, useMultiVaultInfo } from '@/hooks/useVaultData';
import { useAdminAddress } from '@/hooks/useAdminAddress';
import { TimeControls } from '@/components/admin/TimeControls';
import { OracleControls } from '@/components/admin/OracleControls';
import { ClaimTriggers } from '@/components/admin/ClaimTriggers';
import { ClaimReceipts } from '@/components/admin/ClaimReceipts';
import { PolicyPool } from '@/components/admin/PolicyPool';
import { DemoControls } from '@/components/admin/DemoControls';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const adminAddress = useAdminAddress();
  const isAdmin = isConnected && address?.toLowerCase() === adminAddress.toLowerCase();

  const { data: vaultAddresses } = useVaultAddresses();
  const { data: vaultInfos } = useMultiVaultInfo(vaultAddresses);

  const vaultNames: string[] = [];
  if (vaultInfos) {
    for (const info of vaultInfos) {
      if (info.status === 'success' && info.result) {
        const result = info.result as unknown as [string, ...unknown[]];
        vaultNames.push(result[0]);
      } else {
        vaultNames.push('Unknown Vault');
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-sm text-gray-500">Connect your wallet to access admin controls.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500">This page is only accessible to the admin wallet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin / Curator Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Control time, oracles, and claim triggers for the demo.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TimeControls />
          <OracleControls />
          <DemoControls />
        </div>
        <div className="space-y-6">
          <ClaimTriggers vaultAddresses={vaultAddresses ?? []} vaultNames={vaultNames} />
          <ClaimReceipts />
        </div>
      </div>

      <div className="mt-6"><PolicyPool /></div>
    </div>
  );
}
