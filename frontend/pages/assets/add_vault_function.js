    // 🏦 Fonction pour dépôt vault (MODE HYBRIDE)
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

