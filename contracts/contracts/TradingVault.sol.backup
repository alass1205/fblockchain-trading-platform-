// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BondToken.sol";

contract TradingVault is Ownable {
    mapping(address => mapping(address => uint256)) public userTokenBalances;
    mapping(address => mapping(uint256 => bool)) public userBondDeposits;
    
    event TokenDeposited(address indexed user, address indexed token, uint256 amount);
    event TokenWithdrawn(address indexed user, address indexed token, uint256 amount);
    event BondDeposited(address indexed user, address indexed bondContract, uint256 serialNumber);
    event BondWithdrawn(address indexed user, address indexed bondContract, uint256 serialNumber);

    function depositToken(address tokenAddress, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        userTokenBalances[msg.sender][tokenAddress] += amount;
        emit TokenDeposited(msg.sender, tokenAddress, amount);
    }

    function depositBond(address bondContract, uint256 serialNumber) external {
        BondToken bondToken = BondToken(bondContract);
        bondToken.transferBond(serialNumber, address(this));
        userBondDeposits[msg.sender][serialNumber] = true;
        
        emit BondDeposited(msg.sender, bondContract, serialNumber);
    }

    function operateWithdrawal(
        address user,
        address tokenAddress,
        uint256 amount
    ) external onlyOwner {
        require(userTokenBalances[user][tokenAddress] >= amount, "Insufficient balance");
        
        userTokenBalances[user][tokenAddress] -= amount;
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(user, amount), "Transfer failed");
        
        emit TokenWithdrawn(user, tokenAddress, amount);
    }

    function operateBondWithdrawal(
        address user,
        address bondContract,
        uint256 serialNumber
    ) external onlyOwner {
        require(userBondDeposits[user][serialNumber], "Bond not deposited by user");
        
        userBondDeposits[user][serialNumber] = false;
        BondToken bondToken = BondToken(bondContract);
        bondToken.transferBond(serialNumber, user);
        
        emit BondWithdrawn(user, bondContract, serialNumber);
    }

    function getUserTokenBalance(address user, address tokenAddress) external view returns (uint256) {
        return userTokenBalances[user][tokenAddress];
    }

    function hasBondDeposit(address user, uint256 serialNumber) external view returns (bool) {
        return userBondDeposits[user][serialNumber];
    }
}
