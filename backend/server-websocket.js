const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('./trading.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        legal_name TEXT NOT NULL,
        passport_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        asset_symbol TEXT NOT NULL,
        order_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_address TEXT NOT NULL,
        seller_address TEXT NOT NULL,
        asset_symbol TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Base de données initialisée');
});

// ======== FONCTIONS BALANCES BLOCKCHAIN ========

async function getBalances(userAddress) {
    return new Promise(async (resolve, reject) => {
        try {
            const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
            const addressesPath = path.join(__dirname, 'deployed-addresses.json');
            
            if (!fs.existsSync(addressesPath)) {
                console.log('⚠️ deployed-addresses.json non trouvé');
                resolve({ TRG: '0', CLV: '0', ROO: '0', GOV: '0' });
                return;
            }
            
            const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
            
            const erc20ABI = ["function balanceOf(address owner) view returns (uint256)"];
            const bondABI = ["function getBondsByOwner(address owner) view returns (uint256[])"];
            
            const balances = {};
            
            // TRG Balance
            const trgContract = new ethers.Contract(addresses.TRG, erc20ABI, provider);
            const trgBalance = await trgContract.balanceOf(userAddress);
            balances.TRG = ethers.utils.formatEther(trgBalance);
            
            // CLV Balance
            const clvContract = new ethers.Contract(addresses.CLV, erc20ABI, provider);
            const clvBalance = await clvContract.balanceOf(userAddress);
            balances.CLV = ethers.utils.formatEther(clvBalance);
            
            // ROO Balance
            const rooContract = new ethers.Contract(addresses.ROO, erc20ABI, provider);
            const rooBalance = await rooContract.balanceOf(userAddress);
            balances.ROO = ethers.utils.formatEther(rooBalance);
            
            // GOV Bonds
            try {
                const govContract = new ethers.Contract(addresses.GOV, bondABI, provider);
                const bonds = await govContract.getBondsByOwner(userAddress);
                balances.GOV = bonds.length.toString();
            } catch (error) {
                balances.GOV = '0';
            }
            
            resolve(balances);
        } catch (error) {
            console.error('❌ Erreur getBalances:', error);
            resolve({ TRG: '0', CLV: '0', ROO: '0', GOV: '0' });
        }
    });
}

async function getVaultBalances(userAddress) {
    return new Promise(async (resolve, reject) => {
        try {
            const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
            const addressesPath = path.join(__dirname, 'deployed-addresses.json');
            
            if (!fs.existsSync(addressesPath)) {
                console.log('⚠️ deployed-addresses.json non trouvé');
                resolve({ TRG: '0', CLV: '0', ROO: '0', GOV: '0' });
                return;
            }
            
            const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
            
            const vaultABI = ["function getBalance(address token, address user) external view returns (uint256)"];
            const vaultContract = new ethers.Contract(addresses.TradingVault, vaultABI, provider);
            
            const vaultBalances = {};
            
            // TRG dans vault
            const trgVault = await vaultContract.getBalance(addresses.TRG, userAddress);
            vaultBalances.TRG = ethers.utils.formatEther(trgVault);
            
            // CLV dans vault
            const clvVault = await vaultContract.getBalance(addresses.CLV, userAddress);
            vaultBalances.CLV = ethers.utils.formatEther(clvVault);
            
            // ROO dans vault
            const rooVault = await vaultContract.getBalance(addresses.ROO, userAddress);
            vaultBalances.ROO = ethers.utils.formatEther(rooVault);
            
            // GOV pas dans vault (bonds)
            vaultBalances.GOV = '0';
            
            resolve(vaultBalances);
        } catch (error) {
            console.error('❌ Erreur getVaultBalances:', error);
            resolve({ TRG: '0', CLV: '0', ROO: '0', GOV: '0' });
        }
    });
}

// ======== WEBSOCKET ========

