import { http, createConfig } from 'wagmi'
import { hardhat } from 'wagmi/chains'
import { defineChain } from 'viem'
import { metaMask } from 'wagmi/connectors'

// For Hedera, always use the address as-is (no checksum enforcement)
export const NORMALIZED_ADDRESSES = {
  GOVERNANCE: import.meta.env.VITE_GOVERNANCE_ADDRESS || '',
  POLICY_FACTORY: import.meta.env.VITE_POLICY_FACTORY_ADDRESS || '',
  ORACLE_REGISTRY: import.meta.env.VITE_ORACLE_REGISTRY_ADDRESS || '',
  POOL: import.meta.env.VITE_POOL_ADDRESS || '',
}

// Define Hedera Testnet as a custom chain
export const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: [
        'https://testnet.hashio.io/api',
        'https://pool.arkhia.io/hedera/testnet/json-rpc/v1',
      ],
    },
    public: {
      http: [
        'https://testnet.hashio.io/api',
        'https://pool.arkhia.io/hedera/testnet/json-rpc/v1',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [hardhat, hederaTestnet],
  connectors: [metaMask()],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api', {
      timeout: 30_000, // 30 second timeout
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
})
