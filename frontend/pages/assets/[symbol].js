import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AssetPage() {
    const router = useRouter();
    const { symbol } = router.query;
    
    const [account, setAccount] = useState('');
    const [asset, setAsset] = useState(null);
    const [balances, setBalances] = useState({});
    const [orders, setOrders] = useState({ buyOrders: [], sellOrders: [] });
    const [priceHistory, setPriceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // États pour les formulaires
    const [orderType, setOrderType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [creating, setCreating] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        if (symbol) {
            checkWallet();
        }
    }, [symbol]);

    const checkWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    await loadAssetData();
                    await loadBalances(accounts[0]);
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
                    setPrice(data.asset.defaultPrice.toString());
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

    const loadOrderBook = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/orderbook/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setOrders({
                        buyOrders: data.orderbook.buy || [],
                        sellOrders: data.orderbook.sell || []
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

    const checkApproval = async () => {
        const tokenNeeded = orderType === 'sell' ? symbol : 'TRG';
        const amountNeeded = orderType === 'sell' ? quantity : (parseFloat(quantity) * parseFloat(price));
        
        try {
            const response = await fetch(`http://localhost:3001/api/check-allowance/${account}/${tokenNeeded}/${amountNeeded}`);
            const data = await response.json();
            
            return data.hasAllowance;
        } catch (error) {
            console.error('Erreur vérification approbation:', error);
            return false;
        }
    };

    const requestApproval = async () => {
        if (!window.ethereum) return;
        
        setApproving(true);
        
        try {
            const tokenNeeded = orderType === 'sell' ? symbol : 'TRG';
            const amountNeeded = orderType === 'sell' ? quantity : (parseFloat(quantity) * parseFloat(price));
            
            // Adresse du vault (à récupérer depuis le backend)
            const vaultAddress = "0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f"; // Temporaire
            
            // Construire la transaction d'approbation
            const amountWei = window.ethereum.utils?.parseUnits(amountNeeded.toString(), 18) || 
                             `0x${(parseFloat(amountNeeded) * Math.pow(10, 18)).toString(16)}`;
            
            const txParams = {
                to: tokenNeeded === 'TRG' ? '0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f' : '0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07',
                from: account,
                data: `0x095ea7b3${vaultAddress.slice(2).padStart(64, '0')}${amountWei.slice(2).padStart(64, '0')}`
            };

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });

            console.log('✅ Approbation envoyée:', txHash);
            alert('Approbation envoyée ! Attendez la confirmation...');
            
            // Attendre quelques secondes puis vérifier
            setTimeout(async () => {
                const hasApproval = await checkApproval();
                if (hasApproval) {
                    setNeedsApproval(false);
                    alert('Approbation confirmée ! Vous pouvez maintenant créer l\'ordre.');
                }
                setApproving(false);
            }, 3000);

        } catch (error) {
            console.error('Erreur approbation:', error);
            alert('Erreur lors de l\'approbation');
            setApproving(false);
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

        setCreating(true);

        try {
            // Vérifier l'approbation d'abord
            const hasApproval = await checkApproval();
            
            if (!hasApproval) {
                setNeedsApproval(true);
                setCreating(false);
                return;
            }

            const response = await fetch('http://localhost:3001/api/create-order-with-approval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                alert(`Ordre ${orderType} créé avec succès!`);
                setQuantity('');
                
                // Recharger les données
                await loadBalances(account);
                await loadOrderBook();
            } else if (data.needsApproval) {
                setNeedsApproval(true);
            } else {
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur création ordre:', error);
            alert('Erreur lors de la création de l\'ordre');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>📈 Chargement...</h1>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>❌ Erreur</h1>
                <p>{error}</p>
                <button onClick={() => router.push('/')}>Retour</button>
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

            {/* Titre */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1>📈 Trading {symbol} avec Approbations</h1>
                {asset && (
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>
                        {asset.name} • Prix par défaut: {asset.defaultPrice} TRG
                    </p>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Graphique des prix (gauche) */}
                <div>
                    <h2>📊 Carnet d'ordres</h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '15px'
                    }}>
                        {/* Ordres d'achat */}
                        <div>
                            <strong>💰 Ordres d'achat</strong>
                            {orders.buyOrders && orders.buyOrders.length > 0 ? (
                                orders.buyOrders.map((order, index) => (
                                    <div key={index} style={{ 
                                        padding: '5px', 
                                        backgroundColor: '#d4edda',
                                        borderRadius: '3px',
                                        margin: '5px 0',
                                        fontSize: '14px'
                                    }}>
                                        {order.quantity} @ {order.price} TRG
                                    </div>
                                ))
                            ) : (
                                <div style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '3px',
                                    margin: '5px 0',
                                    fontSize: '14px',
                                    color: '#6c757d'
                                }}>
                                    Aucun ordre d'achat
                                </div>
                            )}
                        </div>

                        {/* Ordres de vente */}
                        <div>
                            <strong>💸 Ordres de vente</strong>
                            {orders.sellOrders && orders.sellOrders.length > 0 ? (
                                orders.sellOrders.map((order, index) => (
                                    <div key={index} style={{ 
                                        padding: '5px', 
                                        backgroundColor: '#f8d7da',
                                        borderRadius: '3px',
                                        margin: '5px 0',
                                        fontSize: '14px'
                                    }}>
                                        {order.quantity} @ {order.price} TRG
                                    </div>
                                ))
                            ) : (
                                <div style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '3px',
                                    margin: '5px 0',
                                    fontSize: '14px',
                                    color: '#6c757d'
                                }}>
                                    Aucun ordre de vente
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panneau de trading (droite) */}
                <div>
                    <h2>💼 Trading avec Approbations</h2>
                    
                    {/* Mes balances */}
                    <div style={{ 
                        backgroundColor: '#e7f3ff', 
                        padding: '15px', 
                        borderRadius: '10px',
                        marginBottom: '20px'
                    }}>
                        <h3>💰 Mes balances</h3>
                        <p><strong>TRG:</strong> {balances.TRG || 0}</p>
                        <p><strong>{symbol}:</strong> {balances[symbol] || 0}</p>
                    </div>

                    {/* Formulaire de création d'ordre */}
                    <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '20px', 
                        borderRadius: '10px'
                    }}>
                        <h3>📝 Créer un ordre (avec approbation)</h3>
                        
                        {needsApproval && (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                padding: '15px',
                                borderRadius: '5px',
                                marginBottom: '15px'
                            }}>
                                <strong>⚠️ Approbation requise</strong>
                                <p>Vous devez d'abord approuver le transfer de vos tokens.</p>
                                <button 
                                    onClick={requestApproval}
                                    disabled={approving}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#ffc107',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: approving ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {approving ? '⏳ Approbation...' : '🔓 Approuver'}
                                </button>
                            </div>
                        )}
                        
                        <form id="order-form" onSubmit={createOrder}>
                            {/* Type d'ordre */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Type d'ordre:
                                </label>
                                <select 
                                    value={orderType} 
                                    onChange={(e) => setOrderType(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        borderRadius: '5px',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <option value="buy">💰 Achat</option>
                                    <option value="sell">💸 Vente</option>
                                </select>
                            </div>

                            {/* Quantité */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Quantité:
                                </label>
                                <input 
                                    type="number" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min="0.1"
                                    step="0.1"
                                    placeholder="Ex: 5"
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        borderRadius: '5px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>

                            {/* Prix */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Prix (TRG):
                                </label>
                                <input 
                                    type="number" 
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    min="0.1"
                                    step="0.1"
                                    placeholder="Ex: 10"
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        borderRadius: '5px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>

                            {/* Bouton de soumission */}
                            <button 
                                type="submit"
                                disabled={creating || needsApproval}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    backgroundColor: creating || needsApproval ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: creating || needsApproval ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {creating ? '⏳ Création...' : 
                                 needsApproval ? '🔒 Approbation requise' :
                                 `${orderType === 'buy' ? '💰 Acheter' : '💸 Vendre'} ${symbol}`}
                            </button>
                        </form>

                        {/* Résumé de l'ordre */}
                        {quantity && price && !needsApproval && (
                            <div style={{ 
                                marginTop: '15px', 
                                padding: '10px', 
                                backgroundColor: '#e7f3ff',
                                borderRadius: '5px'
                            }}>
                                <strong>📋 Résumé:</strong>
                                <br />
                                {orderType === 'buy' ? 'Acheter' : 'Vendre'} {quantity} {symbol} 
                                à {price} TRG chacun
                                <br />
                                <strong>Total: {(parseFloat(quantity || 0) * parseFloat(price || 0)).toFixed(2)} TRG</strong>
                                <br />
                                <small style={{ color: '#6c757d' }}>
                                    Token requis: {orderType === 'sell' ? symbol : 'TRG'} 
                                    (Quantité: {orderType === 'sell' ? quantity : (parseFloat(quantity || 0) * parseFloat(price || 0)).toFixed(2)})
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
