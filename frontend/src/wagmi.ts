import { http, createConfig } from 'wagmi'
import { hardhat } from 'wagmi/chains'
import { defineChain } from 'viem'
import { metaMask } from 'wagmi/connectors'

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
      http: ['https://testnet.hashio.io/api'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
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
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
  },
})