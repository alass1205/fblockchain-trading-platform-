    async function checkUserRegistration(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/check-registration/${address}`);
            const data = await response.json();
            
            console.log("🔍 Vérification inscription:", data);
            
            if (data.success && data.registered) {
                setUserRegistered(true);
                setShowRegistration(false);
                console.log("✅ Utilisateur déjà inscrit:", data.user.legal_name);
            } else {
                setUserRegistered(false);
                setShowRegistration(true);
                console.log("ℹ️ Utilisateur non inscrit, affichage formulaire");
            }
        } catch (error) {
            console.error("Erreur vérification inscription:", error);
            setShowRegistration(true);
        }
    }
