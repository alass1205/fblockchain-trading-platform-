const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('trading.db');

// Créer la table des trades
db.run(`
    CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_symbol TEXT NOT NULL,
        buyer_address TEXT NOT NULL,
        seller_address TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'completed',
        tx_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ Erreur création table trades:', err);
    } else {
        console.log('✅ Table trades créée');
    }
    db.close();
});
