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
        uint256 floodLevel = oracle.getLatestFloodLevel(REGION_ID);
        require(floodLevel > governance.floodThreshold(), "Flood level not high enough for payout");

        payoutTriggered = true;
        pool.payOut(policyholder, premium);
    }

    receive() external payable {}
}