# Nettoyer et redéployer
rm -rf artifacts cache deployed-addresses.json user-addresses.json

# Recompiler
npx hardhat compile

# Redéployer
npx hardhat run scripts/deploy.js --network localhost

# Repeupler
npx hardhat run scripts/populate.js --network localhost

# Vérifier
cat user-addresses.json


npx hardhat run scripts/reset-balances.js --network localhost