import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { useRouter } from 'next/router';

export default function AssetPage() {
    const router = useRouter();
    const { symbol } = router.query;
    
    const [account, setAccount] = useState('');
    const [asset, setAsset] = useState(null);
    const [balances, setBalances] = useState({});
    const [vaultBalances, setVaultBalances] = useState({});
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
    const [tradingMode, setTradingMode] = useState('approval'); // 'approval' ou 'vault'
    const [approving, setApproving] = useState(false);

    // Adresses des contrats (depuis deployed-addresses.json)
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

    // 🔄 RAFRAÎCHISSEMENT AUTOMATIQUE TOUTES LES 2 SECONDES
    useEffect(() => {
        const interval = setInterval(() => {
            if (account && symbol) {
                loadOrderBook();
                loadBalances(account);
                loadVaultBalances(account);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [account, symbol]);

    const checkWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
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
                    // 🔧 NE PAS ÉCRASER LE PRIX UTILISATEUR
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

    // 🔧 CORRECTION DE LA LECTURE DES ORDRES
    const loadOrderBook = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/orderbook/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('📊 Orderbook data:', data.orderbook); // Debug
                    setOrders({
                        buyOrders: data.orderbook.buyOrders || [],  // ✅ CORRIGÉ
                        sellOrders: data.orderbook.sellOrders || [] // ✅ CORRIGÉ
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

    // 🏦 Fonction pour dépôt vault (MODE HYBRIDE) - CORRIGÉE
    const handleVaultDeposit = async () => {
        if (!window.ethereum) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const tokenNeeded = orderType === 'sell' ? symbol : 'TRG';
            const amountNeeded = orderType === 'sell' ? quantity : (parseFloat(quantity) * parseFloat(price));
            
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES[tokenNeeded], 
                ["function approve(address,uint256) returns(bool)"], signer);
            const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.TradingVault,
                ["function deposit(address,uint256)"], signer);
            
            const amountWei = ethers.utils.parseEther(amountNeeded.toString());
            
            console.log('🏦 Dépôt vault mode...', {tokenNeeded, amountNeeded});
            
            // ÉTAPE 1: Approuver le vault pour le token
            console.log('📋 Approbation du token pour le vault...');
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.TradingVault, amountWei);
            await approveTx.wait();
            console.log('✅ Approbation confirmée');
            
            // ÉTAPE 2: Déposer dans le vault
            console.log('📋 Dépôt dans le vault...');
            const depositTx = await vaultContract.deposit(CONTRACT_ADDRESSES[tokenNeeded], amountWei);
            await depositTx.wait();
            console.log('✅ Dépôt confirmé');
            
            alert('✅ Dépôt vault réussi ! Créez maintenant votre ordre.');
            
            // Recharger les balances
            await loadBalances(account);
            await loadVaultBalances(account);
            
        } catch (error) {
            console.error('Erreur dépôt vault:', error);
            alert('Erreur lors du dépôt vault: ' + error.message);
        }
    };

    // 🔧 FONCTION D'APPROBATION CORRIGÉE
    const requestApproval = async () => {
        if (!window.ethereum) return;
        
        setApproving(true);
        
        try {
            const tokenNeeded = orderType === 'sell' ? symbol : 'TRG';
            const amountNeeded = orderType === 'sell' ? quantity : (parseFloat(quantity) * parseFloat(price));
            
            console.log('🔓 Demande d\'approbation:', { tokenNeeded, amountNeeded });
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES[tokenNeeded], 
                ["function approve(address,uint256) returns(bool)"], signer);
            
            const amountWei = ethers.utils.parseEther(amountNeeded.toString());
            
            console.log('📋 Envoi de l\'approbation...');
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.TradingVault, amountWei);
            await approveTx.wait();
            
            console.log('✅ Approbation confirmée');
            setNeedsApproval(false);
            setApproving(false);
            alert('✅ Approbation confirmée ! Vous pouvez maintenant créer l\'ordre.');

        } catch (error) {
            console.error('Erreur approbation:', error);
            alert('Erreur lors de l\'approbation: ' + error.message);
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
            let endpoint;
            
            if (tradingMode === 'approval') {
                // Mode approbation - vérifier l'approbation d'abord
                const hasApproval = await checkApproval();
                if (!hasApproval) {
                    setNeedsApproval(true);
                    setCreating(false);
                    alert('⚠️ Approbation requise avant de créer l\'ordre');
                    return;
                }
                endpoint = '/api/create-order-with-approval';
            } else {
                // Mode vault - ordre simple (pas besoin de vérification d'approbation)
                endpoint = '/api/orders';
            }

            const response = await fetch(`http://localhost:3001${endpoint}`, {
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
                alert(`✅ Ordre ${orderType} créé avec succès en mode ${tradingMode}!`);
                setQuantity('');
                setNeedsApproval(false);
                
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
                <h1>📈 Trading {symbol} - MODE HYBRIDE ✅</h1>
                {asset && (
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>
                        {asset.name} • Prix suggéré: {asset.currentPrice} TRG
                    </p>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Carnet d'ordres (gauche) */}
                <div>
                    <h2>📊 Carnet d'ordres EN TEMPS RÉEL</h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '15px'
                    }}>
                        {/* Ordres d'achat */}
                        <div>
                            <strong>💰 Ordres d'achat ({orders.buyOrders.length})</strong>
                            {orders.buyOrders && orders.buyOrders.length > 0 ? (
                                orders.buyOrders.map((order, index) => (
                                    <div key={index} style={{ 
                                        padding: '8px', 
                                        backgroundColor: '#d4edda',
                                        borderRadius: '5px',
                                        margin: '5px 0',
                                        fontSize: '14px',
                                        border: order.user_address.toLowerCase() === account.toLowerCase() ? '2px solid #28a745' : 'none'
                                    }}>
                                        <strong>{order.quantity} @ {order.price} TRG</strong>
                                        <br />
                                        <small>{order.user_address.slice(0,8)}... 
                                        {order.user_address.toLowerCase() === account.toLowerCase() && ' (Vous)'}
                                        {order.mode && ` [${order.mode}]`}
                                        </small>
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
                            <strong>💸 Ordres de vente ({orders.sellOrders.length})</strong>
                            {orders.sellOrders && orders.sellOrders.length > 0 ? (
                                orders.sellOrders.map((order, index) => (
                                    <div key={index} style={{ 
                                        padding: '8px', 
                                        backgroundColor: '#f8d7da',
                                        borderRadius: '5px',
                                        margin: '5px 0',
                                        fontSize: '14px',
                                        border: order.user_address.toLowerCase() === account.toLowerCase() ? '2px solid #dc3545' : 'none'
                                    }}>
                                        <strong>{order.quantity} @ {order.price} TRG</strong>
                                        <br />
                                        <small>{order.user_address.slice(0,8)}...
                                        {order.user_address.toLowerCase() === account.toLowerCase() && ' (Vous)'}
                                        {order.mode && ` [${order.mode}]`}
                                        </small>
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
                    <h2>💼 Trading Mode Hybride</h2>
                    
                    {/* Mes balances */}
                    <div style={{ 
                        backgroundColor: '#e7f3ff', 
                        padding: '15px', 
                        borderRadius: '10px',
                        marginBottom: '20px'
                    }}>
                        <h3>💰 Mes balances</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <h4>🏦 Wallet</h4>
                                <p><strong>TRG:</strong> {balances.TRG || 0}</p>
                                <p><strong>{symbol}:</strong> {balances[symbol] || 0}</p>
                            </div>
                            <div>
                                <h4>🏛️ Vault</h4>
                                <p><strong>TRG:</strong> {vaultBalances.TRG || 0}</p>
                                <p><strong>{symbol}:</strong> {vaultBalances[symbol] || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Formulaire de création d'ordre */}
                    <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '20px', 
                        borderRadius: '10px'
                    }}>
                        <h3>📝 Créer un ordre - Mode Hybride ⚙️</h3>
                        
                        {/* NOUVEAU: Switch Mode Trading */}
                        <div style={{ 
                            backgroundColor: '#e7f3ff', 
                            padding: '15px', 
                            borderRadius: '10px',
                            marginBottom: '20px',
                            border: '2px solid #007bff'
                        }}>
                            <h4>⚙️ Mode de Trading</h4>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input 
                                        type="radio" 
                                        value="approval" 
                                        checked={tradingMode === 'approval'}
                                        onChange={(e) => setTradingMode(e.target.value)}
                                    />
                                    <span>🔒 Mode Approbation (Recommandé)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input 
                                        type="radio" 
                                        value="vault" 
                                        checked={tradingMode === 'vault'}
                                        onChange={(e) => setTradingMode(e.target.value)}
                                    />
                                    <span>🏦 Mode Vault (Audit)</span>
                                </label>
                            </div>
                            <small style={{ color: '#6c757d' }}>
                                {tradingMode === 'approval' ? 
                                    '🔒 Transfert direct sécurisé (non-custodial)' : 
                                    '🏦 Dépôt temporaire dans vault (pour démonstration)'
                                }
                            </small>
                        </div>

                        {/* Bouton dépôt vault si mode vault sélectionné */}
                        {tradingMode === 'vault' && quantity && price && (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                padding: '15px',
                                borderRadius: '5px',
                                marginBottom: '15px'
                            }}>
                                <h4>🏦 Dépôt Vault Requis</h4>
                                <p>Token: <strong>{orderType === 'sell' ? symbol : 'TRG'}</strong></p>
                                <p>Montant: <strong>{orderType === 'sell' ? quantity : (parseFloat(quantity || 0) * parseFloat(price || 0)).toFixed(2)}</strong></p>
                                <button 
                                    onClick={handleVaultDeposit}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#ffc107',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🏦 Déposer dans Vault
                                </button>
                            </div>
                        )}
                        
                        {needsApproval && tradingMode === 'approval' && (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                padding: '15px',
                                borderRadius: '5px',
                                marginBottom: '15px'
                            }}>
                                <strong>⚠️ Approbation requise</strong>
                                <p>Token à approuver: <strong>{orderType === 'sell' ? symbol : 'TRG'}</strong></p>
                                <p>Montant: <strong>{orderType === 'sell' ? quantity : (parseFloat(quantity || 0) * parseFloat(price || 0)).toFixed(2)}</strong></p>
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
                                    {approving ? '⏳ Approbation en cours...' : '🔓 Approuver maintenant'}
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
                                    onChange={(e) => {
                                        setOrderType(e.target.value);
                                        setNeedsApproval(false);
                                    }}
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
                                    onChange={(e) => {
                                        setQuantity(e.target.value);
                                        setNeedsApproval(false);
                                    }}
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

                            {/* Prix LIBRE */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Prix (TRG) - 🆓 Prix libre:
                                </label>
                                <input 
                                    type="number" 
                                    value={price}
                                    onChange={(e) => {
                                        setPrice(e.target.value);
                                        setNeedsApproval(false);
                                    }}
                                    min="0.1"
                                    step="0.1"
                                    placeholder="Votre prix"
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        borderRadius: '5px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                                <small style={{ color: '#6c757d' }}>
                                    Prix suggéré: {asset?.currentPrice || 10} TRG
                                </small>
                            </div>

                            {/* Bouton de vérification d'approbation (seulement en mode approbation) */}
                            {quantity && price && !needsApproval && tradingMode === 'approval' && (
                                <button 
                                    type="button"
                                    onClick={async () => {
                                        const hasApproval = await checkApproval();
                                        if (!hasApproval) {
                                            setNeedsApproval(true);
                                        } else {
                                            alert('✅ Approbation déjà accordée !');
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        marginBottom: '10px'
                                    }}
                                >
                                    🔍 Vérifier Approbation
                                </button>
                            )}

                            {/* Bouton de soumission */}
                            <button 
                                type="submit"
                                disabled={creating || (tradingMode === 'approval' && needsApproval)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    backgroundColor: creating || (tradingMode === 'approval' && needsApproval) ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: creating || (tradingMode === 'approval' && needsApproval) ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {creating ? '⏳ Création...' : 
                                 tradingMode === 'approval' && needsApproval ? '🔒 Approbation requise' :
                                 `${orderType === 'buy' ? '💰 Acheter' : '💸 Vendre'} ${symbol} (${tradingMode === 'approval' ? 'Direct' : 'Vault'})`}
                            </button>
                        </form>
                        {/* Résumé de l'ordre */}
                        {quantity && price && (
                            <div style={{ 
                                marginTop: '15px', 
                                padding: '10px', 
                                backgroundColor: needsApproval ? '#fff3cd' : '#e7f3ff',
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
                                    ⚙️ Token à approuver: <strong>{orderType === 'sell' ? symbol : 'TRG'}</strong>
                                    <br />
                                    📊 Quantité requise: <strong>{orderType === 'sell' ? quantity : (parseFloat(quantity || 0) * parseFloat(price || 0)).toFixed(2)}</strong>
                                    <br />
                                    🏦 Vault: {CONTRACT_ADDRESSES.VAULT}
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
