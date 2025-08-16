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

// ======== WEBSOCKET GESTION CORRIGÉE ========

// Stockage des connexions utilisateurs
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 Client connecté:', socket.id);
    
    // Écouter l'authentification utilisateur
    socket.on('authenticate', (userAddress) => {
        console.log('🔐 Utilisateur authentifié:', userAddress);
        connectedUsers.set(socket.id, userAddress);
        socket.userAddress = userAddress;
        
        // Rejoindre les rooms
        socket.join('global-updates');
        socket.join(`user-${userAddress}`);
        
        // Envoyer les données initiales
        sendInitialData(socket, userAddress);
    });

    // 🔥 NOUVEAU: Écouter les demandes d'orderbook spécifique
    socket.on('request-orderbook', async (symbol) => {
        console.log('📊 Demande orderbook pour:', symbol, 'de', socket.userAddress);
        try {
            const orderbook = await getOrderbook(symbol);
            socket.emit('orderbook-update', {
                symbol: symbol,
                orderbook: orderbook
            });
            console.log('📤 Orderbook envoyé pour:', symbol, '- Buy:', orderbook.buyOrders.length, 'Sell:', orderbook.sellOrders.length);
        } catch (error) {
            console.error('❌ Erreur envoi orderbook:', error);
        }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log('🔌 Client déconnecté:', socket.id);
        connectedUsers.delete(socket.id);
    });
});

// Fonctions pour émettre des mises à jour
function broadcastBalanceUpdate(userAddress, balances, vaultBalances) {
    io.to(`user-${userAddress}`).emit('balances-update', {
        walletBalances: balances,
        vaultBalances: vaultBalances
    });
}

function broadcastOrderbookUpdate(assetSymbol, orderbook) {
    console.log('📡 Broadcast orderbook update pour:', assetSymbol);
    io.to('global-updates').emit('orderbook-update', {
        symbol: assetSymbol,
        orderbook: orderbook
    });
}

function broadcastTradeExecuted(trade) {
    // Notifier tous les utilisateurs
    io.to('global-updates').emit('trade-executed', trade);
    
    // Notifier spécifiquement l'acheteur et le vendeur
    io.to(`user-${trade.buyer_address}`).emit('personal-trade', trade);
    io.to(`user-${trade.seller_address}`).emit('personal-trade', trade);
}

function broadcastOrderUpdate(userAddress, orders) {
    io.to(`user-${userAddress}`).emit('orders-update', orders);
}

// ======== FONCTIONS HELPERS WEBSOCKET ========

// Fonction pour envoyer les données initiales
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

// Fonctions helpers pour récupérer les données
async function getBalances(userAddress) {
    return new Promise(async (resolve, reject) => {
        try {
            const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
            const addressesPath = path.join(__dirname, 'deployed-addresses.json');
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
            reject(error);
        }
    });
}

async function getVaultBalances(userAddress) {
    return new Promise(async (resolve, reject) => {
        try {
            const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
            const addressesPath = path.join(__dirname, 'deployed-addresses.json');
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
            
            // GOV pas dans vault
            vaultBalances.GOV = '0';
            
            resolve(vaultBalances);
        } catch (error) {
            reject(error);
        }
    });
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
                        side: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() ? 'buy' : 'sell',
                        counterparty: trade.buyer_address.toLowerCase() === userAddress.toLowerCase() 
                            ? trade.seller_address 
                            : trade.buyer_address
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
