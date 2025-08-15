const fs = require('fs');

// Lire le fichier server.js
let serverContent = fs.readFileSync('server.js', 'utf8');

// Remplacer la mauvaise fonction par la bonne
const oldFunction = '"function getUserTokenBalance(address user, address tokenAddress) external view returns (uint256)"';
const newFunction = '"function getBalance(address token, address user) external view returns (uint256)"';

serverContent = serverContent.replace(oldFunction, newFunction);

// Remplacer aussi les appels de fonction
serverContent = serverContent.replace(/getUserTokenBalance\(address,/g, 'getBalance(addresses.');
serverContent = serverContent.replace(/getUserTokenBalance\(address\s*,\s*addresses\./g, 'getBalance(addresses.');

// Corriger les appels complets
serverContent = serverContent.replace(
    /await vaultContract\.getUserTokenBalance\(address, addresses\.(\w+)\)/g, 
    'await vaultContract.getBalance(addresses.$1, address)'
);

// Écrire le fichier corrigé
fs.writeFileSync('server.js', serverContent);
console.log('✅ Correction ABI vault appliquée !');
