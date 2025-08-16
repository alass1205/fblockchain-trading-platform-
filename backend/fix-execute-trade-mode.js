// Remplacement de la route /api/execute-trade pour supporter les modes

const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Trouver et remplacer la route execute-trade
const oldRoute = /app\.post\("\/api\/execute-trade".*?\}\);/s;

const newRoute = `app.post("/api/execute-trade", async (req, res) => {
    const { buyerAddress, sellerAddress, assetSymbol, quantity, price } = req.body;
    
    try {
        console.log("🔗 Exécution trade:", { buyerAddress, sellerAddress, assetSymbol, quantity, price });
        
        // Déterminer le mode en vérifiant les ordres dans la base
        const sellOrder = await new Promise((resolve, reject) => {
            db.get(
                'SELECT mode FROM orders WHERE user_address = ? AND asset_symbol = ? AND order_type = ? AND status = ? LIMIT 1',
                [sellerAddress, assetSymbol, 'sell', 'pending'],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        const mode = sellOrder ? sellOrder.mode : 'vault'; // défaut vault
        console.log("🎯 Mode détecté:", mode);
        
        if (mode === 'approval') {
            // MODE APPROBATION - utilise transferFrom avec allowances
            await executeApprovalTrade(buyerAddress, sellerAddress, assetSymbol, quantity, price);
        } else {
            // MODE VAULT - utilise les fonds du vault
            await executeVaultTrade(buyerAddress, sellerAddress, assetSymbol, quantity, price);
        }
        
        // Mettre à jour les ordres en base
        await updateOrdersAfterTrade(assetSymbol, buyerAddress, sellerAddress, quantity, price);
        
        res.json({
            success: true,
            message: \`Trade exécuté en mode \${mode}\`,
            mode: mode,
            transactionDetails: {
                asset: \`\${quantity} \${assetSymbol}\`,
                payment: \`\${quantity * price} TRG\`,
                buyer: buyerAddress,
                seller: sellerAddress
            }
        });
        
        console.log(\`✅ Trade \${mode} terminé avec succès!\`);
        
    } catch (error) {
        console.error("❌ Erreur execution trade:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})`;

content = content.replace(oldRoute, newRoute);
fs.writeFileSync('server.js', content);
console.log('✅ Route execute-trade modifiée pour supporter les modes');
