# Documentation des Smart Contracts

## Vue d'ensemble

Le système comprend 4 smart contracts principaux qui implémentent les instruments financiers et le système de custody.

## 1. StableCoin.sol

### Description
Token ERC20 pour le stablecoin TRG (Triangle) avec capacités de mint/burn par le propriétaire.

### Fonctions principales

#### `constructor(string name, string symbol, uint256 initialSupply)`
Initialise le token avec un supply initial.

#### `mint(address to, uint256 amount) onlyOwner`
Crée de nouveaux tokens et les assigne à une adresse.

#### `burn(uint256 amount) onlyOwner`
Détruit des tokens de l'adresse du propriétaire.

### Événements
- `Transfer(address from, address to, uint256 value)`
- `Approval(address owner, address spender, uint256 value)`

## 2. ShareToken.sol

### Description
Token ERC20 pour les actions avec système de dividendes automatique.

### Fonctions principales

#### `constructor(string name, string symbol, uint256 initialSupply, address dividendToken)`
Initialise le token d'actions avec le token de dividende associé.

#### `depositDividend(uint256 amount) onlyOwner`
Dépose des dividendes qui seront distribués proportionnellement aux détenteurs.

#### `withdrawDividend()`
Permet à un détenteur de retirer ses dividendes accumulés.

#### `dividendOwing(address shareholder) view returns (uint256)`
Calcule les dividendes dus à un détenteur d'actions.

### Événements
- `DividendDeposited(uint256 amount)`
- `DividendWithdrawn(address indexed shareholder, uint256 amount)`

### Mécanisme de dividendes
Le système utilise un points system pour distribuer automatiquement les dividendes lors des transferts.

## 3. BondToken.sol

### Description
Gestion des obligations avec métadonnées complètes et système de remboursement.

### Structure Bond
```solidity
struct Bond {
    uint256 serialNumber;
    uint256 principal;
    uint256 interestRate;    // Percentage * 100
    uint256 issuanceDate;
    uint256 maturityDate;
    address currentOwner;
    bool isRepaid;
}
```

### Fonctions principales

#### `issueBond(address to, uint256 principal, uint256 interestRate) onlyOwner returns (uint256)`
Crée une nouvelle obligation avec un numéro de série unique.

#### `transferBond(uint256 serialNumber, address to)`
Transfère la propriété d'une obligation à une nouvelle adresse.

#### `repayBond(uint256 serialNumber) onlyOwner`
Rembourse une obligation arrivée à maturité avec intérêts.

#### `getBondsByOwner(address owner) view returns (uint256[])`
Retourne la liste des numéros de série des obligations d'un propriétaire.

#### `getBondDetails(uint256 serialNumber) view returns (Bond)`
Retourne les détails complets d'une obligation.

### Événements
- `BondIssued(uint256 indexed serialNumber, address indexed owner, uint256 principal)`
- `BondTransferred(uint256 indexed serialNumber, address indexed from, address indexed to)`
- `BondRepaid(uint256 indexed serialNumber, uint256 amount)`

## 4. TradingVault.sol

### Description
Vault multi-signature pour la custody des actifs de la plateforme avec contrôle d'accès.

### Fonctions principales

#### `depositToken(address tokenAddress, uint256 amount)`
Permet à un utilisateur de déposer des tokens ERC20 dans le vault.

#### `depositBond(address bondContract, uint256 serialNumber)`
Permet à un utilisateur de déposer une obligation dans le vault.

#### `operateWithdrawal(address user, address tokenAddress, uint256 amount) onlyOwner`
Autorise le retrait de tokens pour un utilisateur (fonction admin).

#### `operateBondWithdrawal(address user, address bondContract, uint256 serialNumber) onlyOwner`
Autorise le retrait d'une obligation pour un utilisateur (fonction admin).

#### `getUserTokenBalance(address user, address tokenAddress) view returns (uint256)`
Retourne la balance d'un utilisateur pour un token spécifique.

#### `hasBondDeposit(address user, uint256 serialNumber) view returns (bool)`
Vérifie si un utilisateur a déposé une obligation spécifique.

### Événements
- `TokenDeposited(address indexed user, address indexed token, uint256 amount)`
- `TokenWithdrawn(address indexed user, address indexed token, uint256 amount)`
- `BondDeposited(address indexed user, address indexed bondContract, uint256 serialNumber)`
- `BondWithdrawn(address indexed user, address indexed bondContract, uint256 serialNumber)`

## Modèle de Sécurité

### Contrôles d'accès
- **onlyOwner** : Seul le déployeur peut exécuter certaines fonctions critiques
- **Input validation** : Vérification des paramètres d'entrée
- **State checks** : Validation de l'état avant exécution

### Patterns de sécurité utilisés
- **Checks-Effects-Interactions** : Ordre d'exécution sécurisé
- **Reentrancy protection** : Protection contre les attaques de réentrance
- **Integer overflow protection** : Solidity 0.8+ protection native

## Déploiement

### Ordre de déploiement
1. `StableCoin` (TRG) - token de base
2. `ShareToken` (CLV, ROO) - actions avec TRG comme dividend token
3. `BondToken` (GOV) - obligations avec TRG comme payment token
4. `TradingVault` - vault pour la custody

### Adresses de déploiement
Les adresses sont sauvegardées dans `deployed-addresses.json` après déploiement.

## Tests et Validation

### Scénarios de test recommandés
1. Mint/burn de TRG
2. Transfert d'actions et distribution de dividendes
3. Création et transfert d'obligations
4. Dépôt et retrait via le vault
5. Remboursement d'obligations à maturité

### Commandes de test
```bash
cd contracts
npx hardhat test
npx hardhat coverage  # Si coverage installé
```

## Gas Optimization

### Optimisations implémentées
- Compiler optimizer activé (200 runs)
- Structs packés pour réduire les slots de storage
- Events pour remplacer les getters coûteux
- Batch operations où possible

### Estimation des coûts
- Déploiement TRG: ~1,500,000 gas
- Déploiement ShareToken: ~2,000,000 gas
- Déploiement BondToken: ~2,500,000 gas
- Déploiement TradingVault: ~1,800,000 gas