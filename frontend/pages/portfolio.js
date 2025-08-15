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
        const [withdrawing, setWithdrawing] = useState({});

        // Prix par défaut des actifs
        const prices = {
            TRG: 1,
            CLV: 10,
            ROO: 10,
            GOV: 200
        };

        const assets = ['TRG', 'CLV', 'ROO', 'GOV'];

        useEffect(() => {
            checkWallet();
        }, []);

        // Rafraîchissement automatique
        useEffect(() => {
            const interval = setInterval(() => {
                if (account) {
                    loadAllData(account);
                }
            }, 10000);

            return () => clearInterval(interval);
        }, [account]);

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
                const balanceResponse = await fetch(`http://localhost:3001/api/balances/${userAddress}`);
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    if (balanceData.success) {
                        setBalances(balanceData.balances || {});
                    }
                }

                // Charger les balances vault
                const vaultResponse = await fetch(`http://localhost:3001/api/vault-balances/${userAddress}`);
                if (vaultResponse.ok) {
                    const vaultData = await vaultResponse.json();
                    if (vaultData.success) {
                        setVaultBalances(vaultData.balances || {});
                    }
                }

                // Charger les ordres
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
            return 'Utilisateur';
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

        if (loading) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h1>📊 Chargement du portfolio...</h1>
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
                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                    <button 
                        onClick={() => router.push('/')}
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
                        ← Accueil
                    </button>
                    <button 
                        onClick={() => router.push('/trades')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        📊 Historique Trades
                    </button>
                </div>

                {/* Titre */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1>📊 Portfolio de {getUserName(account)}</h1>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>
                        Compte connecté: {account.slice(0, 8)}...{account.slice(-6)}
                    </p>
                    <div style={{
                        backgroundColor: '#d1ecf1',
                        padding: '15px',
                        borderRadius: '10px',
                        marginTop: '15px'
                    }}>
                        <h2>💰 Valeur totale du portfolio: {getTotalValue()} TRG</h2>
                        <small>Mise à jour automatique toutes les 10s</small>
                    </div>
                </div>

                {/* Portfolio Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    {assets.map(asset => (
                        <div key={asset} style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{ marginBottom: '15px' }}>
                                {asset === 'TRG' && '💰'} 
                                {asset === 'CLV' && '🏢'} 
                                {asset === 'ROO' && '🌿'} 
                                {asset === 'GOV' && '🏛️'} 
                                {asset}
                            </h3>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '15px',
                                    marginBottom: '15px'
                                }}>
                                    {/* Wallet Balance */}
                                    <div style={{
                                        backgroundColor: '#e7f3ff',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <h4 style={{ margin: '0 0 10px 0' }}>💼 Wallet</h4>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                            {balances[asset] || 0}
                                        </div>
                                        <small>Possession directe</small>
                                    </div>

                                    {/* Vault Balance */}
                                    <div style={{
                                        backgroundColor: '#f0f9ff',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <h4 style={{ margin: '0 0 10px 0' }}>🏦 Vault</h4>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                            {vaultBalances[asset] || 0}
                                        </div>
                                        <small>En dépôt</small>
                                    </div>
                                </div>

                                {/* Withdraw Button */}
                                {parseFloat(vaultBalances[asset] || 0) > 0 && (
                                    <div style={{
                                        backgroundColor: '#fff3cd',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <h4>💸 Retirer du Vault</h4>
                                        <button
                                            onClick={() => {
                                                const amount = prompt(`Combien de ${asset} voulez-vous retirer ? (Max: ${vaultBalances[asset]})`);
                                                if (amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(vaultBalances[asset])) {
                                                    handleWithdraw(asset, parseFloat(amount));
                                                }
                                            }}
                                            disabled={withdrawing[asset]}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: withdrawing[asset] ? '#6c757d' : '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: withdrawing[asset] ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {withdrawing[asset] ? '⏳ Retrait...' : `🏦→💼 Retirer ${asset}`}
                                        </button>
                                    </div>
                                )}

                                {/* Total */}
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    textAlign: 'center',
                                    marginTop: '10px'
                                }}>
                                    <strong>Total: {(parseFloat(balances[asset] || 0) + parseFloat(vaultBalances[asset] || 0)).toFixed(2)} {asset}</strong>
                                    <br />
                                    <small>Valeur: {((parseFloat(balances[asset] || 0) + parseFloat(vaultBalances[asset] || 0)) * prices[asset]).toFixed(2)} TRG</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ordres en cours */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h2>📋 Mes Ordres en Cours</h2>
                    {orders.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse',
                                marginTop: '15px'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Quantité</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Prix</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}><strong>{order.asset_symbol}</strong></td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: order.order_type === 'buy' ? '#d4edda' : '#f8d7da',
                                                    color: order.order_type === 'buy' ? '#155724' : '#721c24'
                                                }}>
                                                    {order.order_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{order.quantity}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{order.price} TRG</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: order.status === 'filled' ? '#d1ecf1' : '#fff3cd',
                                                    color: order.status === 'filled' ? '#0c5460' : '#856404'
                                                }}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                            Aucun ordre en cours
                        </p>
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
