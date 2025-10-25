# Smart Contracts Documentation

## Overview

This project implements a decentralized flood insurance system with the following contracts:

- `PolicyFactory`: Factory for creating individual policies.
- `IndividualPolicy`: Represents a single insurance policy.
- `OracleRegistry`: Stores flood level data by region.
- `InsurancePool`: Manages liquidity and handles payouts.
- `GovernanceContract`: Manages roles, parameters, and contract pause/unpause.

## PolicyFactory

### Functions

- `constructor(address _oracle, address _governance, address _pool)`: Initializes the factory with oracle, governance, and pool addresses.
- `createPolicy(uint256 _coverage) external returns (address)`: Creates a new policy with the given coverage. Premium is calculated as coverage * premiumRate / 100. Requires POLICY_CREATOR_ROLE. Returns the address of the new policy.

### Events

- `PolicyCreated(address indexed policyAddress, uint256 coverage, uint256 premium, address indexed policyholder)`: Emitted when a new policy is created.

## IndividualPolicy

### State Variables

- `uint256 public coverage`: The coverage amount.
- `uint256 public premium`: The premium amount.
- `address public policyholder`: The policyholder's address.
- `bool public payoutTriggered`: Whether the payout has been triggered.
- `OracleRegistry public oracle`: The oracle contract.
- `GovernanceContract public governance`: The governance contract.
- `InsurancePool public pool`: The insurance pool contract.
- `uint256 public constant REGION_ID = 1`: The region ID (fixed for simplicity).

### Functions

- `constructor(uint256 _coverage, uint256 _premium, address _policyholder, address _oracle, address _governance, address _pool)`: Initializes the policy.
- `triggerPayout() external`: Triggers a payout if the flood level > floodThreshold, contract not paused, and payout not already triggered. Calls pool.payOut.

## OracleRegistry

### State Variables

- `GovernanceContract public governance`: The governance contract.
- `mapping(uint256 => uint256) public floodLevels`: Stores flood levels by region ID.

### Functions

- `constructor(address _governance)`: Initializes with governance address.
- `updateFloodLevel(uint256 regionId, uint256 level) external`: Updates the flood level for a region. Requires ORACLE_UPDATER_ROLE.
- `getLatestFloodLevel(uint256 regionId) external view returns (uint256)`: Returns the latest flood level for a region.

### Events

- `FloodLevelUpdated(uint256 indexed regionId, uint256 level)`: Emitted when flood level is updated.

## InsurancePool

### State Variables

- `uint256 public totalLiquidity`: Total liquidity in the pool.
- `uint256 public totalReserves`: Total reserves.
- `uint256 public constant RESERVE_RATIO = 150`: Required reserve ratio (150%).
- `mapping(address => uint256) public userDeposits`: User deposits.

### Functions

- `constructor()`: Initializes with deployer as owner.
- `deposit() external payable whenNotPaused`: Deposits ETH into the pool.
- `withdraw(uint256 amount) external whenNotPaused`: Withdraws amount if sufficient reserves.
- `payOut(address policyholder, uint256 amount) external onlyOwner whenNotPaused`: Pays out to policyholder if reserves sufficient.
- `getReserveRatio() external view returns (uint256)`: Returns current reserve ratio.
- `pause() external onlyOwner`: Pauses the contract.
- `unpause() external onlyOwner`: Unpauses the contract.

### Events

- `Deposit(address indexed user, uint256 amount)`: Emitted on deposit.
- `Withdrawal(address indexed user, uint256 amount)`: Emitted on withdrawal.
- `Payout(address indexed policy, address indexed policyholder, uint256 amount)`: Emitted on payout.

## GovernanceContract

### State Variables

- `bytes32 public constant ADMIN_ROLE`: Admin role.
- `bytes32 public constant ORACLE_UPDATER_ROLE`: Oracle updater role.
- `bytes32 public constant POLICY_CREATOR_ROLE`: Policy creator role.
- `uint256 public floodThreshold = 3000`: Flood threshold.
- `uint256 public premiumRate = 10`: Premium rate (10%).

### Functions

- `constructor(address admin)`: Initializes with admin.
- `updateFloodThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE)`: Updates flood threshold.
- `updatePremiumRate(uint256 newRate) external onlyRole(ADMIN_ROLE)`: Updates premium rate.
- `pauseContract() external onlyRole(ADMIN_ROLE)`: Pauses contract.
- `unpauseContract() external onlyRole(ADMIN_ROLE)`: Unpauses contract.
- `grantRole(bytes32 role, address account) public`: Grants role.
- `revokeRole(bytes32 role, address account) public`: Revokes role.

### Events

- `ParameterUpdated(string parameter, uint256 value)`: Emitted on parameter update.
- `ContractPaused(address indexed by)`: Emitted on pause.
- `ContractUnpaused(address indexed by)`: Emitted on unpause.

- `FloodLevelUpdated(uint256 indexed regionId, uint256 level)`: Emitted when a flood level is updated.

## Data Flow

1. Deploy `OracleRegistry`.
2. Deploy `PolicyFactory` with oracle address.
3. Users call `createPolicy` to create policies.
4. Oracle updates flood levels via `updateFloodLevel`.
5. When flood level > 3000, policyholders can call `triggerPayout` to receive payout.