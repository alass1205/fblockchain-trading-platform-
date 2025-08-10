import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import Link from 'next/link';

export default function AssetPage() {
    const router = useRouter();
    const { symbol } = router.query;
    
    const [account, setAccount] = useState('');
    const [asset, setAsset] = useState(null);
    const [userBalance, setUserBalance] = useState('0');
    const [orderForm, setOrderForm] = useState({
        type: 'buy',
        quantity: '',
        price: ''
    });
    const [orders, setOrders] = useState({ buyOrders: [], sellOrders: [] });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (symbol) {
            checkWallet();
            loadAssetData();
            loadOrderBook();
        }
    }, [symbol]);

    async function checkWallet() {
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                await loadUserBalance(accounts[0]);
            }
        }
    }

    async function loadAssetData() {
        try {
            const response = await fetch(`http://localhost:3001/api/assets/${symbol}`);
            const assetData = await response.json();
            setAsset(assetData);
        } catch (error) {
            console.error('Erreur asset:', error);
        }
    }

    async function loadUserBalance(userAddress) {
        try {
            const response = await fetch(`http://localhost:3001/api/balances/${userAddress}`);
            const data = await response.json();
            if (data.success) {
                setUserBalance(data.balances[symbol] || '0');
            }
        } catch (error) {
            console.error('Erreur balance:', error);
        }
    }

    async function loadOrderBook() {
        try {
            const response = await fetch(`http://localhost:3001/api/orderbook/${symbol}`);
            const orderBookData = await response.json();
            setOrders(orderBookData);
        } catch (error) {
            console.error('Erreur orderbook:', error);
        }
    }

    async function createOrderWithBlockchain(e) {
        e.preventDefault();
        
        if (!account) {
            alert('Veuillez connecter MetaMask');
            return;
        }

        if (!window.ethereum.isMetaMask) {
            alert('Veuillez utiliser MetaMask pour cet audit');
            return;
        }

        setIsProcessing(true);

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Adresses des contrats
            const contractAddresses = {
                TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
                ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
                VAULT: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
            };

            const erc20ABI = [
                "function transfer(address to, uint256 amount) returns (bool)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function balanceOf(address owner) view returns (uint256)"
            ];

            const vaultABI = [
                "function depositToken(address tokenAddress, uint256 amount) external"
            ];

            if (orderForm.type === 'sell') {
                // VENTE : Déposer les tokens dans le vault (transaction MetaMask requise)
                console.log('🔗 Vente - Dépôt des tokens dans le vault...');
                
                const assetContract = new ethers.Contract(contractAddresses[symbol], erc20ABI, signer);
                const vaultContract = new ethers.Contract(contractAddresses.VAULT, vaultABI, signer);
                
                const quantityWei = ethers.utils.parseEther(orderForm.quantity);
                
                // 1. Approve vault (transaction MetaMask 1)
                console.log('📝 Demande approbation MetaMask...');
                const approveTx = await assetContract.approve(contractAddresses.VAULT, quantityWei);
                await approveTx.wait();
                console.log('✅ Approbation confirmée');
                
                // 2. Deposit dans vault (transaction MetaMask 2)
                console.log('📦 Dépôt dans vault...');
                const depositTx = await vaultContract.depositToken(contractAddresses[symbol], quantityWei);
                await depositTx.wait();
                console.log('✅ Dépôt confirmé');
                
            } else {
                // ACHAT : Réserver les TRG (transaction MetaMask requise)
                console.log('🔗 Achat - Réservation des TRG...');
                
                const trgContract = new ethers.Contract(contractAddresses.TRG, erc20ABI, signer);
                const totalPrice = parseFloat(orderForm.quantity) * parseFloat(orderForm.price);
                const totalPriceWei = ethers.utils.parseEther(totalPrice.toString());
                
                // Transfer TRG vers vault (transaction MetaMask)
                const transferTx = await trgContract.transfer(contractAddresses.VAULT, totalPriceWei);
                await transferTx.wait();
                console.log('✅ TRG réservés');
            }

            // Créer l'ordre en base après la transaction blockchain
            const response = await fetch('http://localhost:3001/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: account,
                    assetSymbol: symbol,
                    orderType: orderForm.type,
                    quantity: parseFloat(orderForm.quantity),
                    price: parseFloat(orderForm.price)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert(`✅ Ordre ${orderForm.type} créé avec succès!\n\n🔗 Transaction blockchain confirmée\n📊 Ordre ajouté au carnet`);
                setOrderForm({ type: 'buy', quantity: '', price: '' });
                loadOrderBook();
                loadUserBalance(account);
                
                // Auto-matching après création
                setTimeout(() => {
                    fetch(`http://localhost:3001/api/match-orders/${symbol}`, { method: 'POST' })
                        .then(res => res.json())
                        .then(data => {
                            if (data.matches && data.matches.length > 0) {
                                alert(`🎯 ${data.matches.length} trades exécutés automatiquement!`);
                                loadOrderBook();
                                loadUserBalance(account);
                            }
                        });
                }, 1000);
            } else {
                alert('❌ Erreur lors de la création de l\'ordre');
            }

        } catch (error) {
            console.error('❌ Erreur transaction:', error);
            if (error.code === 4001) {
                alert('❌ Transaction refusée par l\'utilisateur');
            } else if (error.code === -32603) {
                alert('❌ Erreur blockchain - Vérifiez vos balances');
            } else {
                alert('❌ Erreur: ' + error.message);
            }
        } finally {
            setIsProcessing(false);
        }
    }

    if (!asset) {
        return <div style={{ padding: '20px' }}>Chargement...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ borderBottom: '1px solid #ccc', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1>📈 {asset.name} ({asset.symbol})</h1>
                <p>Prix actuel: {asset.current_price} TRG</p>
                <p>Votre balance: {userBalance} {symbol}</p>
                <Link href="/" style={{ color: '#007bff', textDecoration: 'none' }}>← Retour à l'accueil</Link>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Graphique */}
                <div>
                    <h3>📊 Historique des prix</h3>
                    <div style={{
                        border: '1px solid #ddd',
                        height: '300px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <p>Prix actuel: {asset.current_price} TRG</p>
                    </div>
                </div>

                {/* Trading Panel */}
                <div>
                    <h3>🔗 Trading Blockchain</h3>
                    
                    <form onSubmit={symbol === "TRG" ? (e) => e.preventDefault() : createOrderWithBlockchain} style={{ 
                        border: '2px solid #007bff', 
                        padding: '20px', 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                        {symbol === "TRG" && (
                            <div style={{
                                backgroundColor: "#fff3cd",
                                padding: "15px",
                                borderRadius: "5px",
                                marginBottom: "15px",
                                border: "1px solid #ffeaa7"
                            }}>
                                <strong>ℹ️ TRG est la monnaie de base</strong><br/>
                                TRG sert à acheter les autres actifs (CLV, ROO, GOV).<br/>
                                Le trading TRG/TRG n'est pas disponible.
                            </div>
                        )}
                            <label>Type d'ordre:</label>
                            <select 
                                value={orderForm.type}
                                onChange={(e) => setOrderForm({...orderForm, type: e.target.value})}
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    marginTop: '5px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="buy">💰 Acheter</option>
                                <option value="sell">💸 Vendre</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Quantité:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={orderForm.quantity}
                                onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    marginTop: '5px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Prix (TRG):</label>
                            <input
                                type="number"
                                step="0.01"
                                value={orderForm.price}
                                onChange={(e) => setOrderForm({...orderForm, price: e.target.value})}
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    marginTop: '5px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isProcessing}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: isProcessing ? '#6c757d' : (orderForm.type === 'buy' ? '#28a745' : '#dc3545'),
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            {isProcessing ? '⏳ Transaction en cours...' : 
                             orderForm.type === 'buy' ? '🔗 Acheter (MetaMask)' : '🔗 Vendre (MetaMask)'}
                        </button>

                        <div style={{ 
                            backgroundColor: '#d1ecf1', 
                            padding: '10px', 
                            borderRadius: '4px',
                            marginTop: '15px',
                            fontSize: '12px'
                        }}>
                            <strong>🔗 Transaction blockchain requise :</strong><br/>
                            {orderForm.type === 'buy' ? 
                                '• MetaMask confirmera le transfert de TRG vers le vault' :
                                '• MetaMask confirmera l\'approbation puis le dépôt dans le vault'
                            }
                        </div>
                    </form>

                    {/* Carnet d'ordres */}
                    <div style={{ marginTop: '20px' }}>
                        <h4>📋 Carnet d'ordres</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <strong>💰 Ordres d'achat</strong>
                                {orders.buyOrders.map((order, index) => (
                                    <div key={index} style={{ 
                                        padding: '5px', 
                                        backgroundColor: '#d4edda',
                                        margin: '2px 0',
                                        fontSize: '12px'
                                    }}>
                                        {order.quantity} @ {order.price} TRG
                                    </div>
                                ))}
                            </div>
                            <div>
                                <strong>💸 Ordres de vente</strong>
                                {orders.sellOrders.map((order, index) => (
                                    <div key={index} style={{ 
                                        padding: '5px', 
                                        backgroundColor: '#f8d7da',
                                        margin: '2px 0',
                                        fontSize: '12px'
                                    }}>
                                        {order.quantity} @ {order.price} TRG
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
