import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MOCK_USDC_ABI, INSURANCE_VAULT_ABI } from '@/config/contracts';
import { useAddresses } from './useAddresses';

export type DepositState = 'IDLE' | 'APPROVING' | 'APPROVED' | 'DEPOSITING' | 'SUCCESS' | 'ERROR';

interface UseDepositFlowOptions {
  vaultAddress: `0x${string}`;
  amount: bigint;
  receiver: `0x${string}`;
  onSuccess?: () => void;
}

export function useDepositFlow({ vaultAddress, amount, receiver, onSuccess }: UseDepositFlowOptions) {
  const addresses = useAddresses();
  const [state, setState] = useState<DepositState>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositPending, error: depositError } = useWriteContract();
  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => {
    if (approveConfirmed && state === 'APPROVING') {
      setState('APPROVED');
      writeDeposit({ address: vaultAddress, abi: INSURANCE_VAULT_ABI, functionName: 'deposit', args: [amount, receiver] } as any);
      setState('DEPOSITING');
    }
  }, [approveConfirmed, state, writeDeposit, vaultAddress, amount, receiver]);

  useEffect(() => { if (depositConfirmed && state === 'DEPOSITING') { setState('SUCCESS'); onSuccess?.(); } }, [depositConfirmed, state, onSuccess]);
  useEffect(() => { if (approveError && state === 'APPROVING') { setState('ERROR'); setError(approveError.message.split('\n')[0]); } }, [approveError, state]);
  useEffect(() => { if (depositError && state === 'DEPOSITING') { setState('ERROR'); setError(depositError.message.split('\n')[0]); } }, [depositError, state]);

  const startDeposit = useCallback(() => {
    if (amount <= 0n) return;
    setError(null);
    setState('APPROVING');
    writeApprove({ address: addresses.mockUSDC, abi: MOCK_USDC_ABI, functionName: 'approve', args: [vaultAddress, amount] } as any);
  }, [amount, vaultAddress, writeApprove, addresses.mockUSDC]);

  const reset = useCallback(() => { setState('IDLE'); setError(null); }, []);

  return { state, error, startDeposit, reset, isApprovePending, isDepositPending, approveHash, depositHash };
}
