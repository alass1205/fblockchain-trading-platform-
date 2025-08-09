const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Reset des balances aux montants exacts...");
    
    const [deployer] = await ethers.getSigners();
    const addresses = JSON.parse(require('fs').readFileSync('user-addresses.json', 'utf8'));
    
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
        // Note: On ne peut pas reprendre les tokens facilement, on va les laisser
        console.log("⚠️ Aya a trop de TRG:", ethers.utils.formatEther(ayaTrgBalance));
    }
    
    // Ajuster CLV Aya  
    if (ayaClvBalance.lt(targetAyaClv)) {
        const diff = targetAyaClv.sub(ayaClvBalance);
        await CLV.transfer(addresses.AYA, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "CLV à Aya");
    }
    
    // Reset Beatriz : 140 TRG, 1 CLV
    const beatrizTrgBalance = await TRG.balanceOf(addresses.BEATRIZ);
    const beatrizClvBalance = await CLV.balanceOf(addresses.BEATRIZ);
    
    const targetBeatrizTrg = ethers.utils.parseEther("140");
    const targetBeatrizClv = ethers.utils.parseEther("1");
    
    // Ajuster TRG Beatriz
    if (beatrizTrgBalance.lt(targetBeatrizTrg)) {
        const diff = targetBeatrizTrg.sub(beatrizTrgBalance);
        await TRG.transfer(addresses.BEATRIZ, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "TRG à Beatriz");
    }
    
    // Ajuster CLV Beatriz
    if (beatrizClvBalance.lt(targetBeatrizClv)) {
        const diff = targetBeatrizClv.sub(beatrizClvBalance);
        await CLV.transfer(addresses.BEATRIZ, diff);
        console.log("✅ Ajouté", ethers.utils.formatEther(diff), "CLV à Beatriz");
    }
    
    console.log("\n--- Balances finales ---");
    console.log("Aya TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.AYA)));
    console.log("Aya CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.AYA)));
    console.log("Beatriz TRG:", ethers.utils.formatEther(await TRG.balanceOf(addresses.BEATRIZ)));
    console.log("Beatriz CLV:", ethers.utils.formatEther(await CLV.balanceOf(addresses.BEATRIZ)));
    
    console.log("\n✅ Reset terminé - Balances corrigées !");
}

main().catch(console.error);
