
// Remplacer la partie ethers.getSigners dans server.js
// Ligne ~372 dans server.js

// AVANT (ne marche pas):
// const [deployer] = await ethers.getSigners();

// APRÈS (correct):
const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(deployerPrivateKey, provider);