const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 Client connecté:', socket.id);
    
    socket.on('authenticate', (userAddress) => {
        console.log('🔐 Utilisateur authentifié:', userAddress);
        connectedUsers.set(socket.id, userAddress);
        socket.userAddress = userAddress;
        socket.join('global-updates');
        socket.join(`user-${userAddress}`);
        sendInitialData(socket, userAddress);
    });

    socket.on('request-orderbook', async (symbol) => {
        console.log('📊 Demande orderbook pour:', symbol);
        try {
            const orderbook = await getOrderbook(symbol);
            socket.emit('orderbook-update', {
                symbol: symbol,
                orderbook: orderbook
            });
        } catch (error) {
            console.error('❌ Erreur envoi orderbook:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client déconnecté:', socket.id);
        connectedUsers.delete(socket.id);
    });
});

function broadcastOrderbookUpdate(assetSymbol, orderbook) {
    io.to('global-updates').emit('orderbook-update', {
        symbol: assetSymbol,
        orderbook: orderbook
    });
}

function broadcastTradeExecuted(trade) {
    io.to('global-updates').emit('trade-executed', trade);
    io.to(`user-${trade.buyer_address}`).emit('personal-trade', trade);
    io.to(`user-${trade.seller_address}`).emit('personal-trade', trade);
}

async function sendInitialData(socket, userAddress) {
    try {
        // Envoyer les balances
        const balances = await getBalances(userAddress);
        const vaultBalances = await getVaultBalances(userAddress);
        
        socket.emit('balances-update', {
            walletBalances: balances,
            vaultBalances: vaultBalances
        });
        
        // Envoyer les ordres
        const orders = await getUserOrders(userAddress);
        socket.emit('orders-update', orders);
        
        // Envoyer les trades
        const trades = await getUserTrades(userAddress);
        socket.emit('trades-update', trades);
        
        console.log('📤 Données initiales envoyées pour:', userAddress);
        
    } catch (error) {
        console.error('❌ Erreur envoi données initiales:', error);
    }
}

async function getUserOrders(userAddress) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM orders WHERE user_address = ? ORDER BY created_at DESC',
            [userAddress],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

async function getUserTrades(userAddress) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM trades 
             WHERE buyer_address = ? OR seller_address = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userAddress, userAddress],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const trades = rows.map(trade => ({
                        ...trade,
                        side: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() ? "buy" : "sell",
                        counterparty: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() 
                            ? trade.seller_address || "Unknown"
                            : trade.buyer_address || "Unknown"
                    }));
                    resolve(trades);
                }
            }
        );
    });
}

async function getOrderbook(assetSymbol) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM orders WHERE asset_symbol = ? AND status = ? ORDER BY price DESC, created_at ASC',
            [assetSymbol, 'pending'],
            (err, orders) => {
                if (err) {
                    reject(err);
                } else {
                    const buyOrders = orders.filter(o => o.order_type === 'buy');
                    const sellOrders = orders.filter(o => o.order_type === 'sell');
                    
                    resolve({
                        symbol: assetSymbol,
                        buyOrders: buyOrders,
                        sellOrders: sellOrders,
                        totalOrders: orders.length
                    });
                }
            }
        );
    });
}

// ======== ROUTES API ========

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API backend WebSocket fonctionne!' });
});

