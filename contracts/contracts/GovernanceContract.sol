// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract GovernanceContract is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_UPDATER_ROLE = keccak256("ORACLE_UPDATER_ROLE");
    bytes32 public constant POLICY_CREATOR_ROLE = keccak256("POLICY_CREATOR_ROLE");

    uint256 public floodThreshold = 3000; // Default flood threshold
    uint256 public premiumRate = 10; // Default premium rate (10%)

    event ParameterUpdated(string parameter, uint256 value);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ORACLE_UPDATER_ROLE, admin);
        _grantRole(POLICY_CREATOR_ROLE, admin);
    }

    function updateFloodThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE) {
        floodThreshold = newThreshold;
        emit ParameterUpdated("floodThreshold", newThreshold);
    }

    function updatePremiumRate(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        premiumRate = newRate;
        emit ParameterUpdated("premiumRate", newRate);
    }

    function pauseContract() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpauseContract() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.revokeRole(role, account);
    }
}