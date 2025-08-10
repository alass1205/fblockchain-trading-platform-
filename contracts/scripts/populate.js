const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🌱 Population de la plateforme avec les données initiales...");
    
    // Charger les adresses déployées
    const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json", "utf8"));
    
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    const aya = signers[1];  // Utiliser les signers Hardhat
    const beatriz = signers[2];
    
    console.log("Deployer:", deployer.address);
    console.log("Aya:", aya.address);
    console.log("Beatriz:", beatriz.address);

    // Charger les contrats
    const trg = await hre.ethers.getContractAt("StableCoin", addresses.TRG);
    const clv = await hre.ethers.getContractAt("ShareToken", addresses.CLV);
    const roo = await hre.ethers.getContractAt("ShareToken", addresses.ROO);
    const gov = await hre.ethers.getContractAt("BondToken", addresses.GOV);

    console.log("\n📋 État initial des contrats:");
    console.log("TRG Total Supply:", hre.ethers.utils.formatUnits(await trg.totalSupply(), 18));
    console.log("CLV Total Supply:", hre.ethers.utils.formatUnits(await clv.totalSupply(), 18));
    console.log("ROO Total Supply:", hre.ethers.utils.formatUnits(await roo.totalSupply(), 18));

    console.log("\n💰 Distribution TRG...");
    await trg.transfer(aya.address, hre.ethers.utils.parseUnits("200", 18));
    await trg.transfer(beatriz.address, hre.ethers.utils.parseUnits("150", 18));
    console.log("✅ Aya reçoit 200 TRG");
    console.log("✅ Beatriz reçoit 150 TRG");

    console.log("\n📈 Distribution CLV...");
    await clv.transfer(aya.address, hre.ethers.utils.parseUnits("10", 18));
    console.log("✅ Aya reçoit 10 CLV");

    console.log("\n📈 Distribution ROO...");
    await roo.transfer(beatriz.address, hre.ethers.utils.parseUnits("20", 18));
    console.log("✅ Beatriz reçoit 20 ROO");

    console.log("\n🏛️ Création des obligations GOV...");
    
    // Créer 2 obligations pour Aya
    for (let i = 0; i < 2; i++) {
        await gov.issueBond(aya.address, 200, 10);
    }
    console.log("✅ Aya reçoit 2 obligations GOV (200 TRG chacune, 10% intérêt)");

    // Créer 5 obligations pour Beatriz  
    for (let i = 0; i < 5; i++) {
        await gov.issueBond(beatriz.address, 200, 10);
    }
    console.log("✅ Beatriz reçoit 5 obligations GOV (200 TRG chacune, 10% intérêt)");

    // Créer 13 obligations supplémentaires pour le deployer
    for (let i = 0; i < 13; i++) {
        await gov.issueBond(deployer.address, 200, 10);
    }
    console.log("✅ 13 obligations supplémentaires créées pour le deployer");

    console.log("\n📊 Vérification des balances finales:");

    console.log("\n--- AYA ---");
    console.log("TRG:", hre.ethers.utils.formatUnits(await trg.balanceOf(aya.address), 18));
    console.log("CLV:", hre.ethers.utils.formatUnits(await clv.balanceOf(aya.address), 18));
    console.log("ROO:", hre.ethers.utils.formatUnits(await roo.balanceOf(aya.address), 18));
    const ayaBonds = await gov.getBondsByOwner(aya.address);
    console.log("GOV Bonds:", ayaBonds.length);

    console.log("\n--- BEATRIZ ---");
    console.log("TRG:", hre.ethers.utils.formatUnits(await trg.balanceOf(beatriz.address), 18));
    console.log("CLV:", hre.ethers.utils.formatUnits(await clv.balanceOf(beatriz.address), 18));
    console.log("ROO:", hre.ethers.utils.formatUnits(await roo.balanceOf(beatriz.address), 18));
    const beatrizBonds = await gov.getBondsByOwner(beatriz.address);
    console.log("GOV Bonds:", beatrizBonds.length);

    console.log("\n--- TOTAUX ---");
    console.log("Total TRG Supply:", hre.ethers.utils.formatUnits(await trg.totalSupply(), 18));
    console.log("Total CLV Supply:", hre.ethers.utils.formatUnits(await clv.totalSupply(), 18));
    console.log("Total ROO Supply:", hre.ethers.utils.formatUnits(await roo.totalSupply(), 18));
    const totalBonds = await gov.totalBonds();
    console.log("Total GOV Bonds:", totalBonds);

    // Sauvegarder les adresses utilisateur
    const userAddresses = {
        aya: aya.address,
        beatriz: beatriz.address,
        deployer: deployer.address
    };

    fs.writeFileSync("user-addresses.json", JSON.stringify(userAddresses, null, 2));
    console.log("\n✅ Données utilisateurs sauvegardées dans user-addresses.json");
    console.log("\n🎯 Adresses finales pour MetaMask :");
    console.log("👤 Aya:", aya.address);
    console.log("👤 Beatriz:", beatriz.address);
    console.log("✅ Population terminée avec succès !");
}

main().catch((error) => {
    console.error("❌ Erreur:", error);
    process.exitCode = 1;
});
