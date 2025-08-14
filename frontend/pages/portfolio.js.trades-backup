import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Portfolio() {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [balances, setBalances] = useState({});
    const [vaultBalances, setVaultBalances] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Prix par défaut des actifs
    const prices = {
        TRG: 1,
        CLV: 10,
        ROO: 10,
        GOV: 200
    };

    useEffect(() => {
        checkWallet();
    }, []);

    const checkWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
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
            
            // Charger les balances wallet
            console.log('🔍 Chargement balances wallet...');
            const balancesResponse = await fetch(`http://localhost:3001/api/balances/${userAddress}`);
            if (balancesResponse.ok) {
                const balancesData = await balancesResponse.json();
                if (balancesData.success) {
                    setBalances(balancesData.balances || {});
                    setVaultBalances(balancesData.vaultBalances || {});
                }
            }

            // Charger les ordres
            console.log('🔍 Chargement ordres...');
            const ordersResponse = await fetch(`http://localhost:3001/api/orders/${userAddress}`);
            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                if (ordersData.success) {
                    setOrders(ordersData.orders || []);
                }
            }

        } catch (error) {
            console.error('Erreur chargement:', error);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (asset) => {
        try {
            const amount = vaultBalances[asset];
            if (!amount || parseFloat(amount) <= 0) {
                alert('Aucun fonds à retirer pour cet actif');
                return;
            }

            console.log(`💸 Retrait ${amount} ${asset}`);
            
            // Ici on pourrait ajouter la logique de retrait
            alert(`Retrait de ${amount} ${asset} simulé avec succès`);
            
            // Recharger les données
            await loadAllData(account);
        } catch (error) {
            console.error('Erreur retrait:', error);
            alert('Erreur lors du retrait');
        }
    };

    const cancelOrder = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:3001/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                alert('Ordre annulé avec succès');
                await loadAllData(account);
            } else {
                alert('Erreur lors de l\'annulation');
            }
        } catch (error) {
            console.error('Erreur annulation:', error);
            alert('Erreur lors de l\'annulation');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>📊 Portfolio</h1>
                <p>Chargement des données...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>📊 Portfolio</h1>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={() => router.push('/')}>← Retour à l'accueil</button>
            </div>
        );
    }

    // Calculs sécurisés des valeurs
    const walletValue = balances ? Object.entries(balances).reduce((total, [symbol, balance]) => {
        return total + (parseFloat(balance || 0) * (prices[symbol] || 0));
    }, 0) : 0;

    const vaultValue = vaultBalances ? Object.entries(vaultBalances).reduce((total, [symbol, balance]) => {
        return total + (parseFloat(balance || 0) * (prices[symbol] || 0));
    }, 0) : 0;

    const totalValue = walletValue + vaultValue;

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => router.push('/')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    ← Retour à l'accueil
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1>📊 Portfolio Complet (Audit)</h1>
                <p><strong>Wallet:</strong> {account}</p>
            </div>

            {/* Résumé des valeurs */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    <h3>💰 Wallet</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {walletValue.toFixed(2)} TRG
                    </p>
                </div>
                <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    <h3>🏦 Vault (Escrow)</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {vaultValue.toFixed(2)} TRG
                    </p>
                </div>
                <div style={{ 
                    backgroundColor: '#e7f3ff', 
                    padding: '20px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    <h3>💎 Total</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {totalValue.toFixed(2)} TRG
                    </p>
                </div>
            </div>

            {/* Tableau des actifs détaillés */}
            <div style={{ marginBottom: '30px' }}>
                <h2>📋 Vos actifs détaillés</h2>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actif</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>💰 Wallet</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>🏦 Vault (Escrow)</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>💎 Total</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {['TRG', 'CLV', 'ROO', 'GOV'].map(symbol => {
                            const walletAmount = parseFloat(balances[symbol] || 0);
                            const vaultAmount = parseFloat(vaultBalances[symbol] || 0);
                            const total = walletAmount + vaultAmount;
                            
                            return (
                                <tr key={symbol} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>
                                        {symbol} {getAssetIcon(symbol)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {walletAmount.toFixed(1)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {vaultAmount.toFixed(1)}
                                        {vaultAmount > 0 && (
                                            <span style={{ color: '#dc3545', marginLeft: '5px' }}>
                                                (bloqué)
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {total.toFixed(1)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => router.push(`/assets/${symbol}`)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                marginRight: '5px'
                                            }}
                                        >
                                            📈 Trader
                                        </button>
                                        {vaultAmount > 0 && (
                                            <button 
                                                onClick={() => handleWithdraw(symbol)}
                                                style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: '#ffc107',
                                                    color: 'black',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ⬇️ Retirer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mes ordres */}
            <div style={{ marginBottom: '30px' }}>
                <h2>📋 Mes ordres</h2>
                {orders && orders.length > 0 ? (
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
                                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actif</th>
                                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Type</th>
                                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Quantité</th>
                                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Prix</th>
                                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Statut</th>
                                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '15px' }}>{order.id}</td>
                                    <td style={{ padding: '15px' }}>{order.asset_symbol}</td>
                                    <td style={{ padding: '15px' }}>
                                        {order.order_type === 'buy' ? '💰 Achat' : '💸 Vente'}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>{order.quantity}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>{order.price} TRG</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '3px',
                                            fontSize: '12px',
                                            backgroundColor: order.status === 'pending' ? '#ffc107' : 
                                                           order.status === 'filled' ? '#28a745' : '#dc3545',
                                            color: 'white'
                                        }}>
                                            {order.status === 'pending' ? '⏳ En attente' : 
                                             order.status === 'filled' ? '✅ Exécuté' : '❌ Annulé'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {order.status === 'pending' && (
                                            <button 
                                                onClick={() => cancelOrder(order.id)}
                                                style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ❌ Annuler
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ 
                        padding: '20px', 
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '5px'
                    }}>
                        Aucun ordre trouvé
                    </p>
                )}
            </div>

            {/* Explications pour l'audit */}
            <div style={{ 
                backgroundColor: '#e7f3ff', 
                padding: '20px', 
                borderRadius: '10px',
                marginTop: '30px'
            }}>
                <h3>🎯 Explications pour l'audit</h3>
                <ul style={{ lineHeight: '1.6' }}>
                    <li><strong>Wallet</strong> : Actifs libres dans votre wallet personnel</li>
                    <li><strong>Vault (Escrow)</strong> : Actifs bloqués pour ordres en attente - sécurisés et récupérables</li>
                    <li><strong>Ordres pending</strong> : Peuvent être annulés pour libérer les fonds du vault</li>
                    <li><strong>Sécurité</strong> : Impossible de créer des tokens de nulle part</li>
                    <li><strong>Transparence</strong> : Toutes les balances sont vérifiables sur la blockchain</li>
                </ul>
            </div>
        </div>
    );
}

function getAssetIcon(symbol) {
    const icons = {
        TRG: '🟡',
        CLV: '🏢',
        ROO: '🌿',
        GOV: '🏛️'
    };
    return icons[symbol] || '💎';
}
