import { useChainId } from 'wagmi';
import { CHAIN_ADMIN_ADDRESS } from '@/config/constants';

const ZERO = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export function useAdminAddress() {
  const chainId = useChainId();
  return CHAIN_ADMIN_ADDRESS[chainId] ?? ZERO;
}
