const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configuration multer pour upload fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Base de données SQLite
const db = new sqlite3.Database('./trading.db');

// Initialisation de la base de données
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

    db.run(`CREATE TABLE IF NOT EXISTS assets (
        symbol TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        contract_address TEXT,
        current_price REAL DEFAULT 10.0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_symbol TEXT NOT NULL,
        price REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Base de données initialisée');
});

// Routes API

// Test de l'API
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API backend fonctionne!' });
});

// Inscription utilisateur
app.post('/api/register', upload.single('passport'), (req, res) => {
    const { walletAddress, legalName } = req.body;
    const passportPicture = req.file ? req.file.filename : null;

    console.log('📝 Inscription utilisateur:', { walletAddress, legalName, passportPicture });

    db.run(
        'INSERT OR REPLACE INTO users (wallet_address, legal_name, passport_picture) VALUES (?, ?, ?)',
        [walletAddress, legalName, passportPicture],
        function(err) {
            if (err) {
                console.error('❌ Erreur inscription:', err);
                res.status(500).json({ success: false, error: err.message });
            } else {
                console.log('✅ Utilisateur inscrit:', walletAddress);
                res.json({ success: true, message: 'Utilisateur enregistré avec succès' });
            }
        }
    );
});

// Vérifier si un utilisateur est inscrit
app.get('/api/user/:address', (req, res) => {
    const { address } = req.params;
    
    db.get(
        'SELECT * FROM users WHERE wallet_address = ?',
        [address],
        (err, row) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else if (row) {
                res.json({ success: true, registered: true, user: row });
            } else {
                res.json({ success: true, registered: false });
            }
        }
    );
});

// Récupération des balances blockchain
app.get('/api/balances/:address', async (req, res) => {
    const { address } = req.params;
    
    try {
        console.log('📊 Récupération balances pour:', address);
        
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        
        // Charger les adresses depuis deployed-addresses.json
        const addressesPath = path.join(__dirname, 'deployed-addresses.json');
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        
        console.log('📋 DEBUG - Adresses chargées:', addresses);
        
        const erc20ABI = [
            "function balanceOf(address owner) view returns (uint256)"
        ];
        
        const bondABI = [
            "function getBondsByOwner(address owner) view returns (uint256[])"
        ];
        
        const balances = {};
        
        // TRG Balance
        const trgContract = new ethers.Contract(addresses.TRG, erc20ABI, provider);
        const trgBalance = await trgContract.balanceOf(address);
        balances.TRG = ethers.utils.formatEther(trgBalance);
        
        // CLV Balance
        const clvContract = new ethers.Contract(addresses.CLV, erc20ABI, provider);
        const clvBalance = await clvContract.balanceOf(address);
        balances.CLV = ethers.utils.formatEther(clvBalance);
        
        // ROO Balance
        const rooContract = new ethers.Contract(addresses.ROO, erc20ABI, provider);
        const rooBalance = await rooContract.balanceOf(address);
        balances.ROO = ethers.utils.formatEther(rooBalance);
        
        // GOV Bonds
        try {
            const govContract = new ethers.Contract(addresses.GOV, bondABI, provider);
            const bonds = await govContract.getBondsByOwner(address);
            balances.GOV = bonds.length.toString();
        } catch (error) {
            console.log('⚠️ Erreur GOV bonds:', error.message);
            balances.GOV = '0';
        }

        console.log('✅ Balances récupérées:', balances);
        
        res.json({
            success: true,
            address: address,
            balances: balances
        });

    } catch (error) {
        console.error('❌ Erreur balances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour vérifier les approbations
app.get('/api/check-allowance/:userAddress/:tokenSymbol/:amount', async (req, res) => {
    const { userAddress, tokenSymbol, amount } = req.params;
    
    try {
        console.log('🔍 Vérification allowance:', { userAddress, tokenSymbol, amount });
        
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const addressesPath = path.join(__dirname, 'deployed-addresses.json');
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        
        const tokenABI = [
            "function allowance(address owner, address spender) view returns (uint256)"
        ];
        
        const tokenContract = new ethers.Contract(addresses[tokenSymbol], tokenABI, provider);
        const allowance = await tokenContract.allowance(userAddress, addresses.TradingVault);
        const requiredAmount = ethers.utils.parseUnits(amount.toString(), 18);
        
        const hasEnoughAllowance = allowance.gte(requiredAmount);
        
        res.json({
            success: true,
            hasAllowance: hasEnoughAllowance,
            currentAllowance: ethers.utils.formatUnits(allowance, 18),
            requiredAmount: amount
        });
        
    } catch (error) {
        console.error('❌ Erreur vérification allowance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Création d'ordres avec approbation
app.post('/api/create-order-with-approval', (req, res) => {
    const { userAddress, assetSymbol, orderType, quantity, price } = req.body;
    
    try {
        console.log('📝 Création ordre avec approbation:', { userAddress, assetSymbol, orderType, quantity, price });
        
        db.run(
            'INSERT INTO orders (user_address, asset_symbol, order_type, quantity, price) VALUES (?, ?, ?, ?, ?)',
            [userAddress, assetSymbol, orderType, quantity, price],
            function(err) {
                if (err) {
                    res.status(500).json({ success: false, error: err.message });
                } else {
                    console.log('✅ Ordre créé avec approbation - ID:', this.lastID);
                    
                    setTimeout(() => {
                        matchOrders(assetSymbol);
                    }, 1000);
                    
                    res.json({ 
                        success: true, 
                        orderId: this.lastID,
                        message: 'Ordre créé avec succès' 
                    });
                }
            }
        );
        
    } catch (error) {
        console.error('❌ Erreur création ordre:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Création d'ordres standard
app.post('/api/orders', (req, res) => {
    const { userAddress, assetSymbol, orderType, quantity, price } = req.body;
    
    db.run(
        'INSERT INTO orders (user_address, asset_symbol, order_type, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [userAddress, assetSymbol, orderType, quantity, price],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                console.log('✅ Ordre créé - ID:', this.lastID);
                
                setTimeout(() => {
                    matchOrders(assetSymbol);
                }, 1000);
                
                res.json({ 
                    success: true, 
                    orderId: this.lastID,
                    message: 'Ordre créé avec succès' 
                });
            }
        }
    );
});

// Récupération des ordres par asset
app.get('/api/orders/:symbol', (req, res) => {
    const { symbol } = req.params;
    
    db.all(
        'SELECT * FROM orders WHERE asset_symbol = ? AND status = ? ORDER BY created_at DESC',
        [symbol, 'pending'],
        (err, rows) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true, orders: rows });
            }
        }
    );
});

// Route pour exécuter un trade réel sur blockchain

// Fonction de matching des ordres
// Fonction de matching avancée avec trades partiels
async function matchOrders(assetSymbol) {
    console.log('🎯 Matching orders pour', assetSymbol);
    
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
                
                // Afficher les ordres pour debugging
                console.log('🔵 Ordres d\'achat:', buyOrders.map(o => `${o.quantity}@${o.price} (${o.user_address.slice(0,8)})`));
                console.log('🔴 Ordres de vente:', sellOrders.map(o => `${o.quantity}@${o.price} (${o.user_address.slice(0,8)})`));
                
                for (const sellOrder of sellOrders) {
                    for (const buyOrder of buyOrders) {
                        // Condition de matching : prix compatible et utilisateurs différents
                        if (buyOrder.price >= sellOrder.price && 
                            buyOrder.user_address !== sellOrder.user_address &&
                            buyOrder.quantity > 0 && sellOrder.quantity > 0) {
                            
                            // Déterminer la quantité à échanger (minimum des deux)
                            const tradeQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
                            
                            console.log('💥 Match trouvé!', {
                                buy: `${buyOrder.quantity} @ ${buyOrder.price} TRG`,
                                sell: `${sellOrder.quantity} @ ${sellOrder.price} TRG`,
                                tradeQuantity: tradeQuantity,
                                type: tradeQuantity === buyOrder.quantity && tradeQuantity === sellOrder.quantity ? 'FULL' :
                                      tradeQuantity === buyOrder.quantity ? 'BUY_FILLED' :
                                      tradeQuantity === sellOrder.quantity ? 'SELL_FILLED' : 'PARTIAL'
                            });
                            
                            try {
                                // Exécuter le trade sur la blockchain
                                const response = await fetch('http://localhost:3001/api/execute-trade', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        buyerAddress: buyOrder.user_address,
                                        sellerAddress: sellOrder.user_address,
                                        assetSymbol: assetSymbol,
                                        quantity: tradeQuantity,
                                        price: sellOrder.price // Utiliser le prix du vendeur
                                    })
                                });
                                
                                const result = await response.json();
                                
                                if (result.success) {
                                    console.log('✅ Trade exécuté avec succès!');
                                    
                                    // Mettre à jour les quantités des ordres
                                    const newBuyQuantity = buyOrder.quantity - tradeQuantity;
                                    const newSellQuantity = sellOrder.quantity - tradeQuantity;
                                    
                                    // Mettre à jour l'ordre d'achat
                                    if (newBuyQuantity <= 0) {
                                        // Ordre d'achat complètement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET status = ?, quantity = 0 WHERE id = ?',
                                                ['filled', buyOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔵 Ordre d\'achat complètement rempli');
                                    } else {
                                        // Ordre d'achat partiellement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET quantity = ?, status = ? WHERE id = ?',
                                                [newBuyQuantity, 'partial', buyOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔵 Ordre d\'achat partiellement rempli:', newBuyQuantity, 'restant');
                                    }
                                    
                                    // Mettre à jour l'ordre de vente
                                    if (newSellQuantity <= 0) {
                                        // Ordre de vente complètement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET status = ?, quantity = 0 WHERE id = ?',
                                                ['filled', sellOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔴 Ordre de vente complètement rempli');
                                    } else {
                                        // Ordre de vente partiellement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET quantity = ?, status = ? WHERE id = ?',
                                                [newSellQuantity, 'partial', sellOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔴 Ordre de vente partiellement rempli:', newSellQuantity, 'restant');
                                    }
                                    
                                } else {
                                    console.log('❌ Erreur lors du trade:', result.error);
                                }
                                
                            } catch (error) {
                                console.error('❌ Erreur exécution trade:', error.message);
                            }
                            
                            // Continuer à chercher d'autres matches possibles
                            resolve();
                            return;
                        }
                    }
                }
                
                console.log('⏸️ Aucun match trouvé pour', assetSymbol);
                resolve();
            }
        );
    });
}
// Route pour exécuter un trade réel - VERSION CORRIGÉE


// Route corrigée utilisant vault.executeTrade()
app.post("/api/execute-trade", async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log("🔗 Exécution trade via vault.executeTrade():", { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        
        const addressesPath = path.join(__dirname, "deployed-addresses.json");
        const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
        
        const vaultABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../contracts/artifacts/contracts/TradingVault.sol/TradingVault.json"), "utf8")).abi;
        const vaultContract = new ethers.Contract(addresses.TradingVault, vaultABI, wallet);
        
        const quantityWei = ethers.utils.parseEther(quantity.toString());
        const totalPriceWei = ethers.utils.parseEther((quantity * price).toString());
        
        console.log("📋 Appel vault.executeTrade()...");
        
        const tradeTx = await vaultContract.executeTrade(
            addresses[assetSymbol],
            addresses.TRG,
            sellerAddress,
            buyerAddress,
            quantityWei,
            totalPriceWei
        );
        
        await tradeTx.wait();
        console.log("✅ Trade exécuté via vault.executeTrade()!");
        
        // NOUVEAU : Enregistrer le trade dans l'historique
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO trades (asset_symbol, buyer_address, seller_address, quantity, price, total_amount, tx_hash) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [assetSymbol, buyerAddress, sellerAddress, quantity, price, quantity * price, tradeTx.hash],
                function(err) {
                    if (err) {
                        console.error('❌ Erreur enregistrement trade:', err);
                        reject(err);
                    } else {
                        console.log('📝 Trade enregistré dans l\'historique - ID:', this.lastID);
                        resolve();
                    }
                }
            );
        });
        
        await new Promise((resolve, reject) => {
            db.run("UPDATE orders SET status = ? WHERE asset_symbol = ? AND order_type = ? AND user_address = ? AND status = ?",
                ["filled", assetSymbol, "sell", sellerAddress, "pending"],
                function(err) { if (err) reject(err); else resolve(); }
            );
        });
        
        await new Promise((resolve, reject) => {
            db.run("UPDATE orders SET status = ? WHERE asset_symbol = ? AND order_type = ? AND user_address = ? AND status = ?",
                ["filled", assetSymbol, "buy", buyerAddress, "pending"],
                function(err) { if (err) reject(err); else resolve(); }
            );
        });
        
        res.json({
            success: true,
            message: "Trade exécuté via vault.executeTrade()",
            transactionDetails: {
                asset: `${quantity} ${assetSymbol}`,
                payment: `${quantity * price} TRG`,
                buyer: buyerAddress,
                seller: sellerAddress,
                txHash: tradeTx.hash
            }
        });
        
    } catch (error) {
        console.error("❌ Erreur vault.executeTrade():", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
    console.log(`📋 API disponible sur http://localhost:${PORT}/api/test`);
});

