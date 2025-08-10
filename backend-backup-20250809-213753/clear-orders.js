const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('trading.db');

console.log('🧹 Nettoyage de tous les anciens ordres...');

db.run('DELETE FROM orders', function(err) {
    if (err) {
        console.error('❌ Erreur:', err);
    } else {
        console.log(`✅ ${this.changes} ordres supprimés`);
        console.log('🎯 Base de données nettoyée - Prêt pour l\'audit !');
    }
    db.close();
});
