import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ModernPortfolio() {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [balances, setBalances] = useState({});
    const [vaultBalances, setVaultBalances] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawing, setWithdrawing] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Prix par défaut des actifs
    const prices = {
        TRG: 1,
        CLV: 10,
        ROO: 10,
        GOV: 200
    };

    const assets = ['TRG', 'CLV', 'ROO', 'GOV'];

    const getAssetInfo = (asset) => {
        const info = {
            TRG: { icon: '💰', name: 'Triangle Stablecoin', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
            CLV: { icon: '🏢', name: 'Clove Company Shares', color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' },
            ROO: { icon: '🌿', name: 'Rooibos Limited Shares', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' },
            GOV: { icon: '🏛️', name: 'Government Bonds', color: '#ffa502', bg: 'rgba(255, 165, 2, 0.1)' }
        };
        return info[asset] || { icon: '💎', name: asset, color: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)' };
    };

    useEffect(() => {
        checkWallet();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (account) {
                loadAllData(account);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [account]);

    const checkWallet = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    await loadAllData(accounts[0]);
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

    const loadAllData = async (userAddress) => {
        try {
            setLoading(true);
            
            const balanceResponse = await fetch(`http://localhost:3001/api/balances/${userAddress}`);
            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                if (balanceData.success) {
                    setBalances(balanceData.balances || {});
                }
            }

            const vaultResponse = await fetch(`http://localhost:3001/api/vault-balances/${userAddress}`);
            if (vaultResponse.ok) {
                const vaultData = await vaultResponse.json();
                if (vaultData.success) {
                    setVaultBalances(vaultData.balances || {});
                }
            }

            const ordersResponse = await fetch(`http://localhost:3001/api/user-orders/${userAddress}`);
            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                if (ordersData.success) {
                    setOrders(ordersData.orders || []);
                }
            }

        } catch (error) {
            console.error('Erreur chargement données:', error);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (tokenSymbol, amount) => {
        if (!amount || amount <= 0) {
            alert('Montant invalide');
            return;
        }

        setWithdrawing(prev => ({ ...prev, [tokenSymbol]: true }));

        try {
            const response = await fetch('http://localhost:3001/api/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userAddress: account,
                    tokenSymbol: tokenSymbol,
                    amount: amount
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Retrait de ${amount} ${tokenSymbol} réussi!`);
                await loadAllData(account);
            } else {
                alert(`❌ Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur retrait:', error);
            alert('Erreur lors du retrait');
        } finally {
            setWithdrawing(prev => ({ ...prev, [tokenSymbol]: false }));
        }
    };

    const getUserName = (address) => {
        if (address === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'Aya';
        if (address === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Beatriz';
        return 'Trader';
    };

    const getTotalValue = () => {
        let total = 0;
        assets.forEach(asset => {
            const walletAmount = parseFloat(balances[asset] || 0);
            const vaultAmount = parseFloat(vaultBalances[asset] || 0);
            total += (walletAmount + vaultAmount) * prices[asset];
        });
        return total.toFixed(2);
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        Loading Portfolio...
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Fetching your assets and orders
                    </p>
                </div>
            </div>
        );
    }

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
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: Math.random() * 150 + 40 + 'px',
                            height: Math.random() * 150 + 40 + 'px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${i % 4 === 0 ? '#00d4ff' : i % 4 === 1 ? '#00ff88' : i % 4 === 2 ? '#ff6b6b' : '#ffa502'}15 0%, transparent 70%)`,
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
                                    gap: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ← Home
                            </button>
                            <button 
                                onClick={() => router.push('/trades')}
                                style={{
                                    background: 'rgba(0, 212, 255, 0.2)',
                                    border: '1px solid rgba(0, 212, 255, 0.3)',
                                    borderRadius: '12px',
                                    padding: '10px 20px',
                                    color: '#00d4ff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                📊 Trade History
                            </button>
                        </div>

                        {/* Portfolio Title */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ fontSize: '32px' }}>📊</div>
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '24px',
                                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '700'
                                }}>
                                    Portfolio
                                </h1>
                                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                    Asset Management Hub
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
                    {/* Portfolio Summary */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '30px',
                        marginBottom: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{
                            margin: '0 0 15px 0',
                            fontSize: '28px',
                            background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '700'
                        }}>
                            Welcome {getUserName(account)} 👋
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', margin: '0 0 20px 0' }}>
                            Connected: {formatAddress(account)}
                        </p>
                        
                        <div style={{
                            background: 'rgba(0, 255, 136, 0.2)',
                            borderRadius: '15px',
                            padding: '25px',
                            marginTop: '20px',
                            border: '1px solid rgba(0, 255, 136, 0.3)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>💎</div>
                            <h3 style={{
                                fontSize: '36px',
                                fontWeight: '800',
                                margin: '0 0 5px 0',
                                color: '#00ff88'
                            }}>
                                {getTotalValue()} TRG
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                Total Portfolio Value
                            </p>
                            <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                                Auto-refresh every 10s
                            </small>
                        </div>
                    </div>

                    {/* Assets Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '25px',
                        marginBottom: '40px'
                    }}>
                        {assets.map(asset => {
                            const assetInfo = getAssetInfo(asset);
                            const walletAmount = parseFloat(balances[asset] || 0);
                            const vaultAmount = parseFloat(vaultBalances[asset] || 0);
                            const totalAmount = walletAmount + vaultAmount;
                            const totalValue = totalAmount * prices[asset];

                            return (
                                <div key={asset} style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '20px',
                                    padding: '25px',
                                    border: `1px solid ${assetInfo.color}30`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Asset Header */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{
                                            fontSize: '40px',
                                            background: assetInfo.bg,
                                            borderRadius: '15px',
                                            padding: '10px',
                                            border: `1px solid ${assetInfo.color}30`
                                        }}>
                                            {assetInfo.icon}
                                        </div>
                                        <div>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '24px',
                                                color: assetInfo.color,
                                                fontWeight: '700'
                                            }}>
                                                {asset}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                color: 'rgba(255,255,255,0.7)'
                                            }}>
                                                {assetInfo.name}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Balance Display */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        {/* Wallet Balance */}
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '15px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💼</div>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#ffffff',
                                                marginBottom: '5px'
                                            }}>
                                                {walletAmount.toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                                Wallet
                                            </div>
                                        </div>

                                        {/* Vault Balance */}
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '15px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏦</div>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: assetInfo.color,
                                                marginBottom: '5px'
                                            }}>
                                                {vaultAmount.toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                                Vault
                                            </div>
                                        </div>
                                    </div>

                                    {/* Withdraw Section */}
                                    {vaultAmount > 0 && (
                                        <div style={{
                                            background: 'rgba(255, 185, 0, 0.2)',
                                            borderRadius: '12px',
                                            padding: '15px',
                                            marginBottom: '15px',
                                            border: '1px solid rgba(255, 185, 0, 0.3)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '10px'
                                            }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                                    💸 Withdraw from Vault
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const amount = prompt(`How much ${asset} do you want to withdraw? (Max: ${vaultAmount})`);
                                                    if (amount && parseFloat(amount) > 0 && parseFloat(amount) <= vaultAmount) {
                                                        handleWithdraw(asset, parseFloat(amount));
                                                    }
                                                }}
                                                disabled={withdrawing[asset]}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: withdrawing[asset] 
                                                        ? 'rgba(255, 255, 255, 0.2)' 
                                                        : 'linear-gradient(45deg, #ff6b6b, #ff4757)',
                                                    color: '#ffffff',
                                                    fontWeight: '600',
                                                    cursor: withdrawing[asset] ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {withdrawing[asset] ? '⏳ Withdrawing...' : `🏦→💼 Withdraw ${asset}`}
                                            </button>
                                        </div>
                                    )}

                                    {/* Trading Button */}
                                    <button
                                        onClick={() => router.push(`/assets/${asset}`)}
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: `linear-gradient(45deg, ${assetInfo.color}, ${assetInfo.color}cc)`,
                                            color: asset === 'TRG' || asset === 'GOV' ? '#000' : '#fff',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            marginBottom: '15px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        📈 Trade {asset}
                                    </button>

                                    {/* Total Summary */}
                                    <div style={{
                                        background: assetInfo.bg,
                                        borderRadius: '10px',
                                        padding: '12px',
                                        textAlign: 'center',
                                        border: `1px solid ${assetInfo.color}30`
                                    }}>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}>
                                            Total Holdings
                                        </div>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: assetInfo.color,
                                            marginBottom: '5px'
                                        }}>
                                            {totalAmount.toFixed(2)} {asset}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                            Value: {totalValue.toFixed(2)} TRG
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Active Orders */}
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
                            📋 Active Orders
                            <span style={{
                                background: orders.length > 0 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                color: orders.length > 0 ? '#00ff88' : 'rgba(255,255,255,0.7)',
                                padding: '4px 12px',
                                borderRadius: '15px',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                {orders.length}
                            </span>
                        </h2>

                        {orders.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                                            <th style={{ padding: '15px', textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>Asset</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>Type</th>
                                            <th style={{ padding: '15px', textAlign: 'right', color: 'rgba(255,255,255,0.9)' }}>Quantity</th>
                                            <th style={{ padding: '15px', textAlign: 'right', color: 'rgba(255,255,255,0.9)' }}>Price</th>
                                            <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>Status</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, index) => {
                                            const assetInfo = getAssetInfo(order.asset_symbol);
                                            return (
                                                <tr key={index} style={{
                                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ fontSize: '20px' }}>{assetInfo.icon}</span>
                                                            <strong style={{ color: assetInfo.color }}>{order.asset_symbol}</strong>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '15px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            background: order.order_type === 'buy' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                                                            color: order.order_type === 'buy' ? '#00ff88' : '#ff6b6b'
                                                        }}>
                                                            {order.order_type === 'buy' ? '💰 BUY' : '💸 SELL'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                                                        {order.quantity}
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                                                        {order.price} TRG
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '15px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            background: order.status === 'filled' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 185, 0, 0.2)',
                                                            color: order.status === 'filled' ? '#00d4ff' : '#ffb900'
                                                        }}>
                                                            {order.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px', color: 'rgba(255,255,255,0.8)' }}>
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: 'rgba(255,255,255,0.6)'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                                <h3 style={{ margin: '0 0 10px 0', color: 'rgba(255,255,255,0.8)' }}>
                                    No Active Orders
                                </h3>
                                <p style={{ margin: 0 }}>
                                    Start trading to see your orders here
                                </p>
                                <button
                                    onClick={() => router.push('/')}
                                    style={{
                                        marginTop: '20px',
                                        padding: '12px 24px',
                                        background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#000',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Start Trading →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div style={{
                            marginTop: '25px',
                            background: 'rgba(255, 107, 107, 0.2)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '12px',
                            padding: '20px',
                            color: '#ff6b6b'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>❌</span>
                                <strong>{error}</strong>
                            </div>
                        </div>
                    )}
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

                tr:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                /* Asset Card Hover */
                .asset-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0, 212, 255, 0.2);
                }

                /* Responsive */
                @media (max-width: 1200px) {
                    .assets-grid {
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    }
                }

                @media (max-width: 768px) {
                    .assets-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    table {
                        font-size: 14px;
                    }
                    
                    th, td {
                        padding: 10px !important;
                    }
                }

                /* Scrollbar Styling */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb {
                    background: rgba(0, 212, 255, 0.5);
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 212, 255, 0.8);
                }
            `}</style>
        </div>
    );
}