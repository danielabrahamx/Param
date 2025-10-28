// Usage: node checksum-env.cjs
// This script reads your .env file, converts all contract addresses to EIP-55 checksum format, and writes the result to .env.checksummed

const fs = require('fs');
const path = require('path');
const { getAddress } = require('ethers');

const ENV_PATH = path.resolve(__dirname, '../frontend/.env');
const OUT_PATH = path.resolve(__dirname, '../frontend/.env.checksummed');

const CONTRACT_KEYS = [
  'VITE_POLICY_FACTORY_ADDRESS',
  'VITE_ORACLE_REGISTRY_ADDRESS',
  'VITE_POOL_ADDRESS',
  'VITE_GOVERNANCE_ADDRESS',
];

function checksumLine(line) {
  for (const key of CONTRACT_KEYS) {
    if (line.startsWith(key + '=')) {
      const [_, addr] = line.split('=');
      try {
        const checksummed = getAddress(addr.trim());
        return `${key}=${checksummed}`;
      } catch {
        return line; // leave unchanged if invalid
      }
    }
  }
  return line;
}

const env = fs.readFileSync(ENV_PATH, 'utf8');
const lines = env.split(/\r?\n/);
const checksummed = lines.map(checksumLine).join('\n');
fs.writeFileSync(OUT_PATH, checksummed);

console.log('Checksummed .env written to', OUT_PATH);
