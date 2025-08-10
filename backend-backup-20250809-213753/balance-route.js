// Route à ajouter dans server.js

app.get('/api/balances/:address', async (req, res) => {
    const userAddress = req.params.address;
    
    try {
        // Adresses des contrats
        const contractAddresses = {
            TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 
            ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            GOV: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
        };

        // Connexion à Hardhat depuis le backend
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        
        const erc20ABI = ["function balanceOf(address owner) view returns (uint256)"];
        const bondABI = ["function getBondsByOwner(address owner) view returns (uint256[])"];

        const balances = {};

        // TRG
        const trgContract = new ethers.Contract(contractAddresses.TRG, erc20ABI, provider);
        const trgBalance = await trgContract.balanceOf(userAddress);
        balances.TRG = ethers.utils.formatEther(trgBalance);

        // CLV
        const clvContract = new ethers.Contract(contractAddresses.CLV, erc20ABI, provider);
        const clvBalance = await clvContract.balanceOf(userAddress);
        balances.CLV = ethers.utils.formatEther(clvBalance);

        // ROO
        const rooContract = new ethers.Contract(contractAddresses.ROO, erc20ABI, provider);
        const rooBalance = await rooContract.balanceOf(userAddress);
        balances.ROO = ethers.utils.formatEther(rooBalance);

        // GOV
        const govContract = new ethers.Contract(contractAddresses.GOV, bondABI, provider);
        const bonds = await govContract.getBondsByOwner(userAddress);
        balances.GOV = bonds.length.toString();

        res.json({
            success: true,
            address: userAddress,
            balances: balances
        });

    } catch (error) {
        console.error('Erreur récupération balances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
