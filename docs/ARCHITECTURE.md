# Architecture du Projet

## Vue d'ensemble

Le projet implémente une plateforme de trading d'instruments financiers sur blockchain avec une architecture hybride :
- **Exécution centralisée** des ordres
- **Custody décentralisée** via smart contracts
- **Interface web** moderne avec React/Next.js

## Structure des Dossiers

```
blockchain-trading-platform/
├── contracts/          # Smart contracts Solidity
│   ├── contracts/      # Fichiers .sol
│   ├── scripts/        # Scripts de déploiement
│   ├── test/          # Tests des contrats
│   └── artifacts/     # Contrats compilés
├── backend/           # Serveur API Node.js
├── frontend/          # Interface React/Next.js
├── docs/             # Documentation
└── deployment/       # Scripts de déploiement
```

## Composants Principaux

### 1. Blockchain Layer

**Réseau privé** : 3+ nœuds validateurs (Hardhat Network)

**Smart Contracts** :
- `StableCoin.sol` : Token ERC20 pour TRG avec mint/burn
- `ShareToken.sol` : Actions avec système de dividendes
- `BondToken.sol` : Obligations avec métadonnées complètes
- `TradingVault.sol` : Vault multi-signature pour la custody

### 2. Backend Layer

**Serveur Express.js** avec :
- API REST pour le frontend
- Intégration blockchain via ethers.js
- Base de données SQLite pour les ordres
- Upload de fichiers (passeports)

**Base de données** :
- `assets` : Liste des instruments financiers
- `users` : Données d'inscription (KYC basique)
- `orders` : Carnet d'ordres centralisé
- `price_history` : Historique des prix

### 3. Frontend Layer

**Next.js/React** avec :
- Connexion MetaMask
- Pages dynamiques par actif
- Interface de trading temps réel
- Portfolio et visualisations

## Flux de Données

### Trading Flow

1. **Connexion** : Utilisateur connecte MetaMask
2. **KYC** : Inscription avec nom et passeport
3. **Dépôt** : Transfert d'actifs vers le vault
4. **Trading** : Création d'ordres via l'API
5. **Matching** : Exécution centralisée des ordres
6. **Settlement** : Mise à jour des balances
7. **Retrait** : Récupération des actifs du vault

### Architecture de Sécurité

```
User Wallet ←→ TradingVault ←→ Backend API ←→ Frontend
     ↓              ↓              ↓           ↓
 Private Keys   Smart Contract   Database   MetaMask
```

## Technologies Utilisées

### Blockchain
- **Hardhat** : Framework de développement
- **Solidity 0.8.19** : Language des smart contracts
- **OpenZeppelin** : Librairies sécurisées
- **Ethers.js** : Interaction avec la blockchain

### Backend
- **Node.js** : Runtime JavaScript
- **Express.js** : Framework web
- **SQLite** : Base de données
- **Multer** : Upload de fichiers

### Frontend
- **Next.js** : Framework React
- **MetaMask** : Wallet integration
- **Chart.js** : Graphiques
- **CSS** : Styling personnalisé

## Patterns de Design

### Smart Contracts
- **Ownable** : Contrôle d'accès pour les fonctions admin
- **ERC20** : Standard pour les tokens fongibles
- **Events** : Émission d'événements pour la traçabilité
- **Modifiers** : Validation des conditions

### Backend
- **REST API** : Interface standard HTTP
- **Middleware** : CORS, JSON parsing, file upload
- **Error Handling** : Gestion centralisée des erreurs
- **Database Abstraction** : Requêtes SQL paramétrées

### Frontend
- **Component-Based** : Architecture modulaire React
- **State Management** : useState/useEffect hooks
- **Responsive Design** : Interface adaptative
- **Error Boundaries** : Gestion des erreurs UI

## Scalabilité et Performance

### Optimisations Blockchain
- Compilation optimisée (200 runs)
- Gas optimization dans les contrats
- Events pour l'indexation off-chain

### Backend Performance
- Connection pooling SQLite
- Caching des données blockchain
- Rate limiting (à implémenter)

### Frontend Optimization
- Server-side rendering (Next.js)
- Code splitting automatique
- Lazy loading des composants

## Sécurité

### Smart Contract Security
- OpenZeppelin libraries
- Access control (onlyOwner)
- Input validation
- Reentrancy protection

### Backend Security
- Input sanitization
- File upload restrictions
- CORS configuration
- Error message sanitization

### Frontend Security
- MetaMask signature verification
- Client-side validation
- XSS prevention
- Secure file handling