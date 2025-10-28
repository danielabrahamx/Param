import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Test configuration
export const config = {
  rpcUrl: process.env.RPC_URL || 'https://testnet.hashio.io/api',
  apiGateway: process.env.API_GATEWAY || 'http://localhost:3000',
  policyService: process.env.POLICY_SERVICE || 'http://localhost:3001',
  oracleService: process.env.ORACLE_SERVICE || 'http://localhost:3002',
  claimsService: process.env.CLAIMS_SERVICE || 'http://localhost:3003',
  poolAddress: process.env.POOL_ADDRESS!,
  policyFactoryAddress: process.env.POLICY_FACTORY_ADDRESS!,
  adminPrivateKey: process.env.PRIVATE_KEY!,
};

// Create provider and signers
export function getProvider() {
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

export function getAdminSigner() {
  const provider = getProvider();
  return new ethers.Wallet(config.adminPrivateKey, provider);
}

export async function getAdminSignerWithNonce() {
  const provider = getProvider();
  const wallet = new ethers.Wallet(config.adminPrivateKey, provider);
  // Force nonce refresh from network
  const nonce = await provider.getTransactionCount(wallet.address, 'latest');
  return { wallet, nonce };
}

export function createTestWallet() {
  return ethers.Wallet.createRandom().connect(getProvider());
}

// Contract ABIs
export const poolAbi = [
  "function deposit() external payable",
  "function totalBalance() view returns (uint256)",
  "function receivePremium() external payable",
  "function fundPolicy(address payable policyAddress, uint256 coverageAmount) external",
  "event Deposit(address indexed user, uint256 amount)",
  "event PremiumReceived(address indexed from, uint256 amount)",
  "event PolicyFunded(address indexed policy, uint256 amount)"
];

export const factoryAbi = [
  "function createPolicy(uint256 _coverage) external payable returns (address)",
  "function policies(uint256) view returns (address)",
  "function getPolicyCount() view returns (uint256)",
  "event PolicyCreated(address indexed policy, address indexed owner, uint256 coverage)"
];

export const policyAbi = [
  "function coverage() view returns (uint256)",
  "function policyholder() view returns (address)",
  "function isActive() view returns (bool)",
  "function triggerPayout() external",
  "function claimPayout() external",
  "function balance() view returns (uint256)",
  "event PayoutTriggered(uint256 amount)",
  "event PayoutClaimed(address indexed beneficiary, uint256 amount)"
];

// Helper function to wait for transaction
export async function waitForTx(tx: any) {
  const receipt = await tx.wait();
  console.log(`✓ Transaction confirmed: ${receipt.hash}`);
  return receipt;
}

// Helper function to fund a wallet with HBAR for testing
export async function fundWallet(wallet: ethers.Wallet | ethers.HDNodeWallet, amount: string) {
  const provider = getProvider();
  const { wallet: admin, nonce } = await getAdminSignerWithNonce();
  const amountWei = ethers.parseEther(amount);
  
  console.log(`Funding ${wallet.address} with ${amount} HBAR...`);
  const tx = await admin.sendTransaction({
    to: wallet.address,
    value: amountWei,
    nonce: nonce // Use explicit nonce
  });
  await waitForTx(tx);
  
  const balance = await wallet.provider!.getBalance(wallet.address);
  console.log(`✓ Wallet funded. Balance: ${ethers.formatEther(balance)} HBAR`);
  return balance;
}

// API helper functions
export async function apiCall(method: string, url: string, data?: any) {
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error: any) {
    console.error(`API Error: ${method} ${url}`, error.response?.data || error.message);
    throw error;
  }
}

// Wait for services to be ready
export async function waitForServices() {
  const services = [
    { name: 'Policy Service', url: `${config.policyService}/api/v1/policies` },
    { name: 'Oracle Service', url: `${config.oracleService}/api/v1/oracle/flood-level/1` },
    { name: 'Claims Service', url: `${config.claimsService}/api/v1/claims` }
  ];

  console.log('\nChecking service availability...');
  
  for (const service of services) {
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(service.url, { timeout: 2000 });
        console.log(`✓ ${service.name} is ready`);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`${service.name} is not available at ${service.url}`);
        }
        console.log(`  Waiting for ${service.name}... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log('✓ All services ready\n');
}

// Helper to format HBAR amounts
export function formatHbar(wei: bigint): string {
  return ethers.formatEther(wei);
}

export function parseHbar(amount: string): bigint {
  return ethers.parseEther(amount);
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
