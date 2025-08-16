import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export const useWebSocket = (userAddress) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [balances, setBalances] = useState({});
    const [vaultBalances, setVaultBalances] = useState({});
    const [orders, setOrders] = useState([]);
    const [trades, setTrades] = useState([]);
    const [orderbook, setOrderbook] = useState({ buyOrders: [], sellOrders: [] });

    useEffect(() => {
        if (!userAddress) return;

        console.log('🔌 Connexion WebSocket pour:', userAddress);

        const newSocket = io('http://localhost:3001');

        newSocket.on('connect', () => {
            console.log('✅ WebSocket connecté:', newSocket.id);
            setIsConnected(true);
            newSocket.emit('authenticate', userAddress);
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 WebSocket déconnecté');
            setIsConnected(false);
        });

        newSocket.on('balances-update', (data) => {
            console.log('💰 Balances WebSocket:', data);
            setBalances(data.walletBalances || {});
            setVaultBalances(data.vaultBalances || {});
        });

        newSocket.on('orders-update', (newOrders) => {
            console.log('📋 Ordres WebSocket:', newOrders.length);
            setOrders(newOrders);
        });

        newSocket.on('trades-update', (newTrades) => {
            console.log('📈 Trades WebSocket:', newTrades.length);
            setTrades(newTrades);
        });

        newSocket.on('orderbook-update', (data) => {
            console.log('📊 Orderbook WebSocket:', data.symbol);
            setOrderbook(data.orderbook);
        });

        newSocket.on('trade-executed', (trade) => {
            console.log('🎯 Trade exécuté:', trade);
            setTrades(prevTrades => [trade, ...prevTrades]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [userAddress]);

    return {
        socket,
        isConnected,
        balances,
        vaultBalances,
        orders,
        trades,
        orderbook
    };
};
