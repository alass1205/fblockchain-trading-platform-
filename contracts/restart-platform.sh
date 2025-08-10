#!/bin/bash

echo "🔄 Redémarrage complet de la plateforme"

# 1. Tuer tous les processus
echo "🛑 Arrêt des processus..."
pkill -f "npx hardhat node" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# 2. Nettoyer les ports
sudo lsof -ti:8545,3001,3000 | xargs sudo kill -9 2>/dev/null || true

# 3. Recompiler les contrats
echo "🔨 Compilation des contrats..."
npx hardhat compile

# 4. Démarrer la blockchain
echo "⛓️ Démarrage blockchain..."
npx hardhat node &
sleep 5

# 5. Déployer
echo "🚀 Déploiement..."
npx hardhat run scripts/deploy.js --network localhost

# 6. Peupler
echo "🎯 Population..."
npx hardhat run scripts/populate.js --network localhost

echo "✅ Redémarrage terminé!"
echo "💡 Démarrez maintenant:"
echo "   Terminal 1: cd backend && npm start"  
echo "   Terminal 2: cd frontend && npm run dev"
