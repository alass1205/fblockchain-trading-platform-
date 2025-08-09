// Route pour exécuter un trade réel sur blockchain
app.post('/api/execute-trade', async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log('🔗 Exécution trade blockchain sécurisée:', { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        // VÉRIFICATION CRITIQUE : S'assurer qu'on a bien un vendeur ET un acheteur
        if (!buyerAddress || !sellerAddress || buyerAddress === sellerAddress) {
            throw new Error('Acheteur et vendeur requis et différents');
        }
        
        // Connexion à la blockchain
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        
        const contractAddresses = {
            TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            VAULT: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
        };
        
        const erc20ABI = [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function transferFrom(address from, address to, uint256 amount) returns (bool)",
            "function balanceOf(address owner) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)"
        ];
        
        const vaultABI = [
            "function operateWithdrawal(address user, address tokenAddress, uint256 amount) external",
            "function getUserTokenBalance(address user, address tokenAddress) external view returns (uint256)"
        ];
        
        // Contrats
        const trgContract = new ethers.Contract(contractAddresses.TRG, erc20ABI, provider);
        const assetContract = new ethers.Contract(contractAddresses[assetSymbol], erc20ABI, provider);
        const vaultContract = new ethers.Contract(contractAddresses.VAULT, vaultABI, provider);
        
        const quantityWei = ethers.utils.parseEther(quantity.toString());
        const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
        
        console.log('🔄 Exécution du swap sécurisé...');
        
        // ÉTAPE 1 : Vérifier que le vendeur a les actifs dans le vault
        const sellerAssetBalance = await vaultContract.getUserTokenBalance(sellerAddress, contractAddresses[assetSymbol]);
        if (sellerAssetBalance.lt(quantityWei)) {
            throw new Error(`Vendeur n'a pas assez de ${assetSymbol} dans le vault`);
        }
        
        // ÉTAPE 2 : Vérifier que l'acheteur a les TRG dans le vault
        const buyerTrgBalance = await vaultContract.getUserTokenBalance(buyerAddress, contractAddresses.TRG);
        if (buyerTrgBalance.lt(totalPriceWei)) {
            throw new Error('Acheteur n\'a pas assez de TRG dans le vault');
        }
        
        // ÉTAPE 3 : Exécuter le swap via le vault (SÉCURISÉ)
        console.log(`💸 Transfert ${quantity} ${assetSymbol} : ${sellerAddress} → ${buyerAddress}`);
        await vaultContract.connect(wallet).operateWithdrawal(buyerAddress, contractAddresses[assetSymbol], quantityWei);
        
        console.log(`💰 Transfert ${quantity * price} TRG : ${buyerAddress} → ${sellerAddress}`);
        await vaultContract.connect(wallet).operateWithdrawal(sellerAddress, contractAddresses.TRG, totalPriceWei);
        
        // ÉTAPE 4 : Mettre à jour les ordres en base
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE orders SET status = 'filled' WHERE asset_symbol = ? AND order_type = 'sell' AND user_address = ? AND quantity = ? AND price = ? AND status = 'pending' LIMIT 1`,
                [assetSymbol, sellerAddress, quantity, price],
                function(err) {
                    if (err) reject(err);
                    else {
                        console.log('✅ Ordre de vente marqué comme rempli');
                        resolve();
                    }
                }
            );
        });
        
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE orders SET status = 'filled' WHERE asset_symbol = ? AND order_type = 'buy' AND user_address = ? AND quantity = ? AND price = ? AND status = 'pending' LIMIT 1`,
                [assetSymbol, buyerAddress, quantity, price],
                function(err) {
                    if (err) reject(err);
                    else {
                        console.log('✅ Ordre d\'achat marqué comme rempli');
                        resolve();
                    }
                }
            );
        });
        
        res.json({
            success: true,
            message: '✅ Trade exécuté de manière sécurisée',
            transactionDetails: {
                asset: `${quantity} ${assetSymbol}`,
                payment: `${quantity * price} TRG`,
                buyer: buyerAddress,
                seller: sellerAddress,
                method: 'Vault-secured swap'
            }
        });
        
        console.log('🎉 Trade sécurisé terminé avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur trade sécurisé:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            note: 'Trade refusé pour des raisons de sécurité'
        });
    }
});
