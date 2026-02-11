import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { INSURANCE_VAULT_ABI } from '@/config/contracts';

export function useCheckClaim() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const trigger = (vaultAddress: `0x${string}`, policyId: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: INSURANCE_VAULT_ABI,
      functionName: 'checkClaim',
      args: [policyId],
    } as any);
  };

  return { trigger, isPending, isSuccess, error, txHash };
}

export function useReportEvent() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const trigger = (vaultAddress: `0x${string}`, policyId: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: INSURANCE_VAULT_ABI,
      functionName: 'reportEvent',
      args: [policyId],
    } as any);
  };

  return { trigger, isPending, isSuccess, error, txHash };
}

export function useSubmitClaim() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const trigger = (vaultAddress: `0x${string}`, policyId: bigint, amount: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: INSURANCE_VAULT_ABI,
      functionName: 'submitClaim',
      args: [policyId, amount],
    } as any);
  };

  return { trigger, isPending, isSuccess, error, txHash };
}

export function useExerciseClaim() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const exercise = (vaultAddress: `0x${string}`, receiptId: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: INSURANCE_VAULT_ABI,
      functionName: 'exerciseClaim',
      args: [receiptId],
    } as any);
  };

  return { exercise, isPending, isSuccess, error, txHash };
}
