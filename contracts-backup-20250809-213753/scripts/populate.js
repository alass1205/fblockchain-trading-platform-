const { ethers } = require("hardhat");

async function main() {
    console.log("🌱 Population de la plateforme avec les données initiales...");
    
    // Charger les adresses déployées
    const fs = require('fs');
    const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
    
    const [deployer, aya, beatriz] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Aya:", aya.address);
    console.log("Beatriz:", beatriz.address);

    // Connexion aux contrats
    const TRG = await ethers.getContractAt("StableCoin", addresses.TRG);
    const CLV = await ethers.getContractAt("ShareToken", addresses.CLV);
    const ROO = await ethers.getContractAt("ShareToken", addresses.ROO);
    const GOV = await ethers.getContractAt("BondToken", addresses.GOV);

    console.log("\n📋 État initial des contrats:");
    console.log("TRG Total Supply:", ethers.utils.formatEther(await TRG.totalSupply()));
    console.log("CLV Total Supply:", ethers.utils.formatEther(await CLV.totalSupply()));
    console.log("ROO Total Supply:", ethers.utils.formatEther(await ROO.totalSupply()));

    // 1. Distribution TRG à Aya et Beatriz
    console.log("\n💰 Distribution TRG...");
    await TRG.transfer(aya.address, ethers.utils.parseEther("200"));
    await TRG.transfer(beatriz.address, ethers.utils.parseEther("150"));
    console.log("✅ Aya reçoit 200 TRG");
    console.log("✅ Beatriz reçoit 150 TRG");

    // 2. Distribution CLV à Aya
    console.log("\n📈 Distribution CLV...");
    await CLV.transfer(aya.address, ethers.utils.parseEther("10"));
    console.log("✅ Aya reçoit 10 CLV");

    // 3. Distribution ROO à Beatriz
    console.log("\n📈 Distribution ROO...");
    await ROO.transfer(beatriz.address, ethers.utils.parseEther("20"));
    console.log("✅ Beatriz reçoit 20 ROO");

    // 4. Création des obligations GOV
    console.log("\n🏛️ Création des obligations GOV...");
    
    // Création de 2 obligations pour Aya
    await GOV.issueBond(aya.address, ethers.utils.parseEther("200"), 1000); // 10% interest
    await GOV.issueBond(aya.address, ethers.utils.parseEther("200"), 1000);
    console.log("✅ Aya reçoit 2 obligations GOV (200 TRG chacune, 10% intérêt)");

    // Création de 5 obligations pour Beatriz
    for(let i = 0; i < 5; i++) {
        await GOV.issueBond(beatriz.address, ethers.utils.parseEther("200"), 1000);
    }
    console.log("✅ Beatriz reçoit 5 obligations GOV (200 TRG chacune, 10% intérêt)");

    // Création d'obligations supplémentaires pour le deployer (pour avoir 20 au total)
    for(let i = 0; i < 13; i++) {
        await GOV.issueBond(deployer.address, ethers.utils.parseEther("200"), 1000);
    }
    console.log("✅ 13 obligations supplémentaires créées pour le deployer");

    // 5. Vérification finale
    console.log("\n📊 Vérification des balances finales:");
    
    console.log("\n--- AYA ---");
    console.log("TRG:", ethers.utils.formatEther(await TRG.balanceOf(aya.address)));
    console.log("CLV:", ethers.utils.formatEther(await CLV.balanceOf(aya.address)));
    console.log("ROO:", ethers.utils.formatEther(await ROO.balanceOf(aya.address)));
    const ayaBonds = await GOV.getBondsByOwner(aya.address);
    console.log("GOV Bonds:", ayaBonds.length);

    console.log("\n--- BEATRIZ ---");
    console.log("TRG:", ethers.utils.formatEther(await TRG.balanceOf(beatriz.address)));
    console.log("CLV:", ethers.utils.formatEther(await CLV.balanceOf(beatriz.address)));
    console.log("ROO:", ethers.utils.formatEther(await ROO.balanceOf(beatriz.address)));
    const beatrizBonds = await GOV.getBondsByOwner(beatriz.address);
    console.log("GOV Bonds:", beatrizBonds.length);

    console.log("\n--- TOTAUX ---");
    console.log("Total TRG Supply:", ethers.utils.formatEther(await TRG.totalSupply()));
    console.log("Total CLV Supply:", ethers.utils.formatEther(await CLV.totalSupply()));
    console.log("Total ROO Supply:", ethers.utils.formatEther(await ROO.totalSupply()));
    console.log("Total GOV Bonds:", await GOV.totalBonds());

    // Sauvegarde des adresses des utilisateurs
    const userData = {
        ...addresses,
        AYA: aya.address,
        BEATRIZ: beatriz.address
    };

    fs.writeFileSync('user-addresses.json', JSON.stringify(userData, null, 2));
    console.log("\n✅ Données utilisateurs sauvegardées dans user-addresses.json");
    console.log("\n🎉 Population terminée avec succès !");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
