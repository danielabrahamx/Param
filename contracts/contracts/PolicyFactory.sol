// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IndividualPolicy.sol";
import "./GovernanceContract.sol";
import "./InsurancePool.sol";

contract PolicyFactory {
    address public oracle;
    GovernanceContract public governance;
    InsurancePool public pool;

    event PolicyCreated(
        address indexed policyAddress,
        uint256 coverage,
        uint256 premium,
        address indexed policyholder
    );

    constructor(address _oracle, address _governance, address payable _pool) {
        oracle = _oracle;
        governance = GovernanceContract(_governance);
        pool = InsurancePool(_pool);
    }

    function createPolicy(uint256 _coverage) external payable returns (address) {
        // Frontend sends _coverage in wei (18 decimals)
        // Wagmi sends msg.value in wei (18 decimals)
        // On Hedera EVM, everything is in wei just like Ethereum
        // No need for tinybar conversions - that's only for native transfers outside the EVM
        
        uint256 premium = (_coverage * governance.premiumRate()) / 100;
        
        require(msg.value >= premium, "Insufficient premium payment");
        
        // Create the policy contract (store amounts in wei for tracking)
        IndividualPolicy policy = new IndividualPolicy(_coverage, premium, msg.sender, oracle, address(governance), payable(address(pool)));
        
        // Send premium to pool in wei (EVM standard)
        pool.receivePremium{value: msg.value}();
        
        // Refund excess payment if any
        if (msg.value > premium) {
            payable(msg.sender).transfer(msg.value - premium);
        }
        
        // Send coverage to pool in wei (keep everything in wei on EVM)
        pool.fundPolicy(payable(address(policy)), _coverage);
        
        emit PolicyCreated(address(policy), _coverage, premium, msg.sender);
        
        return address(policy);
    }
}
