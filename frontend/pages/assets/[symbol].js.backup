import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { useRouter } from 'next/router';

export default function ModernAssetPage() {
    const router = useRouter();
    const { symbol } = router.query;
    
    const [account, setAccount] = useState('');
    const [asset, setAsset] = useState(null);
    const [balances, setBalances] = useState({});
    const [vaultBalances, setVaultBalances] = useState({});
    const [orders, setOrders] = useState({ buyOrders: [], sellOrders: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // États pour les formulaires
    const [orderType, setOrderType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [creating, setCreating] = useState(false);
    const [depositing, setDepositing] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Adresses des contrats
    const CONTRACT_ADDRESSES = {
        TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 
        ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        GOV: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        TradingVault: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    };

    useEffect(() => {
        if (symbol) {
            checkWallet();
        }
    }, [symbol]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (account && symbol) {
                loadOrderBook();
                loadBalances(account);
                loadVaultBalances(account);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [account, symbol]);

    const checkWallet = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    await loadAssetData();
                    await loadBalances(accounts[0]);
                    await loadVaultBalances(accounts[0]);
                    await loadOrderBook();
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error('Erreur wallet:', error);
                setError('Erreur de connexion wallet');
                setLoading(false);
            }
        } else {
            router.push('/');
        }
    };

    const loadAssetData = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/assets/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAsset(data.asset);
                    if (!price) {
                        setPrice(data.asset.currentPrice.toString());
                    }
                }
            }
        } catch (error) {
            console.error('Erreur asset:', error);
        }
    };

    const loadBalances = async (userAddress) => {
        try {
            const response = await fetch(`http://localhost:3001/api/balances/${userAddress}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setBalances(data.balances || {});
                }
            }
        } catch (error) {
            console.error('Erreur balances:', error);
        }
    };

    const loadVaultBalances = async (userAddress) => {
        try {
            const response = await fetch(`http://localhost:3001/api/vault-balances/${userAddress}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setVaultBalances(data.balances || {});
                }
            }
        } catch (error) {
            console.error('Erreur vault balances:', error);
        }
    };

    const loadOrderBook = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/orderbook/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setOrders({
                        buyOrders: data.orderbook.buyOrders || [],
                        sellOrders: data.orderbook.sellOrders || []
                    });
                }
            }
        } catch (error) {
            console.error('Erreur orderbook:', error);
            setOrders({ buyOrders: [], sellOrders: [] });
        } finally {
            setLoading(false);
        }
    };

    const getRequiredFunds = () => {
        if (!quantity || !price) return { token: '', amount: 0, available: 0, sufficient: true };
        
        const tokenNeeded = orderType === 'sell' ? symbol : 'TRG';
        const amountNeeded = orderType === 'sell' ? parseFloat(quantity) : (parseFloat(quantity) * parseFloat(price));
        const available = parseFloat(vaultBalances[tokenNeeded] || 0);
        
        return {
            token: tokenNeeded,
            amount: amountNeeded,
            available: available,
            sufficient: available >= amountNeeded
        };
    };

    const handleVaultDeposit = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            alert('MetaMask requis');
            return;
        }
        
        setDepositing(true);
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const { token, amount } = getRequiredFunds();
            const amountWei = ethers.utils.parseEther(amount.toString());
            
            const walletBalance = parseFloat(balances[token] || 0);
            if (walletBalance < amount) {
                alert(`❌ Solde wallet insuffisant! Vous avez ${walletBalance} ${token}, mais ${amount} requis.`);
                setDepositing(false);
                return;
            }
            
            console.log('🏦 Dépôt vault:', { token, amount });
            
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES[token], 
                ["function approve(address,uint256) returns(bool)"], signer);
            
            console.log('📋 Approbation...');
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.TradingVault, amountWei);
            await approveTx.wait();
            
            const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.TradingVault,
                ["function deposit(address,uint256)"], signer);
            
            console.log('📋 Dépôt...');
            const depositTx = await vaultContract.deposit(CONTRACT_ADDRESSES[token], amountWei);
            await depositTx.wait();
            
            alert(`✅ Dépôt de ${amount} ${token} réussi dans le vault!`);
            
            await loadBalances(account);
            await loadVaultBalances(account);
            
        } catch (error) {
            console.error('Erreur dépôt vault:', error);
            alert('Erreur lors du dépôt: ' + error.message);
        } finally {
            setDepositing(false);
        }
    };

    const createOrder = async (e) => {
        e.preventDefault();
        
        if (!quantity || !price) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        if (parseFloat(quantity) <= 0 || parseFloat(price) <= 0) {
            alert('La quantité et le prix doivent être positifs');
            return;
        }

        const funds = getRequiredFunds();
        if (!funds.sufficient) {
            alert(`❌ Fonds vault insuffisants! Vous avez ${funds.available} ${funds.token}, mais ${funds.amount} requis. Déposez d'abord dans le vault.`);
            return;
        }

        setCreating(true);

        try {
            const response = await fetch('http://localhost:3001/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: account,
                    assetSymbol: symbol,
                    orderType: orderType,
                    quantity: parseFloat(quantity),
                    price: parseFloat(price)
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Ordre ${orderType === 'buy' ? 'achat' : 'vente'} créé avec succès!`);
                setQuantity('');
                
                await loadBalances(account);
                await loadVaultBalances(account);
                await loadOrderBook();
            } else {
                alert(`❌ Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur création ordre:', error);
            alert('Erreur lors de la création de l\'ordre');
        } finally {
            setCreating(false);
        }
    };

    const getAssetIcon = () => {
        switch(symbol) {
            case 'CLV': return '🏢';
            case 'ROO': return '🌿';
            case 'GOV': return '🏛️';
            default: return '💎';
        }
    };

    const getAssetColor = () => {
        switch(symbol) {
            case 'CLV': return '#00d4ff';
            case 'ROO': return '#ff6b6b';
            case 'GOV': return '#ffa502';
            default: return '#00ff88';
        }
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(0, 212, 255, 0.3)',
                        borderTop: '4px solid #00d4ff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>
                        Loading {symbol} Trading Interface...
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Connecting to blockchain
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>❌</h1>
                    <h2 style={{ marginBottom: '15px' }}>Connection Error</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px' }}>{error}</p>
                    <button 
                        onClick={() => router.push('/')}
                        style={{
                            background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            color: '#000',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    const funds = getRequiredFunds();

    return (
        <div style={{
            minHeight: '100vh',
            background: isDarkMode 
                ? 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                zIndex: 0
            }}>
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: Math.random() * 150 + 30 + 'px',
                            height: Math.random() * 150 + 30 + 'px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${getAssetColor()}15 0%, transparent 70%)`,
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animation: `float ${Math.random() * 25 + 15}s infinite linear`,
                            opacity: 0.4
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <header style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '20px 0'
                }}>
                    <div style={{
                        maxWidth: '1400px',
                        margin: '0 auto',
                        padding: '0 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {/* Navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                                onClick={() => router.push('/portfolio')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    padding: '10px 20px',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ← Portfolio
                            </button>
                            <button 
                                onClick={() => router.push('/')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    padding: '10px 20px',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🏠 Home
                            </button>
                        </div>

                        {/* Asset Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '10px 20px',
                            borderRadius: '15px',
                            border: `1px solid ${getAssetColor()}30`
                        }}>
                            <div style={{ fontSize: '24px' }}>{getAssetIcon()}</div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '700' }}>{symbol}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                    {asset?.name}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
                    {/* Trading Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '40px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <h1 style={{
                            fontSize: '36px',
                            margin: '0 0 15px 0',
                            background: `linear-gradient(45deg, ${getAssetColor()}, #00ff88)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '800'
                        }}>
                            {getAssetIcon()} {symbol} Trading Hub
                        </h1>
                        {asset && (
                            <p style={{
                                fontSize: '18px',
                                color: 'rgba(255,255,255,0.8)',
                                margin: '0'
                            }}>
                                {asset.name} • Market Price: {asset.currentPrice} TRG
                            </p>
                        )}
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(0, 255, 136, 0.2)',
                            padding: '8px 16px',
                            borderRadius: '25px',
                            marginTop: '15px',
                            fontSize: '14px',
                            color: '#00ff88'
                        }}>
                            🔄 Live Order Book • Auto-refresh 3s
                        </div>
                    </div>

                    {/* Trading Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '30px',
                        marginBottom: '40px'
                    }}>
                        {/* Order Book */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '30px',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <h2 style={{
                                fontSize: '24px',
                                marginBottom: '25px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📊 Live Order Book
                            </h2>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px'
                            }}>
                                {/* Buy Orders */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '15px',
                                        padding: '10px 15px',
                                        background: 'rgba(0, 255, 136, 0.2)',
                                        borderRadius: '10px'
                                    }}>
                                        <span style={{ fontWeight: '700' }}>💰 Buy Orders</span>
                                        <span style={{
                                            background: '#00ff88',
                                            color: '#000',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            {orders.buyOrders.length}
                                        </span>
                                    </div>

                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {orders.buyOrders && orders.buyOrders.length > 0 ? (
                                            orders.buyOrders.map((order, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '12px',
                                                        background: order.user_address.toLowerCase() === account.toLowerCase() 
                                                            ? 'rgba(0, 255, 136, 0.3)' 
                                                            : 'rgba(0, 255, 136, 0.1)',
                                                        borderRadius: '10px',
                                                        margin: '8px 0',
                                                        border: order.user_address.toLowerCase() === account.toLowerCase() 
                                                            ? '2px solid #00ff88' 
                                                            : '1px solid rgba(0, 255, 136, 0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <div style={{ 
                                                        fontWeight: '700', 
                                                        fontSize: '16px',
                                                        color: '#00ff88',
                                                        marginBottom: '5px'
                                                    }}>
                                                        {order.quantity} @ {order.price} TRG
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span>
                                                            {formatAddress(order.user_address)}
                                                            {order.user_address.toLowerCase() === account.toLowerCase() && 
                                                                <span style={{ color: '#00ff88', fontWeight: '700' }}> (You)</span>
                                                            }
                                                        </span>
                                                        {order.mode && (
                                                            <span style={{
                                                                background: 'rgba(255,255,255,0.2)',
                                                                padding: '2px 6px',
                                                                borderRadius: '6px',
                                                                fontSize: '10px'
                                                            }}>
                                                                {order.mode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: 'rgba(255,255,255,0.5)',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '10px',
                                                border: '1px dashed rgba(255,255,255,0.3)'
                                            }}>
                                                No buy orders yet
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sell Orders */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '15px',
                                        padding: '10px 15px',
                                        background: 'rgba(255, 107, 107, 0.2)',
                                        borderRadius: '10px'
                                    }}>
                                        <span style={{ fontWeight: '700' }}>💸 Sell Orders</span>
                                        <span style={{
                                            background: '#ff6b6b',
                                            color: '#fff',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            {orders.sellOrders.length}
                                        </span>
                                    </div>

                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {orders.sellOrders && orders.sellOrders.length > 0 ? (
                                            orders.sellOrders.map((order, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '12px',
                                                        background: order.user_address.toLowerCase() === account.toLowerCase() 
                                                            ? 'rgba(255, 107, 107, 0.3)' 
                                                            : 'rgba(255, 107, 107, 0.1)',
                                                        borderRadius: '10px',
                                                        margin: '8px 0',
                                                        border: order.user_address.toLowerCase() === account.toLowerCase() 
                                                            ? '2px solid #ff6b6b' 
                                                            : '1px solid rgba(255, 107, 107, 0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <div style={{ 
                                                        fontWeight: '700', 
                                                        fontSize: '16px',
                                                        color: '#ff6b6b',
                                                        marginBottom: '5px'
                                                    }}>
                                                        {order.quantity} @ {order.price} TRG
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span>
                                                            {formatAddress(order.user_address)}
                                                            {order.user_address.toLowerCase() === account.toLowerCase() && 
                                                                <span style={{ color: '#ff6b6b', fontWeight: '700' }}> (You)</span>
                                                            }
                                                        </span>
                                                        {order.mode && (
                                                            <span style={{
                                                                background: 'rgba(255,255,255,0.2)',
                                                                padding: '2px 6px',
                                                                borderRadius: '6px',
                                                                fontSize: '10px'
                                                            }}>
                                                                {order.mode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: 'rgba(255,255,255,0.5)',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '10px',
                                                border: '1px dashed rgba(255,255,255,0.3)'
                                            }}>
                                                No sell orders yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trading Panel */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '30px',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <h2 style={{
                                fontSize: '24px',
                                marginBottom: '25px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                🏦 Vault Trading
                            </h2>

                            {/* Balance Overview */}
                            <div style={{
                                background: `linear-gradient(135deg, ${getAssetColor()}20, rgba(255,255,255,0.1))`,
                                borderRadius: '15px',
                                padding: '20px',
                                marginBottom: '25px',
                                border: `1px solid ${getAssetColor()}30`
                            }}>
                                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>💰 Your Balances</h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '15px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}>
                                            🏦 Wallet
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                            TRG: {balances.TRG || 0}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                            {symbol}: {balances[symbol] || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}>
                                            🏛️ Vault
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: getAssetColor() }}>
                                            TRG: {vaultBalances.TRG || 0}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: getAssetColor() }}>
                                            {symbol}: {vaultBalances[symbol] || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trading Form */}
                            <form onSubmit={createOrder}>
                                {/* Order Type Selector */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        Order Type
                                    </label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => setOrderType('buy')}
                                            style={{
                                                padding: '15px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: orderType === 'buy' 
                                                    ? 'linear-gradient(45deg, #00ff88, #00d4ff)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                color: orderType === 'buy' ? '#000' : '#fff',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            💰 BUY
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOrderType('sell')}
                                            style={{
                                                padding: '15px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: orderType === 'sell' 
                                                    ? 'linear-gradient(45deg, #ff6b6b, #ff4757)' 
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                color: orderType === 'sell' ? '#fff' : '#fff',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            💸 SELL
                                        </button>
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                        placeholder="Enter quantity"
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Price Input */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        Price (TRG)
                                    </label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                        placeholder="Enter price"
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            outline: 'none'
                                        }}
                                    />
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'rgba(255,255,255,0.7)',
                                        marginTop: '5px'
                                    }}>
                                        Suggested: {asset?.currentPrice || 10} TRG
                                    </div>
                                </div>

                                {/* Fund Check */}
                                {quantity && price && (
                                    <div style={{
                                        background: funds.sufficient 
                                            ? 'rgba(0, 255, 136, 0.2)' 
                                            : 'rgba(255, 185, 0, 0.2)',
                                        border: `1px solid ${funds.sufficient ? '#00ff88' : '#ffb900'}`,
                                        borderRadius: '12px',
                                        padding: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '10px'
                                        }}>
                                            <span style={{ fontSize: '20px' }}>
                                                {funds.sufficient ? '✅' : '⚠️'}
                                            </span>
                                            <span style={{ fontWeight: '700' }}>
                                                Fund Verification
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                            Required: <strong>{funds.amount} {funds.token}</strong>
                                        </div>
                                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                            Available in vault: <strong>{funds.available} {funds.token}</strong>
                                        </div>
                                        
                                        {!funds.sufficient && (
                                            <button
                                                type="button"
                                                onClick={handleVaultDeposit}
                                                disabled={depositing}
                                                style={{
                                                    background: 'linear-gradient(45deg, #ffb900, #ff9500)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '10px 15px',
                                                    color: '#000',
                                                    fontWeight: '600',
                                                    cursor: depositing ? 'not-allowed' : 'pointer',
                                                    marginTop: '10px',
                                                    width: '100%'
                                                }}
                                            >
                                                {depositing ? '⏳ Depositing...' : `🏦 Deposit ${(funds.amount - funds.available).toFixed(2)} ${funds.token}`}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={creating || !funds.sufficient}
                                    style={{
                                        width: '100%',
                                        padding: '18px',
                                        borderRadius: '15px',
                                        border: 'none',
                                        background: creating || !funds.sufficient 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : orderType === 'buy'
                                                ? 'linear-gradient(45deg, #00ff88, #00d4ff)'
                                                : 'linear-gradient(45deg, #ff6b6b, #ff4757)',
                                        color: creating || !funds.sufficient ? 'rgba(255,255,255,0.5)' : orderType === 'buy' ? '#000' : '#fff',
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        cursor: creating || !funds.sufficient ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {creating ? '⏳ Creating Order...' :
                                     !funds.sufficient ? '💰 Deposit Required' :
                                     orderType === 'buy' ? `💰 BUY ${symbol}` : `💸 SELL ${symbol}`}
                                </button>

                                {/* Order Summary */}
                                {quantity && price && (
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        marginTop: '15px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                                            Order Summary
                                        </div>
                                        <div style={{ fontSize: '16px', marginBottom: '5px' }}>
                                            {orderType === 'buy' ? 'Buy' : 'Sell'} {quantity} {symbol} at {price} TRG each
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: getAssetColor() }}>
                                            Total: {(parseFloat(quantity || 0) * parseFloat(price || 0)).toFixed(2)} TRG
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx>{`
                @keyframes float {
                    0% { transform: translate3d(0, 0, 0) rotate(0deg); }
                    25% { transform: translate3d(100px, -100px, 0) rotate(90deg); }
                    50% { transform: translate3d(-100px, -200px, 0) rotate(180deg); }
                    75% { transform: translate3d(-150px, -100px, 0) rotate(270deg); }
                    100% { transform: translate3d(0, 0, 0) rotate(360deg); }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Hover Effects */
                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                }

                input:focus {
                    border-color: ${getAssetColor()} !important;
                    box-shadow: 0 0 0 3px ${getAssetColor()}30 !important;
                }

                /* Responsive */
                @media (max-width: 1200px) {
                    .trading-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                }

                @media (max-width: 768px) {
                    .order-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}