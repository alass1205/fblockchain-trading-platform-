// 🔒 NOUVELLE FONCTION POUR MODE APPROBATION
app.post("/api/execute-trade-approval", async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log("🔗 Exécution trade (mode approbation - transfert direct):", { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        
        const addressesPath = path.join(__dirname, "deployed-addresses.json");
        const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
        
        const tokenABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../contracts/artifacts/contracts/TRGToken.sol/TRGToken.json"), "utf8")).abi;
        
        const quantityWei = ethers.utils.parseEther(quantity.toString());
        const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
        
        console.log("📋 Transferts ERC20 directs [MODE APPROBATION]...");
        
        // 1. Transférer l'asset du vendeur vers l'acheteur
        const assetContract = new ethers.Contract(addresses[assetSymbol], tokenABI, wallet);
        const transferAssetTx = await assetContract.transferFrom(
            sellerAddress,
            buyerAddress,
            quantityWei
        );
        await transferAssetTx.wait();
        console.log("✅ Asset transféré:", transferAssetTx.hash);
        
        // 2. Transférer TRG de l'acheteur vers le vendeur
        const trgContract = new ethers.Contract(addresses.TRG, tokenABI, wallet);
        const transferPaymentTx = await trgContract.transferFrom(
            buyerAddress,
            sellerAddress,
            totalPriceWei
        );
        await transferPaymentTx.wait();
        console.log("✅ Paiement transféré:", transferPaymentTx.hash);
        
        console.log("✅ Trade approbation exécuté!");
        
        res.json({
            success: true,
            message: "Trade exécuté en mode approbation (transfert direct)",
            transactionDetails: {
                asset: `${quantity} ${assetSymbol}`,
                payment: `${quantity * price} TRG`,
                buyer: buyerAddress,
                seller: sellerAddress,
                assetTxHash: transferAssetTx.hash,
                paymentTxHash: transferPaymentTx.hash
            }
        });
        
    } catch (error) {
        console.error("❌ Erreur execution trade approbation:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
