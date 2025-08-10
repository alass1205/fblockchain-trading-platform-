
// Route pour afficher les balances vault (pour audit)
app.get('/api/vault-balances/:address', async (req, res) => {
    const userAddress = req.params.address;
    
    try {
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        
        const contractAddresses = {
            TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            VAULT: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
        };
        
        const vaultABI = ["function getUserTokenBalance(address user, address tokenAddress) external view returns (uint256)"];
        const vaultContract = new ethers.Contract(contractAddresses.VAULT, vaultABI, provider);
        
        const vaultBalances = {};
        
        // TRG dans vault
        const trgVault = await vaultContract.getUserTokenBalance(userAddress, contractAddresses.TRG);
        vaultBalances.TRG = ethers.utils.formatEther(trgVault);
        
        // CLV dans vault
        const clvVault = await vaultContract.getUserTokenBalance(userAddress, contractAddresses.CLV);
        vaultBalances.CLV = ethers.utils.formatEther(clvVault);
        
        // ROO dans vault
        const rooVault = await vaultContract.getUserTokenBalance(userAddress, contractAddresses.ROO);
        vaultBalances.ROO = ethers.utils.formatEther(rooVault);
        
        res.json({
            success: true,
            address: userAddress,
            vaultBalances: vaultBalances
        });
        
    } catch (error) {
        console.error('❌ Erreur vault balances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour annuler un ordre
app.post('/api/cancel-order/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const { userAddress } = req.body;
    
    try {
        console.log('❌ Annulation ordre:', orderId, 'par', userAddress);
        
        // Récupérer l'ordre
        const order = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM orders WHERE id = ? AND user_address = ? AND status = 'pending'`,
                [orderId, userAddress],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Ordre non trouvé ou déjà traité' });
        }
        
        // Libérer les fonds du vault
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        
        const contractAddresses = {
            TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            VAULT: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
        };
        
        const vaultABI = ["function operateWithdrawal(address user, address tokenAddress, uint256 amount) external"];
        const vaultContract = new ethers.Contract(contractAddresses.VAULT, vaultABI, provider);
        
        if (order.order_type === 'buy') {
            // Libérer les TRG
            const totalPriceWei = ethers.utils.parseEther((order.quantity * order.price).toString());
            await vaultContract.connect(wallet).operateWithdrawal(userAddress, contractAddresses.TRG, totalPriceWei);
            console.log('✅ TRG libérées du vault vers', userAddress);
        } else {
            // Libérer l'actif vendu
            const quantityWei = ethers.utils.parseEther(order.quantity.toString());
            await vaultContract.connect(wallet).operateWithdrawal(userAddress, contractAddresses[order.asset_symbol], quantityWei);
            console.log('✅ Actif libéré du vault vers', userAddress);
        }
        
        // Marquer l'ordre comme annulé
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
                [orderId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        res.json({
            success: true,
            message: 'Ordre annulé et fonds libérés',
            refundDetails: {
                orderId: orderId,
                user: userAddress,
                amount: order.order_type === 'buy' ? `${order.quantity * order.price} TRG` : `${order.quantity} ${order.asset_symbol}`
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur annulation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour lister les ordres d'un utilisateur avec possibilité d'annulation
app.get('/api/my-orders/:address', async (req, res) => {
    const userAddress = req.params.address;
    
    try {
        const orders = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM orders WHERE user_address = ? ORDER BY created_at DESC`,
                [userAddress],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
        
        res.json({
            success: true,
            orders: orders
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération ordres:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
