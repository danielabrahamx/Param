// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract InsurancePool is Ownable, Pausable {
    uint256 public totalLiquidity;
    uint256 public totalReserves;
    uint256 public constant RESERVE_RATIO = 150; // 150% reserve ratio

    mapping(address => uint256) public userDeposits;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event Payout(address indexed policy, address indexed policyholder, uint256 amount);

    constructor() Ownable() {}

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Deposit must be greater than 0");
        userDeposits[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        totalReserves += msg.value; // Assuming all deposits are reserves initially
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external whenNotPaused {
        require(userDeposits[msg.sender] >= amount, "Insufficient deposit");
        require(totalReserves >= amount, "Insufficient reserves for withdrawal");
        userDeposits[msg.sender] -= amount;
        totalLiquidity -= amount;
        totalReserves -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }

    function payOut(address policyholder, uint256 amount) external whenNotPaused {
        require(totalReserves >= amount * RESERVE_RATIO / 100, "Insufficient reserves for payout");
        require(address(this).balance >= amount, "Insufficient balance");
        totalReserves -= amount;
        payable(policyholder).transfer(amount);
        emit Payout(msg.sender, policyholder, amount);
    }

    function getReserveRatio() external view returns (uint256) {
        if (totalLiquidity == 0) return 0;
        return (totalReserves * 100) / totalLiquidity;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}