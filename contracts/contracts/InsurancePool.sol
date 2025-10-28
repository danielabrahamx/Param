// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract InsurancePool is Ownable, Pausable {
    address public policyFactory;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event PremiumReceived(address indexed from, uint256 amount);
    event PolicyFunded(address indexed policy, uint256 amount);

    constructor() Ownable() {}
    
    function setPolicyFactory(address _factory) external onlyOwner {
        policyFactory = _factory;
    }

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Deposit must be greater than 0");
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner whenNotPaused {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    // Receive premium payment from policy creation
    function receivePremium() external payable whenNotPaused {
        require(msg.value > 0, "Premium must be greater than 0");
        emit PremiumReceived(msg.sender, msg.value);
    }
    
    // Fund a policy contract with coverage amount
    function fundPolicy(address payable policyAddress, uint256 coverageAmountWei) external whenNotPaused {
        require(msg.sender == policyFactory || msg.sender == owner(), "Only factory or owner");
        
        // coverageAmountWei is in wei (18 decimals) on Hedera EVM
        require(address(this).balance >= coverageAmountWei, "Insufficient balance in pool");
        
        // Transfer in wei
        policyAddress.transfer(coverageAmountWei);
        
        emit PolicyFunded(policyAddress, coverageAmountWei);
    }

    function getBalance() external view returns (uint256) {
        // On Hedera EVM, balance is in wei (18 decimals) just like Ethereum
        return address(this).balance;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}