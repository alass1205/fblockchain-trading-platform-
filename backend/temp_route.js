// Route pour créer un ordre simple (sans escrow pour l'instant)
app.post("/api/create-order-with-deposit", async (req, res) => {
    const { userAddress, assetSymbol, orderType, quantity, price } = req.body;
    
    try {
        console.log("📝 Création ordre SIMPLE:", { userAddress, assetSymbol, orderType, quantity, price });
        
        // Créer l'ordre directement en base de données
        db.run(
            `INSERT INTO orders (user_address, asset_symbol, order_type, quantity, price) VALUES (?, ?, ?, ?, ?)`,
            [userAddress, assetSymbol, orderType, quantity, price],
            function(err) {
                if (err) {
                    console.error('Erreur création ordre:', err);
                    res.status(500).json({ success: false, error: err.message });
                } else {
                    console.log('✅ Ordre créé avec ID:', this.lastID);
                    
                    // Déclencher le matching automatique
                    setTimeout(() => {
                        fetch(`http://localhost:3001/api/match-orders/${assetSymbol}`, {
                            method: 'POST'
                        }).catch(err => console.log('Matching:', err.message));
                    }, 1000);
                    
                    res.json({ 
                        success: true, 
                        orderId: this.lastID,
                        message: 'Ordre créé - Matching en cours...'
                    });
                }
            }
        );
        
    } catch (error) {
        console.error('❌ Erreur création ordre:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
