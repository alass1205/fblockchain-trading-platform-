// Fonction de matching des ordres (version corrigée)
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
                
                const buyOrders = orders.filter(o => o.order_type === 'buy');
                const sellOrders = orders.filter(o => o.order_type === 'sell');
                
                for (const buyOrder of buyOrders) {
                    for (const sellOrder of sellOrders) {
                        // 🚫 ANTI-AUTO-TRADING : Empêcher qu'un utilisateur trade avec lui-même
                        if (buyOrder.user_address === sellOrder.user_address) {
                            console.log('🚫 Auto-trading bloqué pour:', buyOrder.user_address);
                            continue;
                        }
                        
                        if (buyOrder.price >= sellOrder.price && buyOrder.quantity === sellOrder.quantity) {
                            console.log('💥 Match trouvé!', buyOrder.id, 'vs', sellOrder.id);
                            console.log('👤 Acheteur:', buyOrder.user_address);
                            console.log('👤 Vendeur:', sellOrder.user_address);
                            
                            try {
                                const response = await fetch('http://localhost:3001/api/execute-trade', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        buyerAddress: buyOrder.user_address,
                                        sellerAddress: sellOrder.user_address,
                                        assetSymbol: assetSymbol,
                                        quantity: buyOrder.quantity,
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
                
                resolve();
            }
        );
    });
}