// Route pour récupérer les balances wallet
app.get('/api/balances/:address', async (req, res) => {
    const { address } = req.params;
    console.log('💰 Récupération balances pour:', address);
    
    try {
        const balances = await getBalances(address);
        res.json({
            success: true,
            balances: balances
        });
    } catch (error) {
        console.error('❌ Erreur récupération balances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour récupérer les balances vault
app.get('/api/vault-balances/:address', async (req, res) => {
    const { address } = req.params;
    console.log('🏦 Récupération vault balances pour:', address);
    
    try {
        const vaultBalances = await getVaultBalances(address);
        res.json({
            success: true,
            vaultBalances: vaultBalances
        });
    } catch (error) {
        console.error('❌ Erreur récupération vault balances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/register', upload.single('passport'), (req, res) => {
    const { walletAddress, legalName } = req.body;
    const passportPicture = req.file ? req.file.filename : null;

    db.run(
        'INSERT OR REPLACE INTO users (wallet_address, legal_name, passport_picture) VALUES (?, ?, ?)',
        [walletAddress, legalName, passportPicture],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ 
                    success: true, 
                    message: 'Utilisateur inscrit avec succès'
                });
            }
        }
    );
});

app.get('/api/check-registration/:address', (req, res) => {
    const { address } = req.params;
    
    db.get(
        'SELECT * FROM users WHERE wallet_address = ?',
        [address],
        (err, row) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else if (row) {
                res.json({ 
                    success: true, 
                    registered: true, 
                    user: { 
                        wallet_address: row.wallet_address,
                        legal_name: row.legal_name
                    }
                });
            } else {
                res.json({ success: true, registered: false });
            }
        }
    );
});

app.get('/api/assets/:symbol', (req, res) => {
    const { symbol } = req.params;
    
    const assetData = {
        CLV: {
            symbol: 'CLV',
            name: 'Clove Company',
            type: 'share',
            currentPrice: 10
        },
        ROO: {
            symbol: 'ROO', 
            name: 'Rooibos Limited',
            type: 'share',
            currentPrice: 10
        },
        GOV: {
            symbol: 'GOV',
            name: 'Government Bonds',
            type: 'bond',
            currentPrice: 200
        }
    };
    
    const asset = assetData[symbol];
    
    if (asset) {
        res.json({ success: true, asset: asset });
    } else {
        res.status(404).json({ success: false, error: `Asset ${symbol} non trouvé` });
    }
});

app.get('/api/orderbook/:symbol', (req, res) => {
    const { symbol } = req.params;
    
    db.all(
        'SELECT * FROM orders WHERE asset_symbol = ? AND status = ? ORDER BY price DESC, created_at ASC',
        [symbol, 'pending'],
        (err, orders) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                const buyOrders = orders.filter(o => o.order_type === 'buy');
                const sellOrders = orders.filter(o => o.order_type === 'sell');
                
                res.json({
                    success: true,
                    orderbook: {
                        symbol: symbol,
                        buyOrders: buyOrders,
                        sellOrders: sellOrders,
                        totalOrders: orders.length
                    }
                });
            }
        }
    );
});

app.post('/api/orders', (req, res) => {
    const { userAddress, assetSymbol, orderType, quantity, price } = req.body;
    
    if (!userAddress || !assetSymbol || !orderType || !quantity || !price) {
        return res.status(400).json({
            success: false,
            error: 'Tous les champs sont requis'
        });
    }
    
    db.run(
        'INSERT INTO orders (user_address, asset_symbol, order_type, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [userAddress, assetSymbol, orderType, quantity, price],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                const newOrder = {
                    id: this.lastID,
                    user_address: userAddress,
                    asset_symbol: assetSymbol,
                    order_type: orderType,
                    quantity: quantity,
                    price: price,
                    status: 'pending'
                };
                
                res.json({
                    success: true,
                    message: 'Ordre créé avec succès',
                    order: newOrder
                });
                
                // Broadcast de la mise à jour via WebSocket
                getOrderbook(assetSymbol).then(orderbook => {
                    broadcastOrderbookUpdate(assetSymbol, orderbook);
                });
                
                // 🔥 NOUVEAU: Tentative de matching automatique
                tryAutoMatching(assetSymbol);
            }
        }
    );
});

app.get('/api/orders/:userAddress', (req, res) => {
    const { userAddress } = req.params;
    
    db.all(
        'SELECT * FROM orders WHERE user_address = ? ORDER BY created_at DESC',
        [userAddress],
        (err, orders) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true, orders: orders });
            }
        }
    );
});

