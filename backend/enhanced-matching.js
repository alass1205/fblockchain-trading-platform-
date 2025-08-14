// Fonction de matching avancée avec trades partiels
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
                
                // Afficher les ordres pour debugging
                console.log('🔵 Ordres d\'achat:', buyOrders.map(o => `${o.quantity}@${o.price} (${o.user_address.slice(0,8)})`));
                console.log('🔴 Ordres de vente:', sellOrders.map(o => `${o.quantity}@${o.price} (${o.user_address.slice(0,8)})`));
                
                for (const sellOrder of sellOrders) {
                    for (const buyOrder of buyOrders) {
                        // Condition de matching : prix compatible et utilisateurs différents
                        if (buyOrder.price >= sellOrder.price && 
                            buyOrder.user_address !== sellOrder.user_address &&
                            buyOrder.quantity > 0 && sellOrder.quantity > 0) {
                            
                            // Déterminer la quantité à échanger (minimum des deux)
                            const tradeQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
                            
                            console.log('💥 Match trouvé!', {
                                buy: `${buyOrder.quantity} @ ${buyOrder.price} TRG`,
                                sell: `${sellOrder.quantity} @ ${sellOrder.price} TRG`,
                                tradeQuantity: tradeQuantity,
                                type: tradeQuantity === buyOrder.quantity && tradeQuantity === sellOrder.quantity ? 'FULL' :
                                      tradeQuantity === buyOrder.quantity ? 'BUY_FILLED' :
                                      tradeQuantity === sellOrder.quantity ? 'SELL_FILLED' : 'PARTIAL'
                            });
                            
                            try {
                                // Exécuter le trade sur la blockchain
                                const response = await fetch('http://localhost:3001/api/execute-trade', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        buyerAddress: buyOrder.user_address,
                                        sellerAddress: sellOrder.user_address,
                                        assetSymbol: assetSymbol,
                                        quantity: tradeQuantity,
                                        price: sellOrder.price // Utiliser le prix du vendeur
                                    })
                                });
                                
                                const result = await response.json();
                                
                                if (result.success) {
                                    console.log('✅ Trade exécuté avec succès!');
                                    
                                    // Mettre à jour les quantités des ordres
                                    const newBuyQuantity = buyOrder.quantity - tradeQuantity;
                                    const newSellQuantity = sellOrder.quantity - tradeQuantity;
                                    
                                    // Mettre à jour l'ordre d'achat
                                    if (newBuyQuantity <= 0) {
                                        // Ordre d'achat complètement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET status = ?, quantity = 0 WHERE id = ?',
                                                ['filled', buyOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔵 Ordre d\'achat complètement rempli');
                                    } else {
                                        // Ordre d'achat partiellement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET quantity = ?, status = ? WHERE id = ?',
                                                [newBuyQuantity, 'partial', buyOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔵 Ordre d\'achat partiellement rempli:', newBuyQuantity, 'restant');
                                    }
                                    
                                    // Mettre à jour l'ordre de vente
                                    if (newSellQuantity <= 0) {
                                        // Ordre de vente complètement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET status = ?, quantity = 0 WHERE id = ?',
                                                ['filled', sellOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔴 Ordre de vente complètement rempli');
                                    } else {
                                        // Ordre de vente partiellement rempli
                                        await new Promise((resolve, reject) => {
                                            db.run(
                                                'UPDATE orders SET quantity = ?, status = ? WHERE id = ?',
                                                [newSellQuantity, 'partial', sellOrder.id],
                                                (err) => err ? reject(err) : resolve()
                                            );
                                        });
                                        console.log('🔴 Ordre de vente partiellement rempli:', newSellQuantity, 'restant');
                                    }
                                    
                                } else {
                                    console.log('❌ Erreur lors du trade:', result.error);
                                }
                                
                            } catch (error) {
                                console.error('❌ Erreur exécution trade:', error.message);
                            }
                            
                            // Continuer à chercher d'autres matches possibles
                            resolve();
                            return;
                        }
                    }
                }
                
                console.log('⏸️ Aucun match trouvé pour', assetSymbol);
                resolve();
            }
        );
    });
}
