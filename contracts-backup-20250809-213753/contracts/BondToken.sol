// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BondToken is Ownable {
    struct Bond {
        uint256 serialNumber;
        uint256 principal;
        uint256 interestRate; // Percentage * 100 (e.g., 1000 = 10%)
        uint256 issuanceDate;
        uint256 maturityDate;
        address currentOwner;
        bool isRepaid;
    }

    IERC20 public paymentToken;
    mapping(uint256 => Bond) public bonds;
    mapping(address => uint256[]) public ownerBonds;
    uint256 public nextSerialNumber = 1;
    uint256 public totalBonds;

    event BondIssued(uint256 indexed serialNumber, address indexed owner, uint256 principal);
    event BondTransferred(uint256 indexed serialNumber, address indexed from, address indexed to);
    event BondRepaid(uint256 indexed serialNumber, uint256 amount);

    constructor(address _paymentToken) {
        paymentToken = IERC20(_paymentToken);
    }

    function issueBond(
        address to,
        uint256 principal,
        uint256 interestRate
    ) external onlyOwner returns (uint256) {
        uint256 serialNumber = nextSerialNumber++;
        
        bonds[serialNumber] = Bond({
            serialNumber: serialNumber,
            principal: principal,
            interestRate: interestRate,
            issuanceDate: block.timestamp,
            maturityDate: block.timestamp + 365 days,
            currentOwner: to,
            isRepaid: false
        });
        
        ownerBonds[to].push(serialNumber);
        totalBonds++;
        
        emit BondIssued(serialNumber, to, principal);
        return serialNumber;
    }

    function transferBond(uint256 serialNumber, address to) external {
        require(bonds[serialNumber].currentOwner == msg.sender, "Not bond owner");
        require(!bonds[serialNumber].isRepaid, "Bond already repaid");
        
        address from = msg.sender;
        bonds[serialNumber].currentOwner = to;
        
        // Remove from sender's bonds
        _removeBondFromOwner(from, serialNumber);
        
        // Add to receiver's bonds
        ownerBonds[to].push(serialNumber);
        
        emit BondTransferred(serialNumber, from, to);
    }

    function repayBond(uint256 serialNumber) external onlyOwner {
        Bond storage bond = bonds[serialNumber];
        require(!bond.isRepaid, "Bond already repaid");
        require(block.timestamp >= bond.maturityDate, "Bond not matured");
        
        uint256 repaymentAmount = bond.principal + (bond.principal * bond.interestRate / 10000);
        
        require(paymentToken.transferFrom(msg.sender, bond.currentOwner, repaymentAmount), "Payment failed");
        
        bond.isRepaid = true;
        
        emit BondRepaid(serialNumber, repaymentAmount);
    }

    function getBondsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerBonds[owner];
    }

    function getBondDetails(uint256 serialNumber) external view returns (Bond memory) {
        return bonds[serialNumber];
    }

    function _removeBondFromOwner(address owner, uint256 serialNumber) internal {
        uint256[] storage ownerBondsList = ownerBonds[owner];
        for (uint256 i = 0; i < ownerBondsList.length; i++) {
            if (ownerBondsList[i] == serialNumber) {
                ownerBondsList[i] = ownerBondsList[ownerBondsList.length - 1];
                ownerBondsList.pop();
                break;
            }
        }
    }
}
