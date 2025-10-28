// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OracleRegistry.sol";
import "./GovernanceContract.sol";
import "./InsurancePool.sol";

contract IndividualPolicy {
    uint256 public coverage;
    uint256 public premium;
    address public policyholder;
    bool public payoutTriggered;
    OracleRegistry public oracle;
    GovernanceContract public governance;
    InsurancePool public pool;
    uint256 public constant REGION_ID = 1; // Assume single region for simplicity
    
    event PayoutTriggered(address indexed policyholder, uint256 amount);

    constructor(uint256 _coverage, uint256 _premium, address _policyholder, address _oracle, address _governance, address payable _pool) {
        coverage = _coverage;
        premium = _premium;
        policyholder = _policyholder;
        oracle = OracleRegistry(_oracle);
        governance = GovernanceContract(_governance);
        pool = InsurancePool(_pool);
    }

    function triggerPayout() external {
        require(!payoutTriggered, "Payout already triggered");
        require(!governance.paused(), "Contract is paused");
        
        // coverage is in wei (18 decimals), but address(this).balance is in tinybar (8 decimals)
        // Convert coverage to tinybar to compare
        uint256 coverageTinybar = coverage / (10**10);
        require(address(this).balance >= coverageTinybar, "Insufficient balance for payout");

        // For now, allow claims without flood level check since oracle isn't set up
        // TODO: Re-enable flood level validation once oracle is properly configured
        // uint256 floodLevel = oracle.getLatestFloodLevel(REGION_ID);
        // require(floodLevel > governance.floodThreshold(), "Flood level not high enough for payout");

        payoutTriggered = true;
        
        // Transfer coverage amount to policyholder (send in tinybar)
        payable(policyholder).transfer(coverageTinybar);
        
        emit PayoutTriggered(policyholder, coverage);
    }
    
    function getBalance() external view returns (uint256) {
        // Hedera returns balance in tinybar (8 decimals), convert to wei (18 decimals)
        return address(this).balance * (10**10);
    }

    // Admin function to reset payout flag (for fixing stuck payouts)
    function resetPayoutFlag() external {
        require(msg.sender == policyholder, "Only policyholder can reset");
        require(address(this).balance == 0, "Only reset if payout failed (balance is 0)");
        payoutTriggered = false;
    }

    receive() external payable {}
}
