import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';

export default function Home() {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [userRegistered, setUserRegistered] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [balances, setBalances] = useState({});
    const [formData, setFormData] = useState({
        legalName: '',
        passportFile: null
    });

    useEffect(() => {
        checkWalletConnection();
    }, []);

    // Rafraîchissement automatique des balances toutes les 10 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            if (account && userRegistered) {
                loadBalances(account);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [account, userRegistered]);

    async function checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                    await checkUserRegistration(accounts[0]);
                }
            } catch (error) {
                console.error('Erreur wallet:', error);
            }
        }
    }

    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask non installé!');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            setIsConnected(true);
            await checkUserRegistration(accounts[0]);
        } catch (error) {
            console.error('Erreur connexion:', error);
            alert('Erreur lors de la connexion');
        }
    }

    function forceReconnect() {
        window.location.reload();
    }

    function disconnectWallet() {
        setAccount('');
        setIsConnected(false);
        setUserRegistered(false);
        setShowRegistration(false);
        setBalances({});
        alert('Déconnecté! Changez de compte dans MetaMask puis rechargez.');
    }

    async function checkUserRegistration(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/check-registration/${address}`);
            const data = await response.json();
            
            console.log("🔍 Vérification inscription:", data);
            
            if (data.success && data.registered) {
                setUserRegistered(true);
                setShowRegistration(false);
                console.log("✅ Utilisateur déjà inscrit:", data.user.legal_name);
                // Charger les balances après confirmation d'inscription
                await loadBalances(address);
            } else {
                setUserRegistered(false);
                setShowRegistration(true);
                console.log("ℹ️ Utilisateur non inscrit");
            }
        } catch (error) {
            console.error("Erreur vérification inscription:", error);
            setShowRegistration(true);
        }
    }

    async function loadBalances(address) {
        try {
            console.log("📊 Chargement balances pour:", address);
            const response = await fetch(`http://localhost:3001/api/balances/${address}`);
            const data = await response.json();
            
            if (data.success) {
                setBalances(data.balances);
                console.log("✅ Balances chargées:", data.balances);
            }
        } catch (error) {
            console.error("Erreur chargement balances:", error);
        }
    }

    async function handleRegistration(e) {
        e.preventDefault();
        
        const formDataToSend = new FormData();
        formDataToSend.append('walletAddress', account);
        formDataToSend.append('legalName', formData.legalName);
        if (formData.passportFile) {
            formDataToSend.append('passport', formData.passportFile);
        }

        try {
            const response = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                body: formDataToSend
            });
            const result = await response.json();
            
            if (result.success) {
                setUserRegistered(true);
                setShowRegistration(false);
                alert('Inscription réussie!');
                // Charger les balances après inscription
                await loadBalances(account);
            } else {
                alert('Erreur inscription');
            }
        } catch (error) {
            console.error('Erreur inscription:', error);
            alert('Erreur inscription');
        }
    }

    // Fonction pour déterminer le nom de l'utilisateur
    const getUserName = (address) => {
        if (address === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'Aya';
        if (address === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Beatriz';
        return 'Utilisateur';
    };

    return (
        <div style={{ 
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f5f5f5'
        }}>
            <header style={{
                backgroundColor: '#fff',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
                        🏛️ Blockchain Trading Platform
                    </h1>
                    <p style={{ margin: '0 0 20px 0', color: '#666' }}>
                        Plateforme de trading d'instruments financiers
                    </p>

                    {isConnected ? (
                        <div style={{ 
                            padding: '10px 15px',
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '5px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                🟢 {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                            <div>
                                <button 
                                    onClick={forceReconnect}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        marginRight: '10px'
                                    }}
                                >
                                    Recharger
                                </button>
                                <button 
                                    onClick={disconnectWallet}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Déconnecter
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={connectWallet}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            🦊 Connecter MetaMask
                        </button>
                    )}
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {!isConnected ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <h2>Bienvenue sur la plateforme de trading</h2>
                        <p>Connectez votre wallet MetaMask pour commencer</p>
                    </div>
                ) : !userRegistered ? (
                    showRegistration ? (
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <h2>Inscription</h2>
                            <form onSubmit={handleRegistration}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label>Nom légal :</label>
                                    <input
                                        type="text"
                                        value={formData.legalName}
                                        onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                                        required
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '5px',
                                            border: '1px solid #ddd',
                                            marginTop: '5px'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label>Photo passeport :</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({...formData, passportFile: e.target.files[0]})}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '5px',
                                            border: '1px solid #ddd',
                                            marginTop: '5px'
                                        }}
                                    />
                                </div>
                                <button type="submit" style={{
                                    width: '100%',
                                    padding: '15px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}>
                                    S'inscrire
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <h2>Vérification de l'inscription...</h2>
                        </div>
                    )
                ) : (
                    <div>
                        <div style={{
                            backgroundColor: '#d1ecf1',
                            padding: '15px',
                            borderRadius: '10px',
                            marginBottom: '30px',
                            textAlign: 'center'
                        }}>
                            <h2>**✅ Connecté: {account}**</h2>
                            <p>🎯 Compte de {getUserName(account)} - Balances RÉELLES:</p>
                            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                💰 {balances.TRG || 0} TRG | 
                                📈 {balances.CLV || 0} CLV | 
                                🌿 {balances.ROO || 0} ROO | 
                                🏛️ {balances.GOV || 0} GOV
                            </p>
                            <small style={{ color: '#666' }}>Mise à jour automatique toutes les 10s</small>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '20px'
                        }}>
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '10px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <h3>Navigation</h3>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <li style={{ marginBottom: '10px' }}>
                                        <Link href="/portfolio" style={{ color: '#007bff', textDecoration: 'none' }}>
                                            📊 Portfolio
                                        </Link>
                                    </li>
                                    <li style={{ marginBottom: '10px' }}>
                                        <button 
                                            onClick={() => router.push("/trades")} 
                                            style={{
                                                color: "#007bff", 
                                                background: "none", 
                                                border: "none", 
                                                textDecoration: "underline", 
                                                cursor: "pointer",
                                                fontSize: "16px"
                                            }}
                                        >
                                            📊 Historique Trades
                                        </button>
                                    </li>
                                </ul>
                                <p style={{ color: '#666', fontSize: '14px' }}>Vos actifs et retraits</p>
                            </div>

                            <Link href="/assets/CLV" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}>
                                    <h3>🏢 Actions CLV</h3>
                                    <p>Clove Company</p>
                                    <small>Vous avez: {balances.CLV || 0} CLV</small>
                                </div>
                            </Link>

                            <Link href="/assets/ROO" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    cursor: 'pointer'
                                }}>
                                    <h3>🌿 Actions ROO</h3>
                                    <p>Rooibos Limited</p>
                                    <small>Vous avez: {balances.ROO || 0} ROO</small>
                                </div>
                            </Link>

                            <Link href="/assets/GOV" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    cursor: 'pointer'
                                }}>
                                    <h3>🏛️ Obligations GOV</h3>
                                    <p>Obligations gouvernementales</p>
                                    <small>Vous avez: {balances.GOV || 0} GOV</small>
                                </div>
                            </Link>

                            <Link href="/faq" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    cursor: 'pointer'
                                }}>
                                    <h3>❓ FAQ</h3>
                                    <p>Guide d'utilisation</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
