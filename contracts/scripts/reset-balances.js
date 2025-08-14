const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Reset des balances aux montants exacts...");
    
    const [deployer] = await ethers.getSigners();
    
    // Charger les adresses des contrats déployés
    const contractAddresses = JSON.parse(require('fs').readFileSync('deployed-addresses.json', 'utf8'));
    
    // Adresses des utilisateurs (hardcodées)
    const addresses = {
        AYA: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        BEATRIZ: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        TRG: contractAddresses.TRG,
        CLV: contractAddresses.CLV,
        ROO: contractAddresses.ROO,
        GOV: contractAddresses.GOV
    };
    
    console.log("📋 Adresses utilisées:");
    console.log("Aya:", addresses.AYA);
    console.log("Beatriz:", addresses.BEATRIZ);
    console.log("TRG Contract:", addresses.TRG);
    console.log("CLV Contract:", addresses.CLV);
    
    const TRG = await ethers.getContractAt("StableCoin", addresses.TRG);
    const CLV = await ethers.getContractAt("ShareToken", addresses.CLV);
    const ROO = await ethers.getContractAt("ShareToken", addresses.ROO);
    const GOV = await ethers.getContractAt("BondToken", addresses.GOV);
    
    // Vérifier les balances actuelles
    console.log("\n--- Balances actuelles ---");
    console.log("Aya TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.AYA)));
    console.log("Aya CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.AYA)));
    console.log("Beatriz TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz ROO:", ethers.utils.formatEther(await ROO.balanceOf(addresses.BEATRIZ)));
    
    // Reset Aya aux bonnes balances : 210 TRG, 9 CLV
    const ayaTrgBalance = await TRG.balanceOf(addresses.AYA);
    const ayaClvBalance = await CLV.balanceOf(addresses.AYA);
    
    const targetAyaTrg = ethers.utils.parseEther("210");
    const targetAyaClv = ethers.utils.parseEther("9");
    
    // Ajuster TRG Aya
    if (ayaTrgBalance.lt(targetAyaTrg)) {
        const diff = targetAyaTrg.sub(ayaTrgBalance);
        await TRG.transfer(addresses.AYA, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "TRG à Aya");
    } else if (ayaTrgBalance.gt(targetAyaTrg)) {
        const diff = ayaTrgBalance.sub(targetAyaTrg);
        console.log("⚠️ Aya a trop de TRG:", ethers.utils.formatEther(ayaTrgBalance), "(cible:", ethers.utils.formatEther(targetAyaTrg), ")");
    }
    
    // Ajuster CLV Aya  
    if (ayaClvBalance.lt(targetAyaClv)) {
        const diff = targetAyaClv.sub(ayaClvBalance);
        await CLV.transfer(addresses.AYA, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "CLV à Aya");
    } else if (ayaClvBalance.gt(targetAyaClv)) {
        console.log("⚠️ Aya a trop de CLV:", ethers.utils.formatEther(ayaClvBalance), "(cible:", ethers.utils.formatEther(targetAyaClv), ")");
    }
    
    // Reset Beatriz : 140 TRG, 1 CLV, garder 20 ROO
    const beatrizTrgBalance = await TRG.balanceOf(addresses.BEATRIZ);
    const beatrizClvBalance = await CLV.balanceOf(addresses.BEATRIZ);
    
    const targetBeatrizTrg = ethers.utils.parseEther("140");
    const targetBeatrizClv = ethers.utils.parseEther("1");
    
    // Ajuster TRG Beatriz
    if (beatrizTrgBalance.lt(targetBeatrizTrg)) {
        const diff = targetBeatrizTrg.sub(beatrizTrgBalance);
        await TRG.transfer(addresses.BEATRIZ, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "TRG à Beatriz");
    } else if (beatrizTrgBalance.gt(targetBeatrizTrg)) {
        console.log("⚠️ Beatriz a trop de TRG:", ethers.utils.formatEther(beatrizTrgBalance), "(cible:", ethers.utils.formatEther(targetBeatrizTrg), ")");
    }
    
    // Ajuster CLV Beatriz
    if (beatrizClvBalance.lt(targetBeatrizClv)) {
        const diff = targetBeatrizClv.sub(beatrizClvBalance);
        await CLV.transfer(addresses.BEATRIZ, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "CLV à Beatriz");
    } else if (beatrizClvBalance.gt(targetBeatrizClv)) {
        console.log("⚠️ Beatriz a trop de CLV:", ethers.utils.formatEther(beatrizClvBalance), "(cible:", ethers.utils.formatEther(targetBeatrizClv), ")");
    }
    
    console.log("\n--- Balances finales ---");
    console.log("Aya TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.AYA)));
    console.log("Aya CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.AYA)));
    console.log("Beatriz TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz ROO:", ethers.utils.formatEther(await ROO.balanceOf(addresses.BEATRIZ)));
    
    // Vérifier les obligations GOV
    try {
        const ayaBonds = await GOV.getBondsByOwner(addresses.AYA);
        const beatrizBonds = await GOV.getBondsByOwner(addresses.BEATRIZ);
        console.log("Aya GOV Bonds:", ayaBonds.length);
        console.log("Beatriz GOV Bonds:", beatrizBonds.length);
    } catch (error) {
        console.log("⚠️ Erreur GOV bonds:", error.message);
    }
    
    console.log("\n✅ Reset terminé - Balances corrigées !");
}

main().catch(console.error);
