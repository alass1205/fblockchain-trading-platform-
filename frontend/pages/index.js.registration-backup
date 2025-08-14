import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';

export default function Home() {
    const [account, setAccount] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [userRegistered, setUserRegistered] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [formData, setFormData] = useState({
        legalName: '',
        passportFile: null
    });

    useEffect(() => {
        checkWalletConnection();
    }, []);

    async function checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                    checkUserRegistration(accounts[0]);
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
            checkUserRegistration(accounts[0]);
        } catch (error) {
            console.error('Erreur connexion:', error);
            alert('Erreur lors de la connexion');
        }
    }

    function forceReconnect() {
        // Simple rechargement pour forcer la reconnexion
        window.location.reload();
    }

    function disconnectWallet() {
        setAccount('');
        setIsConnected(false);
        setUserRegistered(false);
        setShowRegistration(false);
        alert('Déconnecté! Changez de compte dans MetaMask puis rechargez.');
    }

    async function checkUserRegistration(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/user/${address}`);
            const userData = await response.json();
            
            if (userData && userData.legal_name) {
                setUserRegistered(true);
                setShowRegistration(false);
            } else {
                setUserRegistered(false);
                setShowRegistration(true);
            }
        } catch (error) {
            console.error('Erreur utilisateur:', error);
            setShowRegistration(true);
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
            } else {
                alert('Erreur inscription');
            }
        } catch (error) {
            console.error('Erreur inscription:', error);
            alert('Erreur inscription');
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ 
                borderBottom: '1px solid #ccc', 
                paddingBottom: '20px', 
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1>🏛️ Blockchain Trading Platform</h1>
                    <p>Plateforme de trading d'instruments financiers</p>
                </div>
                
                <div>
                    {isConnected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                                backgroundColor: '#d4edda', 
                                padding: '8px 12px', 
                                borderRadius: '5px' 
                            }}>
                                🟢 {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                            <button 
                                onClick={forceReconnect}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ffc107',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
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

            <main>
                {!isConnected ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <h2>Bienvenue</h2>
                        <p>Connectez MetaMask pour commencer</p>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '15px',
                            borderRadius: '5px',
                            margin: '20px auto',
                            maxWidth: '600px'
                        }}>
                            <h4>🔄 Pour changer de compte :</h4>
                            <ol style={{ textAlign: 'left' }}>
                                <li>Ouvrez MetaMask</li>
                                <li>Cliquez sur l'icône de compte</li>
                                <li>Sélectionnez Aya (0x7099...) ou Beatriz (0x3C44...)</li>
                                <li>Revenez ici et cliquez "Connecter MetaMask"</li>
                            </ol>
                        </div>
                    </div>
                ) : showRegistration ? (
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
                                        marginTop: '5px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
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
                                        marginTop: '5px'
                                    }}
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                S'inscrire
                            </button>
                        </form>
                    </div>
                ) : (
                    <div>
                        <div style={{ 
                            backgroundColor: '#d4edda', 
                            padding: '15px', 
                            borderRadius: '5px',
                            marginBottom: '20px'
                        }}>
                            <strong>✅ Connecté: {account}</strong>
                            {account.toLowerCase() === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' && (
                                <p style={{ margin: '5px 0 0 0' }}>🎯 Compte d'Aya (200 TRG, 10 CLV, 2 GOV)</p>
                            )}
                            {account.toLowerCase() === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' && (
                                <p style={{ margin: '5px 0 0 0' }}>🎯 Compte de Beatriz (150 TRG, 20 ROO, 5 GOV)</p>
                            )}
                            {account.toLowerCase() !== '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' && account.toLowerCase() !== '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' && (
                                <p style={{ margin: '5px 0 0 0', color: '#856404' }}>⚠️ Compte inconnu - Utilisez Aya ou Beatriz pour l'audit</p>
                            )}
                        </div>

                        <h2>Navigation</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <Link href="/portfolio" style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '20px', 
                                    borderRadius: '8px',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer'
                                }}>
                                    <h3>📊 Portfolio</h3>
                                    <p>Vos actifs et retraits</p>
                                </div>
                            </Link>

                            <Link href="/assets/CLV" style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '20px', 
                                    borderRadius: '8px',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer'
                                }}>
                                    <h3>🏢 Actions CLV</h3>
                                    <p>Clove Company</p>
                                </div>
                            </Link>

                            <Link href="/assets/ROO" style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '20px', 
                                    borderRadius: '8px',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer'
                                }}>
                                    <h3>🌿 Actions ROO</h3>
                                    <p>Rooibos Limited</p>
                                </div>
                            </Link>

                            <Link href="/assets/GOV" style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '20px', 
                                    borderRadius: '8px',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer'
                                }}>
                                    <h3>🏛️ Obligations GOV</h3>
                                    <p>Obligations gouvernementales</p>
                                </div>
                            </Link>

                            <Link href="/faq" style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '20px', 
                                    borderRadius: '8px',
                                    backgroundColor: '#f8f9fa',
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
