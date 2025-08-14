// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TradingVault {
    
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Events pour la traçabilité
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    event Transfer(address indexed token, address indexed from, address indexed to, uint256 amount);
    
    // Mapping : token => user => balance
    mapping(address => mapping(address => uint256)) public balances;
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Déposer des tokens dans le vault
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Token invalide");
        require(amount > 0, "Montant doit etre positif");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[token][msg.sender] += amount;
        
        emit Deposit(msg.sender, token, amount);
    }
    
    /**
     * @dev Retirer des tokens du vault
     */
    function withdraw(address token, uint256 amount) external {
        require(token != address(0), "Token invalide");
        require(amount > 0, "Montant doit etre positif");
        require(balances[token][msg.sender] >= amount, "Solde insuffisant");
        
        balances[token][msg.sender] -= amount;
        IERC20(token).transfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, token, amount);
    }
    
    /**
     * @dev Transférer des tokens entre utilisateurs (réservé au owner/plateforme)
     */
    function transferFromVault(
        address token, 
        address from, 
        address to, 
        uint256 amount
    ) external onlyOwner {
        require(token != address(0), "Token invalide");
        require(from != address(0) && to != address(0), "Adresses invalides");
        require(amount > 0, "Montant doit etre positif");
        require(balances[token][from] >= amount, "Solde insuffisant");
        
        balances[token][from] -= amount;
        balances[token][to] += amount;
        
        emit Transfer(token, from, to, amount);
    }
    
    /**
     * @dev Retirer des tokens pour un utilisateur (opération administrative)
     */
    function operateWithdrawal(
        address user, 
        address token, 
        uint256 amount
    ) external onlyOwner {
        require(token != address(0), "Token invalide");
        require(user != address(0), "Utilisateur invalide");
        require(amount > 0, "Montant doit etre positif");
        require(balances[token][user] >= amount, "Solde insuffisant");
        
        balances[token][user] -= amount;
        IERC20(token).transfer(user, amount);
        
        emit Withdrawal(user, token, amount);
    }
    
    /**
     * @dev Obtenir le solde d'un utilisateur pour un token
     */
    function getBalance(address token, address user) external view returns (uint256) {
        return balances[token][user];
    }
    
    /**
     * @dev Obtenir les soldes de plusieurs tokens pour un utilisateur
     */
    function getBalances(
        address[] calldata tokens, 
        address user
    ) external view returns (uint256[] memory) {
        uint256[] memory userBalances = new uint256[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            userBalances[i] = balances[tokens[i]][user];
        }
        return userBalances;
    }

    /**
     * @dev Exécuter un trade avec transferFrom direct
     */
    function executeTrade(
        address assetToken,
        address paymentToken,
        address seller,
        address buyer,
        uint256 assetAmount,
        uint256 paymentAmount
    ) external onlyOwner {
        require(assetToken != address(0) && paymentToken != address(0), "Token invalide");
        require(seller != address(0) && buyer != address(0), "Adresses invalides");
        require(assetAmount > 0 && paymentAmount > 0, "Montants doivent etre positifs");
        require(seller != buyer, "Vendeur et acheteur doivent etre differents");
        
        // Vérifier que les allowances sont suffisantes
        require(
            IERC20(assetToken).allowance(seller, address(this)) >= assetAmount,
            "Seller asset allowance insufficient"
        );
        require(
            IERC20(paymentToken).allowance(buyer, address(this)) >= paymentAmount,
            "Buyer payment allowance insufficient"
        );
        
        // TransferFrom asset du vendeur vers acheteur
        require(
            IERC20(assetToken).transferFrom(seller, buyer, assetAmount),
            "Asset transfer failed"
        );
        
        // TransferFrom payment de l'acheteur vers vendeur
        require(
            IERC20(paymentToken).transferFrom(buyer, seller, paymentAmount),
            "Payment transfer failed"
        );
        
        // Émettre événements pour la traçabilité
        emit Transfer(assetToken, seller, buyer, assetAmount);
        emit Transfer(paymentToken, buyer, seller, paymentAmount);
    }
}
