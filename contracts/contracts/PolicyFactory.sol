// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IndividualPolicy.sol";
import "./GovernanceContract.sol";

contract PolicyFactory {
    address public oracle;
    GovernanceContract public governance;
    address public pool;

    event PolicyCreated(
        address indexed policyAddress,
        uint256 coverage,
        uint256 premium,
        address indexed policyholder
    );

    constructor(address _oracle, address _governance, address _pool) {
        oracle = _oracle;
        governance = GovernanceContract(_governance);
        pool = _pool;
    }

    function createPolicy(uint256 _coverage) external returns (address) {
        require(governance.hasRole(governance.POLICY_CREATOR_ROLE(), msg.sender), "Not authorized to create policy");
        uint256 premium = (_coverage * governance.premiumRate()) / 100;
        IndividualPolicy policy = new IndividualPolicy(_coverage, premium, msg.sender, oracle, address(governance), payable(pool));
        emit PolicyCreated(address(policy), _coverage, premium, msg.sender);
        return address(policy);
    }
}