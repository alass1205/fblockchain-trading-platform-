
// Route pour exécuter un trade réel sur blockchain
app.post('/api/execute-trade', async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log('🔗 Exécution trade blockchain:', { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        // Connexion à la blockchain
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const [deployer] = await ethers.getSigners();
        
        const contractAddresses = {
            TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
        };
        
        const erc20ABI = [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function transferFrom(address from, address to, uint256 amount) returns (bool)",
            "function balanceOf(address owner) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)"
        ];
        
        // Contrats
        const trgContract = new ethers.Contract(contractAddresses.TRG, erc20ABI, provider);
        const assetContract = new ethers.Contract(contractAddresses[assetSymbol], erc20ABI, provider);
        
        const quantityWei = ethers.utils.parseEther(quantity.toString());
        const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
        
        // Simulation du trade (en tant que deployer/platform)
        console.log('💸 Transfert des actifs...');
        
        // Seller -> Buyer : Asset
        await assetContract.connect(deployer).transfer(buyerAddress, quantityWei);
        console.log(`✅ ${quantity} ${assetSymbol} transférés vers ${buyerAddress}`);
        
        // Buyer -> Seller : TRG
        await trgContract.connect(deployer).transfer(sellerAddress, totalPriceWei);
        console.log(`✅ ${quantity * price} TRG transférés vers ${sellerAddress}`);
        
        // Mettre à jour les ordres en base
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE orders SET status = 'filled' WHERE asset_symbol = ? AND order_type = 'sell' AND user_address = ? AND quantity = ? AND price = ?`,
                [assetSymbol, sellerAddress, quantity, price],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE orders SET status = 'filled' WHERE asset_symbol = ? AND order_type = 'buy' AND user_address = ? AND quantity = ? AND price = ?`,
                [assetSymbol, buyerAddress, quantity, price],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        res.json({
            success: true,
            message: 'Trade exécuté sur la blockchain',
            transactionDetails: {
                asset: `${quantity} ${assetSymbol}`,
                payment: `${quantity * price} TRG`,
                buyer: buyerAddress,
                seller: sellerAddress
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur trade blockchain:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour matcher automatiquement les ordres
app.post('/api/match-orders/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    
    try {
        console.log('🎯 Matching orders pour', symbol);
        
        // Récupérer les ordres pending
        const buyOrders = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM orders WHERE asset_symbol = ? AND order_type = 'buy' AND status = 'pending' ORDER BY price DESC`,
                [symbol],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
        
        const sellOrders = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM orders WHERE asset_symbol = ? AND order_type = 'sell' AND status = 'pending' ORDER BY price ASC`,
                [symbol],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
        
        const matches = [];
        
        // Algorithme de matching simple
        for (const buyOrder of buyOrders) {
            for (const sellOrder of sellOrders) {
                if (buyOrder.price >= sellOrder.price && buyOrder.quantity === sellOrder.quantity) {
                    // Match trouvé !
                    console.log('💥 Match trouvé!', buyOrder.id, 'vs', sellOrder.id);
                    
                    // Exécuter le trade
                    const tradeResult = await fetch('http://localhost:3001/api/execute-trade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            buyerAddress: buyOrder.user_address,
                            sellerAddress: sellOrder.user_address,
                            assetSymbol: symbol,
                            quantity: buyOrder.quantity,
                            price: sellOrder.price
                        })
                    });
                    
                    matches.push({
                        buyOrder: buyOrder.id,
                        sellOrder: sellOrder.id,
                        price: sellOrder.price,
                        quantity: buyOrder.quantity
                    });
                    
                    break; // Sortir de la boucle interne
                }
            }
        }
        
        res.json({
            success: true,
            matches: matches,
            message: `${matches.length} trades exécutés`
        });
        
    } catch (error) {
        console.error('❌ Erreur matching:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
