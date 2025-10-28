const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Addresses from previous deployment
const governanceAddress = '0x9fa0E35b83F9E82abF33b0102067195CdEDd169';
const poolAddress = '0x3B341536162eD05a4A0C0E6E03A809D1755340eF';

async function deploy() {
  try {
    console.log('Deploying OracleRegistry...');
    const oracleJson = require(path.join(__dirname, '../artifacts/contracts/OracleRegistry.sol/OracleRegistry.json'));
    const oracleFactory = new ethers.ContractFactory(oracleJson.abi, oracleJson.bytecode, wallet);
    const oracle = await oracleFactory.deploy(governanceAddress);
    await oracle.deployed();
    console.log('OracleRegistry deployed to:', oracle.address);

    console.log('Deploying PolicyFactory...');
    const policyJson = require(path.join(__dirname, '../artifacts/contracts/PolicyFactory.sol/PolicyFactory.json'));
    const policyFactory = new ethers.ContractFactory(policyJson.abi, policyJson.bytecode, wallet);
    const factory = await policyFactory.deploy(oracle.address, governanceAddress, poolAddress);
    await factory.deployed();
    console.log('PolicyFactory deployed to:', factory.address);

    console.log('Setting PolicyFactory on Pool...');
    const poolJson = require(path.join(__dirname, '../artifacts/contracts/InsurancePool.sol/InsurancePool.json'));
    const pool = new ethers.Contract(poolAddress, poolJson.abi, wallet);
    const tx = await pool.setPolicyFactory(factory.address);
    await tx.wait();
    console.log('PolicyFactory address set on InsurancePool');

    console.log('\nDeployment complete!');
    console.log('Update .env with:');
    console.log('GOVERNANCE_ADDRESS=' + governanceAddress);
    console.log('POOL_ADDRESS=' + poolAddress);
    console.log('ORACLE_ADDRESS=' + oracle.address.toLowerCase());
    console.log('POLICY_FACTORY_ADDRESS=' + factory.address.toLowerCase());
  } catch (err) {
    console.error('Deployment error:', err.message);
    console.error(err.stack);
  }
}

deploy();
