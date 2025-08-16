import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWebSocket } from '../hooks/useWebSocket';

export default function ModernTradingHomeWebSocket() {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [userRegistered, setUserRegistered] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [formData, setFormData] = useState({
        legalName: '',
        passportFile: null
    });
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showWalletOptions, setShowWalletOptions] = useState(false);

    // 🔥 WEBSOCKET: Remplace les auto-refresh !
    const { 
        socket, 
        isConnected: wsConnected, 
        balances, 
        vaultBalances, 
        orders, 
        trades 
    } = useWebSocket(account);

    useEffect(() => {
        checkWalletConnection();
    }, []);

    async function checkWalletConnection() {
        if (typeof window !== 'undefined' && window.ethereum) {
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
        if (typeof window === 'undefined' || !window.ethereum) {
            alert('MetaMask non installé!');
            return;
        }

        setIsLoading(true);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            setIsConnected(true);
            await checkUserRegistration(accounts[0]);
        } catch (error) {
            console.error('Erreur connexion:', error);
            alert('Erreur lors de la connexion');
        }
        setIsLoading(false);
    }

    function forceReconnect() {
        window.location.reload();
    }

    function disconnectWallet() {
        setAccount('');
        setIsConnected(false);
        setUserRegistered(false);
        setShowRegistration(false);
        setShowWalletOptions(false);
    }

    async function checkUserRegistration(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/check-registration/${address}`);
            const data = await response.json();
            
            if (data.success && data.registered) {
                setUserRegistered(true);
                setShowRegistration(false);
            } else {
                setUserRegistered(false);
                setShowRegistration(true);
            }
        } catch (error) {
            console.error("Erreur vérification inscription:", error);
            setShowRegistration(true);
        }
    }

    async function handleRegistration(e) {
        e.preventDefault();
        setIsLoading(true);
        
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
            } else {
                alert('Erreur inscription');
            }
        } catch (error) {
            console.error('Erreur inscription:', error);
            alert('Erreur inscription');
        }
        setIsLoading(false);
    }

    const getUserName = (address) => {
        if (address === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'Aya';
        if (address === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Beatriz';
        return 'Trader';
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: isDarkMode 
                ? 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Main Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Modern Header */}
                <header style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '20px 0'
                }}>
                    <div style={{
                        maxWidth: '1400px',
                        margin: '0 auto',
                        padding: '0 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: 'linear-gradient(45deg, #00d4ff, #ff0080)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                🏛️
                            </div>
                            <div>
                                <h1 style={{ 
                                    margin: 0, 
                                    fontSize: '24px', 
                                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '700'
                                }}>
                                    QuantumTrade
                                </h1>
                                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                    Real-Time WebSocket Platform
                                </p>
                            </div>
                        </div>

                        {/* WebSocket Status + Wallet Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* 🔥 NOUVEAU: Indicateur WebSocket */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: wsConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                                border: `1px solid ${wsConnected ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                                borderRadius: '10px',
                                fontSize: '12px'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: wsConnected ? '#00ff88' : '#ff6b6b'
                                }}></div>
                                {wsConnected ? 'Live' : 'Offline'}
                            </div>

                            {!isConnected ? (
                                <button
                                    onClick={connectWallet}
                                    disabled={isLoading}
                                    style={{
                                        background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                        border: 'none',
                                        borderRadius: '15px',
                                        padding: '12px 24px',
                                        color: '#000',
                                        fontWeight: '600',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontSize: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isLoading ? '⏳' : '🦊'} 
                                    {isLoading ? 'Connecting...' : 'Connect Wallet'}
                                </button>
                            ) : (
                                <button
                                    style={{
                                        background: 'rgba(0, 212, 255, 0.2)',
                                        border: '1px solid rgba(0, 212, 255, 0.3)',
                                        borderRadius: '15px',
                                        padding: '12px 20px',
                                        color: '#00d4ff',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🟢 {formatAddress(account)}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
                    {!isConnected ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <h2 style={{ 
                                fontSize: '48px', 
                                margin: '0 0 20px 0',
                                background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: '800'
                            }}>
                                Welcome to WebSocket Trading
                            </h2>
                            <p style={{ 
                                fontSize: '20px', 
                                color: 'rgba(255,255,255,0.8)'
                            }}>
                                Connect your wallet to start real-time trading
                            </p>
                        </div>
                    ) : !userRegistered ? (
                        showRegistration ? (
                            <div style={{ textAlign: 'center' }}>
                                <h2>Complete Registration</h2>
                                <form onSubmit={handleRegistration}>
                                    <input
                                        type="text"
                                        value={formData.legalName}
                                        onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                                        placeholder="Legal Name"
                                        required
                                        style={{
                                            padding: '15px',
                                            margin: '10px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff'
                                        }}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({...formData, passportFile: e.target.files[0]})}
                                        style={{
                                            padding: '15px',
                                            margin: '10px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff'
                                        }}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        style={{
                                            padding: '15px 30px',
                                            background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#000',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            margin: '10px'
                                        }}
                                    >
                                        {isLoading ? 'Registering...' : 'Register'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <h2>Verifying Registration...</h2>
                            </div>
                        )
                    ) : (
                        <div>
                            {/* User Dashboard */}
                            <div style={{
                                background: 'rgba(0, 212, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '20px',
                                padding: '30px',
                                marginBottom: '40px',
                                textAlign: 'center'
                            }}>
                                <h2 style={{ 
                                    margin: '0 0 15px 0',
                                    fontSize: '28px',
                                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '700'
                                }}>
                                    Welcome, {getUserName(account)}! 🎯
                                </h2>
                                
                                {/* 🔥 NOUVEAU: Statut WebSocket */}
                                <div style={{
                                    background: wsConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                                    border: `1px solid ${wsConnected ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                                    borderRadius: '10px',
                                    padding: '10px',
                                    marginBottom: '20px',
                                    fontSize: '14px'
                                }}>
                                    {wsConnected ? '🔥 Live WebSocket Connection' : '❌ WebSocket Disconnected'}
                                </div>
                                
                                {/* Balance Display - 🔥 WEBSOCKET DATA */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                    gap: '20px',
                                    marginTop: '25px'
                                }}>
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#00ff88' }}>
                                            {balances.TRG || 0}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>TRG</div>
                                    </div>
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#00d4ff' }}>
                                            {balances.CLV || 0}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>CLV</div>
                                    </div>
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌿</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff6b6b' }}>
                                            {balances.ROO || 0}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>ROO</div>
                                    </div>
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏛️</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffa502' }}>
                                            {balances.GOV || 0}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>GOV</div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '15px' }}>
                                    🔥 Real-time WebSocket updates
                                </p>
                            </div>

                            {/* Quick Navigation */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '20px'
                            }}>
                                <button
                                    onClick={() => router.push('/portfolio')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        color: '#ffffff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📊 Portfolio
                                </button>
                                <button
                                    onClick={() => router.push('/trades')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        color: '#ffffff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📈 Trade History
                                </button>
                                <button
                                    onClick={() => router.push('/assets/CLV')}
                                    style={{
                                        background: 'rgba(0, 212, 255, 0.2)',
                                        border: '1px solid rgba(0, 212, 255, 0.3)',
                                        borderRadius: '15px',
                                        padding: '20px',
                                        color: '#00d4ff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🏢 Trade CLV
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
