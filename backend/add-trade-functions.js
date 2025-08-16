// Ajouter les fonctions d'exécution de trade

const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Ajouter les fonctions avant la route execute-trade
const functions = `
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

`;

// Insérer avant la route execute-trade
const insertPoint = content.indexOf('app.post("/api/execute-trade"');
content = content.slice(0, insertPoint) + functions + content.slice(insertPoint);

fs.writeFileSync('server.js', content);
console.log('✅ Fonctions helper ajoutées');
