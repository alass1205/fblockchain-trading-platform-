const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// Corriger les doubles "addresses."
content = content.replace(/addresses\.\s*addresses\./g, 'addresses.');

// Corriger l'ordre des paramètres pour getBalance(token, user)
content = content.replace(
    /await vaultContract\.getBalance\(addresses\.(\w+)\)/g, 
    'await vaultContract.getBalance(addresses.$1, address)'
);

fs.writeFileSync('server.js', content);
console.log('✅ Erreurs de syntaxe corrigées !');
