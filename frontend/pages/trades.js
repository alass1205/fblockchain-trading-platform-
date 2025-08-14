import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TradesPage() {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        if (typeof window.ethereum !== 'undefined') {
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
        return new Date(dateString).toLocaleString('fr-FR');
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 8)}...${address.slice(-6)}`;
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>📈 Chargement de l'historique...</h1>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => router.push('/portfolio')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    ← Portfolio
                </button>
                <button 
                    onClick={() => router.push('/')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    🏠 Accueil
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1>📊 Historique de mes Trades</h1>
                <p style={{ fontSize: '18px', color: '#6b7280' }}>
                    Compte connecté: {formatAddress(account)}
                </p>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>
                    {trades.length} trade(s) total • Mise à jour automatique toutes les 5s
                </p>
            </div>

            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '10px'
            }}>
                <h2>💼 Mes Transactions</h2>
                
                {trades.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            backgroundColor: 'white',
                            borderRadius: '5px',
                            overflow: 'hidden'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e9ecef' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Quantité</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Prix</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Contrepartie</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((trade, index) => (
                                    <tr key={index} style={{ 
                                        borderBottom: '1px solid #dee2e6',
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                                    }}>
                                        <td style={{ padding: '12px' }}>
                                            {formatDate(trade.created_at)}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <strong>{trade.asset_symbol}</strong>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: trade.side === 'buy' ? '#d4edda' : '#f8d7da',
                                                color: trade.side === 'buy' ? '#155724' : '#721c24'
                                            }}>
                                                {trade.side === 'buy' ? '💰 ACHAT' : '💸 VENTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <strong>{trade.quantity}</strong>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {trade.price} TRG
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <strong>{trade.total_amount.toFixed(2)} TRG</strong>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {formatAddress(trade.counterparty)}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#d1ecf1',
                                                color: '#0c5460'
                                            }}>
                                                ✅ {trade.status === "filled" ? "COMPLÉTÉ" : trade.status === "partial" ? "PARTIEL" : trade.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        color: '#6c757d'
                    }}>
                        <h3>📭 Aucun trade pour le moment</h3>
                        <p>Vos transactions apparaîtront ici une fois que vous aurez effectué des trades.</p>
                        <button 
                            onClick={() => router.push('/portfolio')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginTop: '20px'
                            }}
                        >
                            📈 Commencer à trader
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ 
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '5px'
                }}>
                    ❌ {error}
                </div>
            )}
        </div>
    );
}
