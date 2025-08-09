// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ShareToken is ERC20, Ownable {
    IERC20 public dividendToken;
    uint256 public totalDividends;
    mapping(address => uint256) public lastDividendPoints;
    uint256 public totalDividendPoints;
    
    event DividendDeposited(uint256 amount);
    event DividendWithdrawn(address indexed shareholder, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _dividendToken
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals());
        dividendToken = IERC20(_dividendToken);
    }

    function depositDividend(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(dividendToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        totalDividends += amount;
        if (totalSupply() > 0) {
            totalDividendPoints += (amount * 1e18) / totalSupply();
        }
        
        emit DividendDeposited(amount);
    }

    function withdrawDividend() external {
        uint256 owing = dividendOwing(msg.sender);
        require(owing > 0, "No dividend owing");
        
        lastDividendPoints[msg.sender] = totalDividendPoints;
        require(dividendToken.transfer(msg.sender, owing), "Transfer failed");
        
        emit DividendWithdrawn(msg.sender, owing);
    }

    function dividendOwing(address shareholder) public view returns (uint256) {
        uint256 newDividendPoints = totalDividendPoints - lastDividendPoints[shareholder];
        return (balanceOf(shareholder) * newDividendPoints) / 1e18;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0)) {
            uint256 owing = dividendOwing(from);
            if (owing > 0) {
                lastDividendPoints[from] = totalDividendPoints;
                dividendToken.transfer(from, owing);
            }
        }
        
        if (to != address(0)) {
            lastDividendPoints[to] = totalDividendPoints;
        }
    }
}
