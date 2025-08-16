const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Remplacer complètement la route execute-trade
const newCode = `
// Fonction pour trade en mode approbation (transferFrom)
async function executeApprovalTrade(buyerAddress, sellerAddress, assetSymbol, quantity, price) {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    
    const addressesPath = path.join(__dirname, "deployed-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const vaultABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../contracts/artifacts/contracts/TradingVault.sol/TradingVault.json"), "utf8")).abi;
    const vaultContract = new ethers.Contract(addresses.TradingVault, vaultABI, wallet);
    
    const quantityWei = ethers.utils.parseEther(quantity.toString());
    const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
    
    console.log("📋 Appel vault.executeTrade() [MODE APPROBATION]...");
    
    const tradeTx = await vaultContract.executeTrade(
        addresses[assetSymbol],
        addresses.TRG,
        sellerAddress,
        buyerAddress,
        quantityWei,
        totalPriceWei
    );
    
    await tradeTx.wait();
    console.log("✅ Trade approbation exécuté!");
}

// Fonction pour trade en mode vault (fonds déposés)
async function executeVaultTrade(buyerAddress, sellerAddress, assetSymbol, quantity, price) {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    
    const addressesPath = path.join(__dirname, "deployed-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const vaultABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../contracts/artifacts/contracts/TradingVault.sol/TradingVault.json"), "utf8")).abi;
    const vaultContract = new ethers.Contract(addresses.TradingVault, vaultABI, wallet);
    
    const quantityWei = ethers.utils.parseEther(quantity.toString());
    const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
    
    console.log("📋 Appel vault.transferFromVault() [MODE VAULT]...");
    
    // Transférer l'asset du vendeur vers l'acheteur
    await vaultContract.transferFromVault(
        addresses[assetSymbol],
        sellerAddress,
        buyerAddress,
        quantityWei
    );
    
    // Transférer le payment de l'acheteur vers le vendeur
    await vaultContract.transferFromVault(
        addresses.TRG,
        buyerAddress,
        sellerAddress,
        totalPriceWei
    );
    
    console.log("✅ Trade vault exécuté!");
}

// Fonction pour mettre à jour les ordres après trade
async function updateOrdersAfterTrade(assetSymbol, buyerAddress, sellerAddress, quantity, price) {
    await new Promise((resolve, reject) => {
        db.run(
            "UPDATE orders SET status = ? WHERE asset_symbol = ? AND order_type = ? AND user_address = ? AND status = ?",
            ["filled", assetSymbol, "sell", sellerAddress, "pending"],
            function(err) { if (err) reject(err); else resolve(); }
        );
    });
    
    await new Promise((resolve, reject) => {
        db.run(
            "UPDATE orders SET status = ? WHERE asset_symbol = ? AND order_type = ? AND user_address = ? AND status = ?",
            ["filled", assetSymbol, "buy", buyerAddress, "pending"],
            function(err) { if (err) reject(err); else resolve(); }
        );
    });
}

// Route pour exécuter un trade réel sur blockchain
app.post("/api/execute-trade", async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log("🔗 Exécution trade:", { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        // Déterminer le mode en vérifiant les ordres dans la base
        const sellOrder = await new Promise((resolve, reject) => {
            db.get(
                'SELECT mode FROM orders WHERE user_address = ? AND asset_symbol = ? AND order_type = ? AND status = ? LIMIT 1',
                [sellerAddress, assetSymbol, 'sell', 'pending'],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        const mode = sellOrder ? sellOrder.mode : 'vault'; // défaut vault
        console.log("🎯 Mode détecté:", mode);
        
        if (mode === 'approval') {
            // MODE APPROBATION - utilise transferFrom avec allowances
            await executeApprovalTrade(buyerAddress, sellerAddress, assetSymbol, quantity, price);
        } else {
            // MODE VAULT - utilise les fonds du vault
            await executeVaultTrade(buyerAddress, sellerAddress, assetSymbol, quantity, price);
        }
        
        // Mettre à jour les ordres en base
        await updateOrdersAfterTrade(assetSymbol, buyerAddress, sellerAddress, quantity, price);
        
        res.json({
            success: true,
            message: \`Trade exécuté en mode \${mode}\`,
            mode: mode,
            transactionDetails: {
                asset: \`\${quantity} \${assetSymbol}\`,
                payment: \`\${quantity * price} TRG\`,
                buyer: buyerAddress,
                seller: sellerAddress
            }
        });
        
        console.log(\`✅ Trade \${mode} terminé avec succès!\`);
        
    } catch (error) {
        console.error("❌ Erreur execution trade:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
`;

// Remplacer l'ancienne route execute-trade
const oldRoute = /\/\/ Route pour exécuter un trade réel sur blockchain[\s\S]*?app\.post\("\/api\/execute-trade"[\s\S]*?\}\);/;
content = content.replace(oldRoute, newCode);

fs.writeFileSync('server.js', content);
console.log('✅ Route execute-trade remplacée proprement');
