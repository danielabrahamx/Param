import { NORMALIZED_ADDRESSES } from './wagmi'

// Validate all required environment variables are loaded
console.log('🔍 Environment Variable Check:')
console.log('================================')
console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL || '❌ NOT SET')
console.log('VITE_POLICY_FACTORY_ADDRESS:', import.meta.env.VITE_POLICY_FACTORY_ADDRESS || '❌ NOT SET')
console.log('VITE_ORACLE_REGISTRY_ADDRESS:', import.meta.env.VITE_ORACLE_REGISTRY_ADDRESS || '❌ NOT SET')
console.log('VITE_POOL_ADDRESS:', import.meta.env.VITE_POOL_ADDRESS || '❌ NOT SET')
console.log('VITE_GOVERNANCE_ADDRESS:', import.meta.env.VITE_GOVERNANCE_ADDRESS || '❌ NOT SET')
console.log('================================')
console.log('Normalized Addresses:')
console.log('GOVERNANCE:', NORMALIZED_ADDRESSES.GOVERNANCE || '❌ NOT LOADED')
console.log('POLICY_FACTORY:', NORMALIZED_ADDRESSES.POLICY_FACTORY || '❌ NOT LOADED')
console.log('ORACLE_REGISTRY:', NORMALIZED_ADDRESSES.ORACLE_REGISTRY || '❌ NOT LOADED')
console.log('POOL:', NORMALIZED_ADDRESSES.POOL || '❌ NOT LOADED')
console.log('================================')

// Check if any addresses are missing
const missingAddresses = []
if (!NORMALIZED_ADDRESSES.GOVERNANCE) missingAddresses.push('GOVERNANCE')
if (!NORMALIZED_ADDRESSES.POLICY_FACTORY) missingAddresses.push('POLICY_FACTORY')
if (!NORMALIZED_ADDRESSES.ORACLE_REGISTRY) missingAddresses.push('ORACLE_REGISTRY')
if (!NORMALIZED_ADDRESSES.POOL) missingAddresses.push('POOL')

if (missingAddresses.length > 0) {
  console.error('❌ Missing contract addresses:', missingAddresses)
  console.error('Make sure frontend/.env contains all VITE_*_ADDRESS variables')
} else {
  console.log('✅ All contract addresses loaded successfully!')
}
