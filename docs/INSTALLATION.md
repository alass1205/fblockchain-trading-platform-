# Guide d'Installation et de Déploiement

## Prérequis

- Node.js v16+ (testé avec v18.19.1)
- npm v8+
- Git
- Navigateur avec MetaMask installé

## Installation Complète

### 1. Cloner et configurer le projet

```bash
git clone <repository-url>
cd blockchain-trading-platform

# Installation des dépendances principales
npm install

# Installation des dépendances pour chaque module
npm run install-all
```

### 2. Déploiement du réseau blockchain

```bash
# Se positionner dans le dossier contracts
cd contracts

# Démarrer le réseau blockchain (Terminal 1)
npx hardhat node

# Dans un nouveau terminal, déployer les smart contracts
cd contracts
npx hardhat run scripts/deploy.js --network localhost

# Peupler la plateforme avec les données initiales
npx hardhat run scripts/populate.js --network localhost
```

### 3. Démarrage du backend

```bash
# Dans un nouveau terminal
cd backend
npm start
```

Le serveur backend démarre sur http://localhost:3001

### 4. Démarrage du frontend

```bash
# Dans un nouveau terminal
cd frontend
npm run dev
```

L'interface web est accessible sur http://localhost:3000

## Configuration MetaMask

1. Ajouter le réseau local :
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Importer un compte de test :
   - Clé privée Aya: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Clé privée Beatriz: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

## Vérification du Déploiement

1. **Blockchain** : Le nœud Hardhat affiche les comptes et transactions
2. **Smart Contracts** : Vérifiez que deployed-addresses.json existe
3. **Backend** : Test avec `curl http://localhost:3001/api/test`
4. **Frontend** : Ouvrez http://localhost:3000 et connectez MetaMask

## Commandes Utiles

```bash
# Recompiler les smart contracts
cd contracts && npx hardhat compile

# Redéployer les contrats
cd contracts && npx hardhat run scripts/deploy.js --network localhost

# Restart complet
pkill -f hardhat && pkill -f node
# Puis relancer les 3 terminaux
```

## Résolution de Problèmes

### Port déjà utilisé
```bash
sudo lsof -ti:8545 | xargs sudo kill -9
sudo lsof -ti:3001 | xargs sudo kill -9
sudo lsof -ti:3000 | xargs sudo kill -9
```

### Smart contracts non trouvés
```bash
cd contracts
rm -rf artifacts cache
npx hardhat compile
```

### MetaMask ne se connecte pas
- Vérifiez le réseau (Chain ID 31337)
- Reset account dans MetaMask settings
- Rechargez la page web