// Nouvelle fonction de matching qui gère les quantités partielles
async function matchOrders(assetSymbol) {
    console.log('🎯 Matching orders pour', assetSymbol);
    
    return new Promise((resolve) => {
        db.all(
            'SELECT * FROM orders WHERE asset_symbol = ? AND status = ? ORDER BY created_at ASC',
            [assetSymbol, 'pending'],
            async (err, orders) => {
                if (err) {
                    console.error('❌ Erreur matching:', err);
                    resolve();
                    return;
                }
                
                const buyOrders = orders.filter(o => o.order_type === 'buy').sort((a, b) => b.price - a.price);
                const sellOrders = orders.filter(o => o.order_type === 'sell').sort((a, b) => a.price - b.price);
                
                console.log('📊 Ordres à matcher:', { 
                    buy: buyOrders.length, 
                    sell: sellOrders.length 
                });
                
                for (const sellOrder of sellOrders) {
                    for (const buyOrder of buyOrders) {
                        // CONDITION CORRIGÉE: même quantité OU quantité compatible
                        if (buyOrder.price >= sellOrder.price && 
                            (buyOrder.quantity === sellOrder.quantity || buyOrder.quantity >= sellOrder.quantity)) {
                            
                            console.log('💥 Match trouvé!', {
                                buy: `${buyOrder.quantity} @ ${buyOrder.price}`,
                                sell: `${sellOrder.quantity} @ ${sellOrder.price}`,
                                buyer: buyOrder.user_address.slice(0,8) + '...',
                                seller: sellOrder.user_address.slice(0,8) + '...'
                            });
                            
                            try {
                                const response = await fetch('http://localhost:3001/api/execute-trade', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        buyerAddress: buyOrder.user_address,
                                        sellerAddress: sellOrder.user_address,
                                        assetSymbol: assetSymbol,
                                        quantity: sellOrder.quantity, // Utiliser la quantité du vendeur
                                        price: sellOrder.price
                                    })
                                });
                                
                                const result = await response.json();
                                
                                if (result.success) {
                                    console.log('✅ Trade exécuté avec succès!');
                                } else {
                                    console.log('❌ Erreur lors du trade:', result.error);
                                }
                                
                            } catch (error) {
                                console.error('❌ Erreur exécution trade:', error.message);
                            }
                            
                            resolve();
                            return;
                        }
                    }
                }
                
                console.log('⏸️ Aucun match trouvé');
                resolve();
            }
        );
    });
}
