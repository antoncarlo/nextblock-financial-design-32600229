import { defineChain } from 'viem';
import { baseSepolia as baseSepoliaChain, sepolia as sepoliaChain } from 'viem/chains';

export const baseSepolia = baseSepoliaChain;
export const sepolia = sepoliaChain;

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
});

export const supportedChains = [baseSepoliaChain, sepoliaChain, arcTestnet] as const;
export const defaultChain = baseSepoliaChain;
