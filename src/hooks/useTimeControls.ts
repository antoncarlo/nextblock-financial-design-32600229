import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { POLICY_REGISTRY_ABI, MOCK_ORACLE_ABI, MOCK_USDC_ABI } from '@/config/contracts';
import { useAddresses } from './useAddresses';

export function useAdvanceTime() {
  const addresses = useAddresses();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const advanceTime = (seconds: bigint) => {
    writeContract({ address: addresses.policyRegistry, abi: POLICY_REGISTRY_ABI, functionName: 'advanceTime', args: [seconds] } as any);
  };

  return { advanceTime, isPending, isSuccess, error, txHash };
}

export function useSetBtcPrice() {
  const addresses = useAddresses();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const setBtcPrice = (price: bigint) => {
    writeContract({ address: addresses.mockOracle, abi: MOCK_ORACLE_ABI, functionName: 'setBtcPrice', args: [price] } as any);
  };

  return { setBtcPrice, isPending, isSuccess, error, txHash };
}

export function useSetFlightStatus() {
  const addresses = useAddresses();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const setFlightStatus = (delayed: boolean) => {
    writeContract({ address: addresses.mockOracle, abi: MOCK_ORACLE_ABI, functionName: 'setFlightStatus', args: [delayed] } as any);
  };

  return { setFlightStatus, isPending, isSuccess, error, txHash };
}

export function useMintUSDC() {
  const addresses = useAddresses();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const mint = (to: `0x${string}`, amount: bigint) => {
    writeContract({ address: addresses.mockUSDC, abi: MOCK_USDC_ABI, functionName: 'mint', args: [to, amount] } as any);
  };

  return { mint, isPending, isSuccess, error, txHash };
}
