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
