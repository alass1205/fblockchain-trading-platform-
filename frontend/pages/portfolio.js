import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWebSocket } from '../hooks/useWebSocket';

export default function ModernPortfolioWebSocket() {
    const router = useRouter();
    const [account, setAccount] = useState('');
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

    // 🔥 WEBSOCKET: Remplace tous les auto-refresh !
    const { 
        socket, 
        isConnected: wsConnected, 
        balances, 
        vaultBalances, 
        orders, 
        trades 
    } = useWebSocket(account);

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

    const checkWallet = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
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
        setLoading(false);
    };

    const handleWithdraw = async (tokenSymbol, amount) => {
        if (!amount || amount <= 0) {
            alert('Montant invalide');
            return;
        }

        setWithdrawing(prev => ({ ...prev, [tokenSymbol]: true }));

        try {
            // 🔥 ÉTAPE 1: Vérifier les ordres affectés
            const checkResponse = await fetch('http://localhost:3001/api/get-affected-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: account,
                    tokenSymbol: tokenSymbol,
                    withdrawAmount: amount
                })
            });

            const checkData = await checkResponse.json();

            if (!checkData.success) {
                alert(`❌ Erreur: ${checkData.error}`);
                return;
            }

            // 🔥 ÉTAPE 2: Demander confirmation si ordres affectés
            if (checkData.affectedOrders.length > 0) {
                const ordersList = checkData.affectedOrders.map(order => 
                    `• ${order.order_type.toUpperCase()} ${order.quantity} ${order.asset_symbol} @ ${order.price} TRG`
                ).join('\n');

                const confirmed = window.confirm(
                    `⚠️ This withdrawal will cancel ${checkData.affectedOrders.length} pending order(s):\n\n${ordersList}\n\nContinue with withdrawal?`
                );

                if (!confirmed) {
                    return;
                }

                // 🔥 ÉTAPE 3: Annuler les ordres affectés
                const cancelResponse = await fetch('http://localhost:3001/api/cancel-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderIds: checkData.affectedOrders.map(order => order.id)
                    })
                });

                const cancelData = await cancelResponse.json();
                console.log('📋 Ordres annulés:', cancelData);
            }

            // 🔥 ÉTAPE 4: Exécuter le retrait
            const response = await fetch('http://localhost:3001/api/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: account,
                    tokenSymbol: tokenSymbol,
                    amount: amount
                })
            });

            const data = await response.json();

            if (data.success) {
                const message = checkData.affectedOrders.length > 0 
                    ? `✅ Withdrawal successful: ${amount} ${tokenSymbol}\n🗑️ ${checkData.affectedOrders.length} orders cancelled`
                    : `✅ Withdrawal successful: ${amount} ${tokenSymbol}`;
                
                alert(message);
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
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1>Loading Portfolio...</h1>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)',
            color: '#ffffff',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '20px'
        }}>
            {/* Header */}
            <header style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                        onClick={() => router.push('/')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            color: '#ffffff',
                            cursor: 'pointer'
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
                            cursor: 'pointer'
                        }}
                    >
                        📊 Trade History
                    </button>
                </div>

                {/* WebSocket Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: wsConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    border: `1px solid ${wsConnected ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                    borderRadius: '10px',
                    fontSize: '12px'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: wsConnected ? '#00ff88' : '#ff6b6b'
                    }}></div>
                    {wsConnected ? 'Live' : 'Offline'}
                </div>
            </header>

            {/* Portfolio Summary */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '30px',
                marginBottom: '30px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '28px',
                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: '700'
                }}>
                    Portfolio of {getUserName(account)} 👋
                </h1>
                
                <div style={{
                    background: wsConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    borderRadius: '10px',
                    padding: '10px',
                    margin: '20px 0',
                    fontSize: '14px'
                }}>
                    {wsConnected ? '🔥 Real-time WebSocket updates' : '❌ WebSocket disconnected'}
                </div>
                
                <div style={{
                    background: 'rgba(0, 255, 136, 0.2)',
                    borderRadius: '15px',
                    padding: '25px',
                    marginTop: '20px'
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
                    <p>Total Portfolio Value</p>
                </div>
            </div>

            {/* Assets Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
            }}>
                {assets.map(asset => {
                    const assetInfo = getAssetInfo(asset);
                    const walletAmount = parseFloat(balances[asset] || 0);
                    const vaultAmount = parseFloat(vaultBalances[asset] || 0);
                    const totalAmount = walletAmount + vaultAmount;

                    return (
                        <div key={asset} style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '25px',
                            border: `1px solid ${assetInfo.color}30`
                        }}>
                            {/* Asset Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ fontSize: '40px' }}>{assetInfo.icon}</div>
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
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>💼</div>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        marginBottom: '5px'
                                    }}>
                                        {walletAmount.toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                        Wallet
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    textAlign: 'center'
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

                            {/* Withdraw Button */}
                            {vaultAmount > 0 && (
                                <button
                                    onClick={() => {
                                        const amount = prompt(`How much ${asset} to withdraw? (Max: ${vaultAmount})`);
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
                                        marginBottom: '15px'
                                    }}
                                >
                                    {withdrawing[asset] ? 'Withdrawing...' : `Withdraw ${asset}`}
                                </button>
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
                                    marginBottom: '15px'
                                }}
                            >
                                📈 Trade {asset}
                            </button>

                            {/* Total Summary */}
                            <div style={{
                                background: assetInfo.bg,
                                borderRadius: '10px',
                                padding: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                    Total: {totalAmount.toFixed(2)} {asset}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                    Value: {(totalAmount * prices[asset]).toFixed(2)} TRG
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
                padding: '30px'
            }}>
                <h2 style={{
                    fontSize: '24px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    📋 Active Orders ({orders.length})
                    {wsConnected && (
                        <span style={{
                            background: 'rgba(0, 255, 136, 0.2)',
                            color: '#00ff88',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            LIVE
                        </span>
                    )}
                </h2>

                {orders.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px'
                        }}>
                            <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Asset</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Quantity</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => {
                                    const assetInfo = getAssetInfo(order.asset_symbol);
                                    return (
                                        <tr key={index} style={{
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
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
                                                    background: 'rgba(255, 185, 0, 0.2)',
                                                    color: '#ffb900'
                                                }}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                        <h3>No Active Orders</h3>
                        <p>Start trading to see your orders here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
