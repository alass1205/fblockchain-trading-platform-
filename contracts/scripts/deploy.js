const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Déploiement des smart contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Déploiement avec le compte:", deployer.address);
    console.log("Balance du compte:", ethers.utils.formatEther(await deployer.getBalance()));

    // 1. Déploiement du Stablecoin TRG
    console.log("\n📄 Déploiement TRG Stablecoin...");
    const StableCoin = await ethers.getContractFactory("StableCoin");
    const trgToken = await StableCoin.deploy("Triangle", "TRG", 4000);
    await trgToken.deployed();
    console.log("TRG déployé à:", trgToken.address);
    
    // 2. Déploiement des actions CLV
    console.log("\n📄 Déploiement CLV Shares...");
    const ShareToken = await ethers.getContractFactory("ShareToken");
    const clvToken = await ShareToken.deploy("Clove Company", "CLV", 100, trgToken.address);
    await clvToken.deployed();
    console.log("CLV déployé à:", clvToken.address);
    
    // 3. Déploiement des actions ROO
    console.log("\n📄 Déploiement ROO Shares...");
    const rooToken = await ShareToken.deploy("Rooibos Limited", "ROO", 100, trgToken.address);
    await rooToken.deployed();
    console.log("ROO déployé à:", rooToken.address);
    
    // 4. Déploiement des obligations GOV
    console.log("\n📄 Déploiement GOV Bonds...");
    const BondToken = await ethers.getContractFactory("BondToken");
    const govBonds = await BondToken.deploy(trgToken.address);
    await govBonds.deployed();
    console.log("GOV déployé à:", govBonds.address);
    
    // 5. Déploiement du Vault
    console.log("\n📄 Déploiement Trading Vault...");
    const TradingVault = await ethers.getContractFactory("TradingVault");
    const vault = await TradingVault.deploy();
    await vault.deployed();
    console.log("Vault déployé à:", vault.address);
    
    // Préparation des adresses
    const addresses = {
        TRG: trgToken.address,
        CLV: clvToken.address,
        ROO: rooToken.address,
        GOV: govBonds.address,
        VAULT: vault.address,
        DEPLOYER: deployer.address
    };

    // Adresses pour le backend (format compatible)
    const backendAddresses = {
        TRG: trgToken.address,
        CLV: clvToken.address,
        ROO: rooToken.address,
        GOV: govBonds.address,
        TradingVault: vault.address,  // ⚠️ Backend utilise "TradingVault" au lieu de "VAULT"
        DEPLOYER: deployer.address
    };
    
    console.log("\n📋 Résumé des déploiements:");
    console.log(JSON.stringify(addresses, null, 2));
    
    // 📝 Sauvegarde dans contracts/
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("\n✅ Adresses sauvegardées dans contracts/deployed-addresses.json");
    
    // 📋 Sauvegarde AUTOMATIQUE dans backend/
    const backendPath = path.join(__dirname, '../../backend/deployed-addresses.json');
    
    try {
        fs.writeFileSync(backendPath, JSON.stringify(backendAddresses, null, 2));
        console.log("✅ Adresses synchronisées vers backend/deployed-addresses.json");
    } catch (error) {
        console.log("⚠️  Erreur sync backend (dossier non trouvé):", error.message);
        console.log("💡 Copiez manuellement deployed-addresses.json vers le backend");
    }
    
    // 📋 Sauvegarde AUTOMATIQUE dans frontend/ (si nécessaire)
    const frontendPath = path.join(__dirname, '../../frontend/deployed-addresses.json');
    
    try {
        fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
        console.log("✅ Adresses synchronisées vers frontend/deployed-addresses.json");
    } catch (error) {
        console.log("⚠️  Frontend sync ignoré (optionnel)");
    }
    
    console.log("\n🎯 PROCHAINES ÉTAPES:");
    console.log("1. Redémarrez le backend si il est déjà lancé");
    console.log("2. Lancez le script populate.js :");
    console.log("   npx hardhat run scripts/populate.js --network localhost");
    console.log("3. Testez les balances :");
    console.log("   curl http://localhost:3001/api/balances/0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });