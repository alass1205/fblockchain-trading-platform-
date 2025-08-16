import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ModernTradingHome() {
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
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showWalletOptions, setShowWalletOptions] = useState(false);

    useEffect(() => {
        checkWalletConnection();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (account && userRegistered) {
                loadBalances(account);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [account, userRegistered]);

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
        setBalances({});
        setShowWalletOptions(false);
    }

    async function checkUserRegistration(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/check-registration/${address}`);
            const data = await response.json();
            
            if (data.success && data.registered) {
                setUserRegistered(true);
                setShowRegistration(false);
                await loadBalances(address);
            } else {
                setUserRegistered(false);
                setShowRegistration(true);
            }
        } catch (error) {
            console.error("Erreur vérification inscription:", error);
            setShowRegistration(true);
        }
    }

    async function loadBalances(address) {
        try {
            const response = await fetch(`http://localhost:3001/api/balances/${address}`);
            const data = await response.json();
            
            if (data.success) {
                setBalances(data.balances);
            }
        } catch (error) {
            console.error("Erreur chargement balances:", error);
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
                await loadBalances(account);
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
            {/* Animated Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                zIndex: 0
            }}>
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: Math.random() * 200 + 50 + 'px',
                            height: Math.random() * 200 + 50 + 'px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#ff0080' : '#00ff88'}15 0%, transparent 70%)`,
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animation: `float ${Math.random() * 20 + 10}s infinite linear`,
                            opacity: 0.6
                        }}
                    />
                ))}
            </div>

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
                                    Next-Gen DeFi Platform
                                </p>
                            </div>
                        </div>

                        {/* Wallet Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isDarkMode ? '☀️' : '🌙'}
                            </button>

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
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowWalletOptions(!showWalletOptions)}
                                        style={{
                                            background: 'rgba(0, 212, 255, 0.2)',
                                            border: '1px solid rgba(0, 212, 255, 0.3)',
                                            borderRadius: '15px',
                                            padding: '12px 20px',
                                            color: '#00d4ff',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        🟢 {formatAddress(account)}
                                        <span style={{ fontSize: '12px' }}>▼</span>
                                    </button>

                                    {showWalletOptions && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '10px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            backdropFilter: 'blur(20px)',
                                            borderRadius: '15px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            padding: '15px',
                                            minWidth: '200px',
                                            zIndex: 1000
                                        }}>
                                            <button
                                                onClick={forceReconnect}
                                                style={{
                                                    width: '100%',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ffffff',
                                                    padding: '10px',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    marginBottom: '5px'
                                                }}
                                            >
                                                🔄 Reload
                                            </button>
                                            <button
                                                onClick={disconnectWallet}
                                                style={{
                                                    width: '100%',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ff4757',
                                                    padding: '10px',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                🚪 Disconnect
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
                    {!isConnected ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '25px',
                                padding: '60px 40px',
                                maxWidth: '600px',
                                margin: '0 auto',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <h2 style={{ 
                                    fontSize: '48px', 
                                    margin: '0 0 20px 0',
                                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '800'
                                }}>
                                    Welcome to the Future
                                </h2>
                                <p style={{ 
                                    fontSize: '20px', 
                                    color: 'rgba(255,255,255,0.8)', 
                                    lineHeight: '1.6',
                                    marginBottom: '40px'
                                }}>
                                    Trade financial instruments on the blockchain with cutting-edge technology and seamless user experience.
                                </p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '20px',
                                    marginTop: '40px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Lightning Fast</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Ultra Secure</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌍</div>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Global Access</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !userRegistered ? (
                        showRegistration ? (
                            <div style={{
                                maxWidth: '500px',
                                margin: '0 auto',
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '25px',
                                padding: '40px',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <h2 style={{ 
                                    textAlign: 'center', 
                                    marginBottom: '30px',
                                    background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: '28px',
                                    fontWeight: '700'
                                }}>
                                    Complete Your Profile
                                </h2>
                                <form onSubmit={handleRegistration}>
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ 
                                            display: 'block', 
                                            marginBottom: '8px', 
                                            fontWeight: '600',
                                            color: 'rgba(255,255,255,0.9)'
                                        }}>
                                            Legal Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.legalName}
                                            onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '15px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: '#ffffff',
                                                fontSize: '16px',
                                                outline: 'none'
                                            }}
                                            placeholder="Enter your full legal name"
                                        />
                                    </div>
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ 
                                            display: 'block', 
                                            marginBottom: '8px', 
                                            fontWeight: '600',
                                            color: 'rgba(255,255,255,0.9)'
                                        }}>
                                            Passport Photo
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFormData({...formData, passportFile: e.target.files[0]})}
                                            style={{
                                                width: '100%',
                                                padding: '15px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: '#ffffff',
                                                fontSize: '16px'
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#000',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {isLoading ? '⏳ Registering...' : '🚀 Complete Registration'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px' }}>
                                <div style={{
                                    display: 'inline-block',
                                    width: '60px',
                                    height: '60px',
                                    border: '4px solid rgba(0, 212, 255, 0.3)',
                                    borderTop: '4px solid #00d4ff',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <h2 style={{ marginTop: '20px', color: 'rgba(255,255,255,0.8)' }}>
                                    Verifying Registration...
                                </h2>
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
                                border: '1px solid rgba(0, 212, 255, 0.3)',
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
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', margin: '0 0 20px 0' }}>
                                    Connected: {formatAddress(account)}
                                </p>
                                
                                {/* Balance Display */}
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
                                    Auto-refresh every 10s
                                </p>
                            </div>

                            {/* Navigation Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '25px'
                            }}>
                                {/* Portfolio Card */}
                                <div
                                    onClick={() => router.push('/portfolio')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ 
                                            fontSize: '40px', 
                                            marginBottom: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px'
                                        }}>
                                            📊
                                            <span style={{ fontSize: '24px', fontWeight: '700' }}>Portfolio</span>
                                        </div>
                                        <p style={{ 
                                            color: 'rgba(255,255,255,0.8)', 
                                            marginBottom: '20px',
                                            fontSize: '16px',
                                            lineHeight: '1.5'
                                        }}>
                                            Manage your assets, track performance, and execute withdrawals
                                        </p>
                                        <button style={{
                                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '12px 24px',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}>
                                            View Portfolio →
                                        </button>
                                    </div>
                                </div>

                                {/* Trades History Card */}
                                <div
                                    onClick={() => router.push('/trades')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '40px', 
                                        marginBottom: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
                                        📈
                                        <span style={{ fontSize: '24px', fontWeight: '700' }}>Trade History</span>
                                    </div>
                                    <p style={{ 
                                        color: 'rgba(255,255,255,0.8)', 
                                        marginBottom: '20px',
                                        fontSize: '16px',
                                        lineHeight: '1.5'
                                    }}>
                                        Review your trading activity and transaction history
                                    </p>
                                    <button style={{
                                        background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        color: '#000',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                        View History →
                                    </button>
                                </div>

                                {/* CLV Trading Card */}
                                <div
                                    onClick={() => router.push('/assets/CLV')}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 255, 136, 0.1))',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(0, 212, 255, 0.3)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ 
                                            fontSize: '40px', 
                                            marginBottom: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px'
                                        }}>
                                            🏢
                                            <span style={{ fontSize: '24px', fontWeight: '700' }}>CLV Shares</span>
                                        </div>
                                        <p style={{ 
                                            color: 'rgba(255,255,255,0.8)', 
                                            marginBottom: '15px',
                                            fontSize: '16px'
                                        }}>
                                            Clove Company
                                        </p>
                                        <div style={{
                                            background: 'rgba(0, 212, 255, 0.2)',
                                            borderRadius: '10px',
                                            padding: '15px',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Your Holdings</div>
                                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#00d4ff' }}>
                                                {balances.CLV || 0} CLV
                                            </div>
                                        </div>
                                        <button style={{
                                            background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '12px 24px',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            width: '100%'
                                        }}>
                                            Trade CLV →
                                        </button>
                                    </div>
                                </div>

                                {/* ROO Trading Card */}
                                <div
                                    onClick={() => router.push('/assets/ROO')}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 165, 0, 0.1))',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(255, 107, 107, 0.3)'
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '40px', 
                                        marginBottom: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
                                        🌿
                                        <span style={{ fontSize: '24px', fontWeight: '700' }}>ROO Shares</span>
                                    </div>
                                    <p style={{ 
                                        color: 'rgba(255,255,255,0.8)', 
                                        marginBottom: '15px',
                                        fontSize: '16px'
                                    }}>
                                        Rooibos Limited
                                    </p>
                                    <div style={{
                                        background: 'rgba(255, 107, 107, 0.2)',
                                        borderRadius: '10px',
                                        padding: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Your Holdings</div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#ff6b6b' }}>
                                            {balances.ROO || 0} ROO
                                        </div>
                                    </div>
                                    <button style={{
                                        background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        color: '#ffffff',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        width: '100%'
                                    }}>
                                        Trade ROO →
                                    </button>
                                </div>

                                {/* GOV Trading Card */}
                                <div
                                    onClick={() => router.push('/assets/GOV')}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 165, 2, 0.2), rgba(255, 193, 7, 0.1))',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(255, 165, 2, 0.3)'
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '40px', 
                                        marginBottom: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
                                        🏛️
                                        <span style={{ fontSize: '24px', fontWeight: '700' }}>GOV Bonds</span>
                                    </div>
                                    <p style={{ 
                                        color: 'rgba(255,255,255,0.8)', 
                                        marginBottom: '15px',
                                        fontSize: '16px'
                                    }}>
                                        Government Securities
                                    </p>
                                    <div style={{
                                        background: 'rgba(255, 165, 2, 0.2)',
                                        borderRadius: '10px',
                                        padding: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Your Holdings</div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffa502' }}>
                                            {balances.GOV || 0} GOV
                                        </div>
                                    </div>
                                    <button style={{
                                        background: 'linear-gradient(45deg, #ffa502, #ff7675)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        color: '#ffffff',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        width: '100%'
                                    }}>
                                        Trade GOV →
                                    </button>
                                </div>

                                {/* FAQ Card */}
                                <div
                                    onClick={() => router.push('/faq')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '40px', 
                                        marginBottom: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
                                        ❓
                                        <span style={{ fontSize: '24px', fontWeight: '700' }}>Help Center</span>
                                    </div>
                                    <p style={{ 
                                        color: 'rgba(255,255,255,0.8)', 
                                        marginBottom: '20px',
                                        fontSize: '16px',
                                        lineHeight: '1.5'
                                    }}>
                                        Get help with platform features and trading guides
                                    </p>
                                    <button style={{
                                        background: 'linear-gradient(45deg, #a55eea, #778beb)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        color: '#ffffff',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                        Get Help →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <style jsx>{`
                @keyframes float {
                    0% { transform: translate3d(0, 0, 0) rotate(0deg); }
                    25% { transform: translate3d(100px, -100px, 0) rotate(90deg); }
                    50% { transform: translate3d(-100px, -200px, 0) rotate(180deg); }
                    75% { transform: translate3d(-150px, -100px, 0) rotate(270deg); }
                    100% { transform: translate3d(0, 0, 0) rotate(360deg); }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Hover effects */
                div:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0, 212, 255, 0.3);
                }

                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                }

                input:focus {
                    border-color: #00d4ff !important;
                    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.2) !important;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}