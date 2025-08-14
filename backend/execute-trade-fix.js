// Route pour exécuter un trade réel - VERSION CORRIGÉE
app.post('/api/execute-trade', async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log('🔗 Exécution trade blockchain avec transferFrom:', { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        
        const addressesPath = path.join(__dirname, 'deployed-addresses.json');
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        
        const erc20ABI = [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function transferFrom(address from, address to, uint256 amount) returns (bool)",
            "function balanceOf(address owner) view returns (uint256)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ];
        
        const assetContract = new ethers.Contract(addresses[assetSymbol], erc20ABI, wallet);
        const trgContract = new ethers.Contract(addresses.TRG, erc20ABI, wallet);
        
        const quantityWei = ethers.utils.parseEther(quantity.toString());
        const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
        
        console.log('📋 Exécution du trade avec transferFrom...');
        
        // ✅ VRAIE SOLUTION : Utiliser transferFrom depuis les wallets des utilisateurs
        
        // 1. Vérifier les allowances avant transfer
        const sellerAssetAllowance = await assetContract.allowance(sellerAddress, addresses.TradingVault);
        const buyerTrgAllowance = await trgContract.allowance(buyerAddress, addresses.TradingVault);
        
        console.log('🔍 Allowances:');
        console.log(`Vendeur ${assetSymbol}:`, ethers.utils.formatEther(sellerAssetAllowance));
        console.log(`Acheteur TRG:`, ethers.utils.formatEther(buyerTrgAllowance));
        
        if (sellerAssetAllowance.lt(quantityWei)) {
            throw new Error(`Vendeur n'a pas assez d'allowance ${assetSymbol}`);
        }
        
        if (buyerTrgAllowance.lt(totalPriceWei)) {
            throw new Error(`Acheteur n'a pas assez d'allowance TRG`);
        }
        
        // 2. TransferFrom depuis le vendeur vers l'acheteur (CLV)
        console.log('🔄 TransferFrom asset du vendeur vers acheteur...');
        const transferAssetTx = await assetContract.transferFrom(sellerAddress, buyerAddress, quantityWei);
        await transferAssetTx.wait();
        console.log('✅ Asset transféré du vendeur vers acheteur');
        
        // 3. TransferFrom depuis l'acheteur vers le vendeur (TRG)
        console.log('🔄 TransferFrom TRG de l\'acheteur vers vendeur...');
        const transferTrgTx = await trgContract.transferFrom(buyerAddress, sellerAddress, totalPriceWei);
        await transferTrgTx.wait();
        console.log('✅ TRG transféré de l\'acheteur vers vendeur');
        
        // Mettre à jour les ordres
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE orders SET status = ? WHERE asset_symbol = ? AND order_type = ? AND user_address = ? AND status = ?',
                ['filled', assetSymbol, 'sell', sellerAddress, 'pending'],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE orders SET status = ? WHERE asset_symbol = ? AND order_type = ? AND user_address = ? AND status = ?',
                ['filled', assetSymbol, 'buy', buyerAddress, 'pending'],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        console.log('✅ Trade RÉEL exécuté avec transferFrom!');
        
        res.json({
            success: true,
            message: 'Trade exécuté avec transferFrom',
            transactionDetails: {
                asset: `${quantity} ${assetSymbol}`,
                payment: `${quantity * price} TRG`,
                buyer: buyerAddress,
                seller: sellerAddress,
                assetTxHash: transferAssetTx.hash,
                paymentTxHash: transferTrgTx.hash
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur trade transferFrom:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
