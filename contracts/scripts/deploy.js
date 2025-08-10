const { ethers } = require("hardhat");

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
    
    // Vérification des déploiements

    // 2. Déploiement des actions CLV
    console.log("\n📄 Déploiement CLV Shares...");
    const ShareToken = await ethers.getContractFactory("ShareToken");
    const clvToken = await ShareToken.deploy("Clove Company", "CLV", 100, trgToken.address);
    await clvToken.deployed();
    console.log("CLV déployé à:", clvToken.address);
    
    // Vérification des déploiements

    // 3. Déploiement des actions ROO
    console.log("\n📄 Déploiement ROO Shares...");
    const rooToken = await ShareToken.deploy("Rooibos Limited", "ROO", 100, trgToken.address);
    await rooToken.deployed();
    console.log("ROO déployé à:", rooToken.address);
    
    // Vérification des déploiements

    // 4. Déploiement des obligations GOV
    console.log("\n📄 Déploiement GOV Bonds...");
    const BondToken = await ethers.getContractFactory("BondToken");
    const govBonds = await BondToken.deploy(trgToken.address);
    await govBonds.deployed();
    console.log("GOV déployé à:", govBonds.address);
    
    // Vérification des déploiements

    // 5. Déploiement du Vault
    console.log("\n📄 Déploiement Trading Vault...");
    const TradingVault = await ethers.getContractFactory("TradingVault");
    const vault = await TradingVault.deploy();
    await vault.deployed();
    console.log("Vault déployé à:", vault.address);
    
    // Vérification des déploiements

    // Sauvegarde des adresses
    const addresses = {
        TRG: trgToken.address,
        CLV: clvToken.address,
        ROO: rooToken.address,
        GOV: govBonds.address,
        VAULT: vault.address,
        DEPLOYER: deployer.address
    };

    console.log("\n📋 Résumé des déploiements:");
    console.log(JSON.stringify(addresses, null, 2));

    // Sauvegarde dans un fichier
    const fs = require('fs');
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("\n✅ Adresses sauvegardées dans deployed-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
