// Fonction à ajouter dans index.js pour vérifier l'inscription

const checkUserRegistration = async (address) => {
    try {
        const response = await fetch(`http://localhost:3001/api/check-registration/${address}`);
        const data = await response.json();
        
        if (data.success && data.registered) {
            setUserRegistered(true);
            setShowRegistration(false);
            console.log('✅ Utilisateur déjà inscrit:', data.user.legal_name);
        } else {
            setUserRegistered(false);
            setShowRegistration(true);
            console.log('ℹ️ Utilisateur non inscrit, affichage formulaire');
        }
    } catch (error) {
        console.error('Erreur vérification inscription:', error);
        setShowRegistration(true);
    }
};

// Modifier la fonction connectWallet pour inclure la vérification
const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            setConnected(true);
            
            // AJOUTER CETTE LIGNE : Vérifier l'inscription automatiquement
            await checkUserRegistration(accounts[0]);
            
        } catch (error) {
            console.error('Erreur connexion:', error);
        }
    } else {
        alert('MetaMask n\'est pas installé!');
    }
};
