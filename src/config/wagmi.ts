import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, sepolia, arcTestnet } from './chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'NextBlock',
  projectId: (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || 'nextblock-dev',
  chains: [baseSepolia, sepolia, arcTestnet],
});
