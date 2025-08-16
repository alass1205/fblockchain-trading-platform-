const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./trading.db');

console.log('🔧 Ajout de la colonne mode...');

db.run(`ALTER TABLE orders ADD COLUMN mode TEXT DEFAULT 'vault'`, function(err) {
    if (err) {
        console.log('⚠️ Colonne mode existe déjà ou erreur:', err.message);
    } else {
        console.log('✅ Colonne mode ajoutée');
    }
    
    // Marquer les ordres existants comme mode vault
    db.run(`UPDATE orders SET mode = 'vault' WHERE mode IS NULL`, function(err) {
        if (err) {
            console.error('❌ Erreur update mode:', err);
        } else {
            console.log('✅ Ordres existants marqués comme mode vault');
        }
        
        db.close();
    });
});
