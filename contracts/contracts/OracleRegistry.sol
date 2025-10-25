// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GovernanceContract.sol";

contract OracleRegistry is Ownable {
    GovernanceContract public governance;
    mapping(uint256 => uint256) public floodLevels;

    event FloodLevelUpdated(uint256 indexed regionId, uint256 level);

    constructor(address _governance) {
        governance = GovernanceContract(_governance);
    }

    function updateFloodLevel(uint256 regionId, uint256 level) external {
        require(governance.hasRole(governance.ORACLE_UPDATER_ROLE(), msg.sender), "Not authorized");
        floodLevels[regionId] = level;
        emit FloodLevelUpdated(regionId, level);
    }

    function getLatestFloodLevel(uint256 regionId) external view returns (uint256) {
        return floodLevels[regionId];
    }
}