// Route pour récupérer les données d'un asset
app.get('/api/assets/:symbol', (req, res) => {
    const { symbol } = req.params;
    
    // Données statiques des assets
    const assetData = {
        CLV: {
            symbol: 'CLV',
            name: 'Clove Company',
            type: 'share',
            currentPrice: 10,
            description: 'Actions de Clove Company',
            totalSupply: 100
        },
        ROO: {
            symbol: 'ROO', 
            name: 'Rooibos Limited',
            type: 'share',
            currentPrice: 10,
            description: 'Actions de Rooibos Limited',
            totalSupply: 100
        },
        GOV: {
            symbol: 'GOV',
            name: 'Government Bonds',
            type: 'bond',
            currentPrice: 200,
            description: 'Obligations gouvernementales (10% intérêt, 1 an)',
            totalSupply: 20
        }
    };
    
    const asset = assetData[symbol];
    
    if (asset) {
        console.log('📋 Asset data pour', symbol, ':', asset);
        res.json({
            success: true,
            asset: asset
        });
    } else {
        res.status(404).json({
            success: false,
            error: `Asset ${symbol} non trouvé`
        });
    }
});

// Route pour récupérer le carnet d'ordres (orderbook)
app.get('/api/orderbook/:symbol', (req, res) => {
    const { symbol } = req.params;
    
    console.log('📊 Récupération orderbook pour:', symbol);
    
    db.all(
        'SELECT * FROM orders WHERE asset_symbol = ? AND status = ? ORDER BY price DESC, created_at ASC',
        [symbol, 'pending'],
        (err, orders) => {
            if (err) {
                console.error('❌ Erreur orderbook:', err);
                res.status(500).json({ success: false, error: err.message });
            } else {
                // Séparer les ordres d'achat et de vente
                const buyOrders = orders.filter(o => o.order_type === 'buy');
                const sellOrders = orders.filter(o => o.order_type === 'sell');
                
                console.log('📈 Orderbook', symbol, '- Buy:', buyOrders.length, 'Sell:', sellOrders.length);
                
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


// Route pour récupérer l'historique des trades d'un utilisateur
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
                    side: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() ? 'buy' : 'sell',
                    counterparty: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() 
                        ? trade.seller_address 
                        : trade.buyer_address
                }));
                
                res.json({ 
                    success: true, 
                    trades: trades,
                    total: rows.length 
                });
            }
        }
    );
});

// Route pour l'historique global des trades par asset
app.get('/api/trades/asset/:symbol', (req, res) => {
    const { symbol } = req.params;
    
    db.all(
        'SELECT * FROM trades WHERE asset_symbol = ? ORDER BY created_at DESC LIMIT 20',
        [symbol],
        (err, rows) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true, trades: rows });
            }
        }
    );
});

// Route pour vérifier si un utilisateur est inscrit
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
                        legal_name: row.legal_name,
                        created_at: row.created_at
                    }
                });
            } else {
                res.json({ success: true, registered: false });
            }
        }
    );
});