app.get('/api/trades/:userAddress', (req, res) => {
    const { userAddress } = req.params;
    
    db.all(
        `SELECT * FROM trades 
         WHERE buyer_address = ? OR seller_address = ? 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [userAddress, userAddress],
        (err, rows) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                    const trades = rows.map(trade => ({
                        ...trade,
                        side: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() ? "buy" : "sell",
                        counterparty: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() 
                            ? trade.seller_address || "Unknown"
                            : trade.buyer_address || "Unknown"
                    }));
                
                res.json({ success: true, trades: trades });
            }
        }
    );
});

server.listen(PORT, () => {
    console.log(`
🚀 ====================================
   SERVEUR WEBSOCKET COMPLET DÉMARRÉ
🚀 ====================================

📍 URL: http://localhost:${PORT}
📋 API Test: http://localhost:${PORT}/api/test
🔌 WebSocket: ws://localhost:${PORT}

⚡ WEBSOCKET + BALANCES ACTIVÉS:
   🔄 Mises à jour en temps réel
   📊 Orderbook live
   💰 Balances blockchain
   🏦 Vault balances
   📈 Trades en direct

🎯 PRÊT POUR L'AUDIT COMPLET!
====================================`);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    db.close();
    process.exit(0);
});


// Route de test pour déclencher le matching
app.post("/api/test-matching", async (req, res) => {
    const { assetSymbol } = req.body;
    console.log("🧪 Test matching manuel pour:", assetSymbol);
    
    try {
        await tryAutoMatching(assetSymbol || "CLV");
        res.json({ success: true, message: "Matching testé" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = app;

// ======== FONCTION DE MATCHING AUTOMATIQUE ========

async function tryAutoMatching(assetSymbol) {
    console.log('🎯 Tentative de matching automatique pour', assetSymbol);
    
    return new Promise((resolve) => {
        db.all(
            'SELECT * FROM orders WHERE asset_symbol = ? AND status = ? ORDER BY created_at ASC',
            [assetSymbol, 'pending'],
            async (err, orders) => {
                if (err) {
                    console.error('❌ Erreur matching:', err);
                    resolve();
                    return;
                }
                
                const buyOrders = orders.filter(o => o.order_type === 'buy').sort((a, b) => b.price - a.price);
                const sellOrders = orders.filter(o => o.order_type === 'sell').sort((a, b) => a.price - b.price);
                
                console.log('📊 Ordres à matcher:', { 
                    buy: buyOrders.length, 
                    sell: sellOrders.length 
                });
                
                console.log('🔵 Ordres d\'achat:', buyOrders.map(o => `${o.quantity}@${o.price} (${o.user_address.slice(0,8)})`));
                console.log('🔴 Ordres de vente:', sellOrders.map(o => `${o.quantity}@${o.price} (${o.user_address.slice(0,8)})`));
                
                for (const sellOrder of sellOrders) {
                    for (const buyOrder of buyOrders) {
                        // CONDITION: prix compatible ET utilisateurs différents
                        if (buyOrder.price >= sellOrder.price && 
                            buyOrder.user_address !== sellOrder.user_address &&
                            buyOrder.quantity > 0 && sellOrder.quantity > 0) {
                            
                            // Déterminer la quantité à échanger (minimum des deux)
                            const tradeQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
                            
                            console.log('💥 MATCH TROUVÉ!', {
                                buy: `${buyOrder.quantity} @ ${buyOrder.price} TRG`,
                                sell: `${sellOrder.quantity} @ ${sellOrder.price} TRG`,
                                tradeQuantity: tradeQuantity,
                                buyer: buyOrder.user_address.slice(0,10) + '...',
                                seller: sellOrder.user_address.slice(0,10) + '...'
                            });
                            
                            try {
                                // Exécuter le trade
                                const totalAmount = tradeQuantity * sellOrder.price;
                                
                                // Créer le trade dans la DB
                                db.run(
                                    'INSERT INTO trades (buyer_address, seller_address, asset_symbol, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
                                    [buyOrder.user_address, sellOrder.user_address, assetSymbol, tradeQuantity, sellOrder.price, totalAmount],
                                    function(err) {
                                        if (err) {
                                            console.error('❌ Erreur création trade:', err);
                                        } else {
                                            console.log('✅ Trade exécuté avec succès, ID:', this.lastID);
                                            
                                            const trade = {
                                                id: this.lastID,
                                                buyer_address: buyOrder.user_address,
                                                seller_address: sellOrder.user_address,
                                                asset_symbol: assetSymbol,
                                                quantity: tradeQuantity,
                                                price: sellOrder.price,
                                                total_amount: totalAmount,
                                                created_at: new Date().toISOString()
                                            };
                                            
                                            // Broadcast du trade
                                            broadcastTradeExecuted(trade);
                                            
                                            // Marquer les ordres comme exécutés
                                            db.run('UPDATE orders SET status = ? WHERE id = ?', ['executed', buyOrder.id]);
                                            db.run('UPDATE orders SET status = ? WHERE id = ?', ['executed', sellOrder.id]);
                                            
                                            // Mettre à jour l'orderbook
                // Broadcast de la mise à jour via WebSocket
                getOrderbook(assetSymbol).then(orderbook => {
                    broadcastOrderbookUpdate(assetSymbol, orderbook);
                });
                
                // 🔥 NOUVEAU: Tentative de matching automatique
                tryAutoMatching(assetSymbol);
                                        }
                                    }
                                );
                                
                            } catch (error) {
                                console.error('❌ Erreur exécution trade:', error.message);
                            }
                            
                            resolve();
                            return;
                        }
                    }
                }
                
                console.log('🔍 Aucun match trouvé pour', assetSymbol);
                resolve();
            }
        );
    });
}



// Route pour les retraits du vault (VRAIE INTERACTION BLOCKCHAIN)
app.post('/api/withdraw', async (req, res) => {
    const { userAddress, tokenSymbol, amount } = req.body;
    
    console.log('💸 Demande de retrait RÉEL:', { userAddress, tokenSymbol, amount });
    
    // Validation des données
    if (!userAddress || !tokenSymbol || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Tous les champs sont requis'
        });
    }
    
    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Le montant doit être positif'
        });
    }
    
    try {
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const addressesPath = path.join(__dirname, 'deployed-addresses.json');
        
        if (!fs.existsSync(addressesPath)) {
            return res.status(500).json({
                success: false,
                error: 'Contrats non déployés'
            });
        }
        
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        
        // Clé privée du deployer (owner du vault)
        const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        
        // ABI du vault (fonction operateWithdrawal)
        const vaultABI = [
            "function operateWithdrawal(address user, address token, uint256 amount) external",
            "function getBalance(address token, address user) external view returns (uint256)"
        ];
        
        const vaultContract = new ethers.Contract(addresses.TradingVault, vaultABI, wallet);
        
        // Vérifier que l'utilisateur a assez de fonds dans le vault
        const currentBalance = await vaultContract.getBalance(addresses[tokenSymbol], userAddress);
        const amountWei = ethers.utils.parseEther(amount.toString());
        
        if (currentBalance.lt(amountWei)) {
            return res.status(400).json({
                success: false,
                error: `Solde insuffisant dans le vault. Disponible: ${ethers.utils.formatEther(currentBalance)} ${tokenSymbol}`
            });
        }
        
        console.log('🔗 Exécution operateWithdrawal sur la blockchain...');
        console.log('📍 Vault:', addresses.TradingVault);
        console.log('👤 User:', userAddress);
        console.log('🪙 Token:', addresses[tokenSymbol]);
        console.log('💰 Amount:', ethers.utils.formatEther(amountWei), tokenSymbol);
        
        // Exécuter le retrait sur la blockchain
        const tx = await vaultContract.operateWithdrawal(
            userAddress,
            addresses[tokenSymbol],
            amountWei
        );
        
        console.log('⏳ Transaction envoyée:', tx.hash);
        console.log('⏳ Attente de confirmation...');
        
        // Attendre la confirmation de la transaction
        const receipt = await tx.wait();
        
        console.log('✅ Retrait confirmé sur la blockchain!');
        console.log('📋 Gas utilisé:', receipt.gasUsed.toString());
        
        res.json({
            success: true,
            message: `Retrait de ${amount} ${tokenSymbol} exécuté avec succès`,
            transaction: {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                amount: amount,
                token: tokenSymbol,
                to: userAddress
            }
        });
        
        // Broadcast de la mise à jour des balances via WebSocket (après délai)
        setTimeout(async () => {
            try {
                const balances = await getBalances(userAddress);
                const vaultBalances = await getVaultBalances(userAddress);
                
                io.to(`user-${userAddress}`).emit('balances-update', {
                    walletBalances: balances,
                    vaultBalances: vaultBalances
                });
                
                console.log('📡 Balances mises à jour via WebSocket pour:', userAddress);
            } catch (error) {
                console.error('❌ Erreur mise à jour balances:', error);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur retrait blockchain:', error);
        
        let errorMessage = 'Erreur lors du retrait';
        if (error.message.includes('insufficient funds')) {
            errorMessage = 'Fonds insuffisants dans le vault';
        } else if (error.message.includes('revert')) {
            errorMessage = 'Transaction rejetée par le smart contract';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.message
        });
    }
});
