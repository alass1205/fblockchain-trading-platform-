import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ModernTradesPage() {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [filter, setFilter] = useState('all'); // all, buy, sell
    const [sortBy, setSortBy] = useState('date'); // date, amount, asset

    const getAssetInfo = (asset) => {
        const info = {
            TRG: { icon: '💰', name: 'Triangle Stablecoin', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
            CLV: { icon: '🏢', name: 'Clove Company', color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' },
            ROO: { icon: '🌿', name: 'Rooibos Limited', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' },
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
                loadTrades(account);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [account]);

    const checkWallet = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    await loadTrades(accounts[0]);
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

    const loadTrades = async (userAddress) => {
        try {
            const response = await fetch(`http://localhost:3001/api/trades/${userAddress}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTrades(data.trades || []);
                }
            }
        } catch (error) {
            console.error('Erreur chargement trades:', error);
        } finally {
            setLoading(false);
        }
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

    const formatAddress = (address) => {
        return `${address.slice(0, 8)}...${address.slice(-6)}`;
    };

    const getFilteredTrades = () => {
        let filtered = trades;
        
        // Apply filter
        if (filter === 'buy') {
            filtered = filtered.filter(trade => trade.side === 'buy');
        } else if (filter === 'sell') {
            filtered = filtered.filter(trade => trade.side === 'sell');
        }
        
        // Apply sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'amount':
                    return b.total_amount - a.total_amount;
                case 'asset':
                    return a.asset_symbol.localeCompare(b.asset_symbol);
                default:
                    return 0;
            }
        });
        
        return filtered;
    };

    const getTradeStats = () => {
        const buyTrades = trades.filter(t => t.side === 'buy');
        const sellTrades = trades.filter(t => t.side === 'sell');
        const totalVolume = trades.reduce((sum, t) => sum + t.total_amount, 0);
        const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;
        
        return {
            total: trades.length,
            buys: buyTrades.length,
            sells: sellTrades.length,
            totalVolume: totalVolume.toFixed(2),
            avgTradeSize: avgTradeSize.toFixed(2)
        };
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
                        Loading Trade History...
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Fetching your trading activity
                    </p>
                </div>
            </div>
        );
    }

    const stats = getTradeStats();
    const filteredTrades = getFilteredTrades();

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
                            width: Math.random() * 120 + 30 + 'px',
                            height: Math.random() * 120 + 30 + 'px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${i % 4 === 0 ? '#00d4ff' : i % 4 === 1 ? '#00ff88' : i % 4 === 2 ? '#ff6b6b' : '#ffa502'}15 0%, transparent 70%)`,
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animation: `float ${Math.random() * 30 + 20}s infinite linear`,
                            opacity: 0.3
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

                        {/* Trade History Title */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ fontSize: '32px' }}>📈</div>
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '24px',
                                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '700'
                                }}>
                                    Trade History
                                </h1>
                                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                    Your Trading Activity
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
                    {/* Summary Cards */}
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
                            Trading Summary 📊
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', margin: '0 0 25px 0' }}>
                            Account: {formatAddress(account)}
                        </p>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '20px'
                        }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '15px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#00d4ff' }}>
                                    {stats.total}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Total Trades</div>
                            </div>
                            <div style={{
                                background: 'rgba(0, 255, 136, 0.1)',
                                borderRadius: '15px',
                                padding: '20px',
                                textAlign: 'center',
                                border: '1px solid rgba(0, 255, 136, 0.3)'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💰</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#00ff88' }}>
                                    {stats.buys}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Buy Orders</div>
                            </div>
                            <div style={{
                                background: 'rgba(255, 107, 107, 0.1)',
                                borderRadius: '15px',
                                padding: '20px',
                                textAlign: 'center',
                                border: '1px solid rgba(255, 107, 107, 0.3)'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💸</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b6b' }}>
                                    {stats.sells}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Sell Orders</div>
                            </div>
                            <div style={{
                                background: 'rgba(255, 165, 2, 0.1)',
                                borderRadius: '15px',
                                padding: '20px',
                                textAlign: 'center',
                                border: '1px solid rgba(255, 165, 2, 0.3)'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💎</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffa502' }}>
                                    {stats.totalVolume}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Total Volume TRG</div>
                            </div>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '15px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚖️</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                                    {stats.avgTradeSize}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Avg Trade Size TRG</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>
                            🔄 Auto-refresh every 5s
                        </p>
                    </div>

                    {/* Filters and Controls */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '25px',
                        marginBottom: '25px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '15px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontWeight: '600' }}>🔍 Filter:</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['all', 'buy', 'sell'].map(filterType => (
                                    <button
                                        key={filterType}
                                        onClick={() => setFilter(filterType)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: filter === filterType 
                                                ? 'linear-gradient(45deg, #00d4ff, #00ff88)' 
                                                : 'rgba(255, 255, 255, 0.1)',
                                            color: filter === filterType ? '#000' : '#fff',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {filterType === 'all' ? '📊 All' : 
                                         filterType === 'buy' ? '💰 Buys' : '💸 Sells'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontWeight: '600' }}>🔄 Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="date" style={{ background: '#1a1a3e', color: '#fff' }}>📅 Date</option>
                                <option value="amount" style={{ background: '#1a1a3e', color: '#fff' }}>💰 Amount</option>
                                <option value="asset" style={{ background: '#1a1a3e', color: '#fff' }}>📊 Asset</option>
                            </select>
                        </div>
                    </div>

                    {/* Trades Table */}
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
                            💼 Trading History
                            <span style={{
                                background: filteredTrades.length > 0 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                color: filteredTrades.length > 0 ? '#00ff88' : 'rgba(255,255,255,0.7)',
                                padding: '4px 12px',
                                borderRadius: '15px',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                {filteredTrades.length}
                            </span>
                        </h2>

                        {filteredTrades.length > 0 ? (
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
                                            <th style={{ padding: '15px', textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>📅 Date</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>💎 Asset</th>
                                            <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>🔄 Type</th>
                                            <th style={{ padding: '15px', textAlign: 'right', color: 'rgba(255,255,255,0.9)' }}>📊 Quantity</th>
                                            <th style={{ padding: '15px', textAlign: 'right', color: 'rgba(255,255,255,0.9)' }}>💰 Price</th>
                                            <th style={{ padding: '15px', textAlign: 'right', color: 'rgba(255,255,255,0.9)' }}>💎 Total</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>👤 Counterparty</th>
                                            <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>✅ Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTrades.map((trade, index) => {
                                            const assetInfo = getAssetInfo(trade.asset_symbol);
                                            return (
                                                <tr key={index} style={{
                                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <td style={{ padding: '15px', color: 'rgba(255,255,255,0.8)' }}>
                                                        {formatDate(trade.created_at)}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ fontSize: '20px' }}>{assetInfo.icon}</span>
                                                            <div>
                                                                <strong style={{ color: assetInfo.color }}>{trade.asset_symbol}</strong>
                                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                                                    {assetInfo.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            background: trade.side === 'buy' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                                                            color: trade.side === 'buy' ? '#00ff88' : '#ff6b6b',
                                                            border: `1px solid ${trade.side === 'buy' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
                                                        }}>
                                                            {trade.side === 'buy' ? '💰 BUY' : '💸 SELL'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                                                        {trade.quantity}
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                                                        {trade.price} TRG
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                                        <span style={{
                                                            fontSize: '16px',
                                                            fontWeight: '700',
                                                            color: '#00ff88'
                                                        }}>
                                                            {trade.total_amount.toFixed(2)} TRG
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <span style={{
                                                            background: 'rgba(255, 255, 255, 0.1)',
                                                            padding: '4px 8px',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            color: 'rgba(255,255,255,0.8)'
                                                        }}>
                                                            {formatAddress(trade.counterparty)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '15px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            background: 'rgba(0, 212, 255, 0.2)',
                                                            color: '#00d4ff',
                                                            border: '1px solid rgba(0, 212, 255, 0.3)'
                                                        }}>
                                                            ✅ COMPLETED
                                                        </span>
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
                                padding: '60px 20px',
                                color: 'rgba(255,255,255,0.6)'
                            }}>
                                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
                                <h3 style={{ margin: '0 0 15px 0', color: 'rgba(255,255,255,0.8)' }}>
                                    {filter === 'all' ? 'No Trades Yet' : 
                                     filter === 'buy' ? 'No Buy Trades' : 'No Sell Trades'}
                                </h3>
                                <p style={{ margin: '0 0 30px 0' }}>
                                    {filter === 'all' 
                                        ? 'Your trading activity will appear here once you start trading'
                                        : `No ${filter} trades found with current filters`
                                    }
                                </p>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => router.push('/')}
                                        style={{
                                            padding: '12px 24px',
                                            background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#000',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🏠 Go Home
                                    </button>
                                    <button
                                        onClick={() => router.push('/portfolio')}
                                        style={{
                                            padding: '12px 24px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '12px',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📊 View Portfolio
                                    </button>
                                </div>
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

                /* Filter Button Hover */
                button:hover {
                    box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
                }

                /* Select Styling */
                select:focus {
                    outline: none;
                    border-color: #00d4ff;
                    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.2);
                }

                /* Responsive */
                @media (max-width: 1200px) {
                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    }
                }

                @media (max-width: 768px) {
                    .controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .filter-buttons {
                        justify-content: center;
                    }
                    
                    table {
                        font-size: 12px;
                    }
                    
                    th, td {
                        padding: 8px !important;
                    }
                    
                    .asset-info {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                @media (max-width: 480px) {
                    .summary-cards {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                    }
                    
                    .trade-type-badge {
                        padding: 4px 8px !important;
                        font-size: 10px !important;
                    }
                    
                    .status-badge {
                        padding: 4px 8px !important;
                        font-size: 10px !important;
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

                /* Loading Animation */
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .loading-pulse {
                    animation: pulse 2s infinite;
                }

                /* Trade Row Animation */
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                tr {
                    animation: slideIn 0.3s ease-out;
                }

                /* Gradient Text Effect */
                .gradient-text {
                    background: linear-gradient(45deg, #00d4ff, #00ff88);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Card Hover Effect */
                .trade-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(0, 212, 255, 0.2);
                }

                /* Badge Glow Effect */
                .status-badge {
                    box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
                }

                .buy-badge {
                    box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
                }

                .sell-badge {
                    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
                }
            `}</style>
        </div>
    );
}