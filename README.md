# Blockchain Trading Platform

## Description
Plateforme de trading d'instruments financiers sur blockchain privée avec stablecoins, actions et obligations. Implémentation complète avec smart contracts, API backend et interface web.

## 🚀 Démarrage Rapide

### 1. Installation
```bash
git clone <repository-url>
cd blockchain-trading-platform
npm run install-all
```

### 2. Lancement (3 terminaux requis)

**Terminal 1 - Blockchain :**
```bash
cd contracts
npx hardhat node
```

**Terminal 2 - Déploiement et Backend :**
```bash
# Déploiement des smart contracts
cd contracts
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/populate.js --network localhost

# Démarrage du backend
cd ../backend
npm start
```

**Terminal 3 - Frontend :**
```bash
cd frontend
npm run dev
```

### 3. Accès
- **Interface web** : http://localhost:3000
- **API Backend** : http://localhost:3001
- **Blockchain** : http://localhost:8545

## 📋 Documentation Complète

### Installation et Déploiement
**📖 Consultez** : [`docs/INSTALLATION.md`](docs/INSTALLATION.md)
- Instructions détaillées d'installation
- Configuration MetaMask
- Résolution de problèmes

### Architecture Technique
**📖 Consultez** : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Vue d'ensemble du système
- Flux de données
- Technologies utilisées

### API Documentation
**📖 Consultez** : [`docs/API.md`](docs/API.md)
- Endpoints disponibles
- Exemples d'utilisation
- Codes d'erreur

### Smart Contracts
**📖 Consultez** : [`docs/CONTRACTS.md`](docs/CONTRACTS.md)
- Fonctions des contrats
- Modèle de sécurité
- Tests et validation

## ✅ Checklist d'Audit

### Fonctionnalités Requises
- [x] **Réseau blockchain** avec 3+ validateurs
- [x] **Smart contracts** : TRG, CLV, ROO, GOV, Vault
- [x] **Interface web** : Homepage, Assets, Portfolio, FAQ
- [x] **Trading** : Ordres buy/sell, matching, exécution
- [x] **Vault** : Dépôts/retraits sécurisés
- [x] **Script de population** : Données initiales Aya/Beatriz
- [x] **Documentation** : Installation, architecture, API, contrats

### Tests de Validation
- [x] Connexion MetaMask
- [x] Inscription utilisateur (nom + passeport)
- [x] Affichage du portfolio
- [x] Création d'ordres de vente/achat
- [x] Exécution de trades
- [x] Fonction de retrait

## 🛠️ Technologies

### Blockchain
- **Hardhat** - Framework de développement
- **Solidity 0.8.19** - Smart contracts
- **OpenZeppelin** - Librairies sécurisées
- **Ethers.js** - Interaction blockchain

### Backend
- **Node.js + Express** - Serveur API
- **SQLite** - Base de données
- **Multer** - Upload de fichiers

### Frontend
- **Next.js/React** - Interface utilisateur
- **MetaMask** - Connexion wallet
- **Chart.js** - Graphiques

## 🔧 Commandes Utiles

```bash
# Compilation smart contracts
cd contracts && npx hardhat compile

# Tests des contrats
cd contracts && npx hardhat test

# Redéploiement complet
cd contracts && npx hardhat run scripts/deploy.js --network localhost

# Test API
curl http://localhost:3001/api/test

# Nettoyage des ports
sudo lsof -ti:8545,3001,3000 | xargs sudo kill -9
```

## ⚠️ Avertissements

- **Réseau de test uniquement** - Ne pas utiliser en production
- **Clés privées publiques** - À des fins éducatives
- **Pas de vrais fonds** - Environnement de démonstration

## 📞 Support

En cas de problème :
1. Consultez la documentation dans `/docs/`
2. Vérifiez que tous les services sont démarrés
3. Consultez les logs des terminaux
4. Redémarrez les services si nécessaire

---

**🎯 Objectif** : Démonstration complète d'une plateforme de trading blockchain pour audit académique.