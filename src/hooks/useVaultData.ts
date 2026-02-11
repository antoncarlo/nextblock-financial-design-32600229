import { useReadContract, useReadContracts } from 'wagmi';
import {
  VAULT_FACTORY_ABI,
  INSURANCE_VAULT_ABI,
  MOCK_USDC_ABI,
} from '@/config/contracts';
import { POLL_INTERVAL } from '@/config/constants';
import { useAddresses } from './useAddresses';

export interface VaultInfo {
  name: string;
  manager: `0x${string}`;
  assets: bigint;
  shares: bigint;
  sharePrice: bigint;
  bufferBps: bigint;
  feeBps: bigint;
  availableBuffer: bigint;
  deployedCapital: bigint;
  policyCount: bigint;
}

export function useVaultAddresses() {
  const addresses = useAddresses();
  return useReadContract({
    address: addresses.vaultFactory,
    abi: VAULT_FACTORY_ABI,
    functionName: 'getVaults',
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled:
        addresses.vaultFactory !== '0x0000000000000000000000000000000000000000',
    },
  });
}

export function useVaultInfo(vaultAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: vaultAddress,
    abi: INSURANCE_VAULT_ABI,
    functionName: 'getVaultInfo',
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled: !!vaultAddress,
    },
  });
}

export function useMultiVaultInfo(
  vaultAddresses: readonly `0x${string}`[] | undefined,
) {
  const contracts = (vaultAddresses ?? []).map((address) => ({
    address,
    abi: INSURANCE_VAULT_ABI,
    functionName: 'getVaultInfo' as const,
  }));

  return useReadContracts({
    contracts,
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled: !!vaultAddresses && vaultAddresses.length > 0,
    },
  });
}

export function useUserShares(
  vaultAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
) {
  return useReadContract({
    address: vaultAddress,
    abi: INSURANCE_VAULT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled: !!vaultAddress && !!userAddress,
    },
  });
}

export function useMaxWithdraw(
  vaultAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
) {
  return useReadContract({
    address: vaultAddress,
    abi: INSURANCE_VAULT_ABI,
    functionName: 'maxWithdraw',
    args: userAddress ? [userAddress] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled: !!vaultAddress && !!userAddress,
    },
  });
}

export function useUSDCBalance(userAddress: `0x${string}` | undefined) {
  const addresses = useAddresses();
  return useReadContract({
    address: addresses.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled:
        !!userAddress &&
        addresses.mockUSDC !== '0x0000000000000000000000000000000000000000',
    },
  });
}

export function useUSDCAllowance(
  userAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined,
) {
  const addresses = useAddresses();
  return useReadContract({
    address: addresses.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'allowance',
    args:
      userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled:
        !!userAddress &&
        !!spenderAddress &&
        addresses.mockUSDC !== '0x0000000000000000000000000000000000000000',
    },
  });
}

export function usePendingClaims(vaultAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: vaultAddress,
    abi: INSURANCE_VAULT_ABI,
    functionName: 'totalPendingClaims',
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled: !!vaultAddress,
    },
  });
}

export function usePreviewDeposit(
  vaultAddress: `0x${string}` | undefined,
  assets: bigint,
) {
  return useReadContract({
    address: vaultAddress,
    abi: INSURANCE_VAULT_ABI,
    functionName: 'previewDeposit',
    args: [assets],
    query: {
      enabled: !!vaultAddress && assets > 0n,
    },
  });
}

export function useUserPositions(
  vaultAddresses: readonly `0x${string}`[] | undefined,
  userAddress: `0x${string}` | undefined,
) {
  const contracts = (vaultAddresses ?? []).flatMap((address) => [
    {
      address,
      abi: INSURANCE_VAULT_ABI,
      functionName: 'balanceOf' as const,
      args: userAddress ? ([userAddress] as const) : undefined,
    },
    {
      address,
      abi: INSURANCE_VAULT_ABI,
      functionName: 'convertToAssets' as const,
      args: [1n] as const,
    },
  ]);

  return useReadContracts({
    contracts,
    query: {
      refetchInterval: POLL_INTERVAL,
      enabled: !!vaultAddresses && vaultAddresses.length > 0 && !!userAddress,
    },
  });
}
