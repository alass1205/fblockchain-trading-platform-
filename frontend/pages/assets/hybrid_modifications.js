// ========== AJOUTS POUR MODE HYBRIDE ==========

// 1. Ajouter ce useState après les autres
const [tradingMode, setTradingMode] = useState('approval'); // 'approval' ou 'vault'

// 2. Ajouter cette fonction après checkApproval
const handleVaultDeposit = async () => {
    if (!window.ethereum) return;
    
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        const tokenNeeded = orderType === 'sell' ? symbol : 'TRG';
        const amountNeeded = orderType === 'sell' ? quantity : (parseFloat(quantity) * parseFloat(price));
        
        const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES[tokenNeeded], 
            ["function approve(address,uint256) returns(bool)", "function transfer(address,uint256) returns(bool)"], signer);
        const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.VAULT,
            ["function depositToken(address,uint256)"], signer);
        
        const amountWei = ethers.utils.parseEther(amountNeeded.toString());
        
        console.log('🏦 Dépôt vault mode...', {tokenNeeded, amountNeeded});
        
        // Approuver puis déposer
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.VAULT, amountWei);
        await approveTx.wait();
        
        const depositTx = await vaultContract.depositToken(CONTRACT_ADDRESSES[tokenNeeded], amountWei);
        await depositTx.wait();
        
        alert('✅ Dépôt vault réussi ! Créez maintenant votre ordre.');
        
        // Recharger les balances
        await loadBalances(account);
        
    } catch (error) {
        console.error('Erreur dépôt vault:', error);
        alert('Erreur lors du dépôt vault: ' + error.message);
    }
};

// 3. Modifier la fonction createOrder (remplacer complètement)
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
            // Mode approbation (actuel)
            const hasApproval = await checkApproval();
            if (!hasApproval) {
                setNeedsApproval(true);
                setCreating(false);
                alert('⚠️ Approbation requise avant de créer l\'ordre');
                return;
            }
            endpoint = '/api/create-order-with-approval';
        } else {
            // Mode vault - ordre simple
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
