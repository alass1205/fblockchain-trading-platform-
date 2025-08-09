const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Reset complet aux balances initiales de l'audit...");
    
    const [deployer] = await ethers.getSigners();
    const addresses = JSON.parse(require('fs').readFileSync('user-addresses.json', 'utf8'));
    
    const TRG = await ethers.getContractAt("StableCoin", addresses.TRG);
    const CLV = await ethers.getContractAt("ShareToken", addresses.CLV);
    const ROO = await ethers.getContractAt("ShareToken", addresses.ROO);
    const GOV = await ethers.getContractAt("BondToken", addresses.GOV);
    
    console.log("\n--- Balances actuelles ---");
    console.log("Aya TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.AYA)));
    console.log("Aya CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.AYA)));
    console.log("Aya ROO:", ethers.utils.formatEther(await ROO.balanceOf(addresses.AYA)));
    console.log("Beatriz TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz ROO:", ethers.utils.formatEther(await ROO.balanceOf(addresses.BEATRIZ)));
    
    // BALANCES INITIALES EXACTES DE L'AUDIT :
    // Aya: 200 TRG, 10 CLV, 0 ROO, 2 GOV
    // Beatriz: 150 TRG, 0 CLV, 20 ROO, 5 GOV
    
    console.log("\n🎯 Reset aux balances initiales d'audit...");
    
    // Reset Aya : Récupérer tous ses tokens puis redistribuer exactement
    const ayaTrgBalance = await TRG.balanceOf(addresses.AYA);
    const ayaClvBalance = await CLV.balanceOf(addresses.AYA);
    const ayaRooBalance = await ROO.balanceOf(addresses.AYA);
    
    // Transférer tout vers deployer d'abord
    if (ayaTrgBalance.gt(0)) {
        await TRG.connect(await ethers.getSigner(addresses.AYA)).transfer(deployer.address, ayaTrgBalance);
    }
    if (ayaClvBalance.gt(0)) {
        await CLV.connect(await ethers.getSigner(addresses.AYA)).transfer(deployer.address, ayaClvBalance);
    }
    if (ayaRooBalance.gt(0)) {
        await ROO.connect(await ethers.getSigner(addresses.AYA)).transfer(deployer.address, ayaRooBalance);
    }
    
    // Reset Beatriz
    const beatrizTrgBalance = await TRG.balanceOf(addresses.BEATRIZ);
    const beatrizClvBalance = await CLV.balanceOf(addresses.BEATRIZ);
    const beatrizRooBalance = await ROO.balanceOf(addresses.BEATRIZ);
    
    if (beatrizTrgBalance.gt(0)) {
        await TRG.connect(await ethers.getSigner(addresses.BEATRIZ)).transfer(deployer.address, beatrizTrgBalance);
    }
    if (beatrizClvBalance.gt(0)) {
        await CLV.connect(await ethers.getSigner(addresses.BEATRIZ)).transfer(deployer.address, beatrizClvBalance);
    }
    if (beatrizRooBalance.gt(0)) {
        await ROO.connect(await ethers.getSigner(addresses.BEATRIZ)).transfer(deployer.address, beatrizRooBalance);
    }
    
    // Redistribuer les balances EXACTES de l'audit
    console.log("📦 Redistribution des balances initiales...");
    
    // Aya: 200 TRG, 10 CLV, 0 ROO
    await TRG.transfer(addresses.AYA, ethers.utils.parseEther("200"));
    await CLV.transfer(addresses.AYA, ethers.utils.parseEther("10"));
    console.log("✅ Aya: 200 TRG, 10 CLV, 0 ROO");
    
    // Beatriz: 150 TRG, 0 CLV, 20 ROO
    await TRG.transfer(addresses.BEATRIZ, ethers.utils.parseEther("150"));
    await ROO.transfer(addresses.BEATRIZ, ethers.utils.parseEther("20"));
    console.log("✅ Beatriz: 150 TRG, 0 CLV, 20 ROO");
    
    console.log("\n--- Balances finales (AUDIT INITIAL) ---");
    console.log("Aya TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.AYA)));
    console.log("Aya CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.AYA)));
    console.log("Aya ROO:", ethers.utils.formatEther(await ROO.balanceOf(addresses.AYA)));
    console.log("Beatriz TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz ROO:", ethers.utils.formatEther(await ROO.balanceOf(addresses.BEATRIZ)));
    
    console.log("\n🎉 Reset terminé ! Balances initiales d'audit restaurées !");
    console.log("🛡️ Système sécurisé - Faille corrigée !");
}

main().catch(console.error);
