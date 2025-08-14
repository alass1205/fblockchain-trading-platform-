// 🧪 TEST RAPIDE DU TRADING

const addresses = {
    aya: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',    // A déjà 200 TRG, 10 CLV
    beatriz: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'  // A déjà 150 TRG, 20 ROO
};

async function testTrade() {
    console.log('🧪 Test du système de trading...');
    
    try {
        // 1. Ordre de vente CLV par Aya
        const sellOrder = await fetch('http://localhost:3001/api/create-order-with-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: addresses.aya,
                assetSymbol: 'CLV',
                orderType: 'sell',
                quantity: 1,
                price: 10
            })
        });
        
        const sellResult = await sellOrder.json();
        console.log('📝 Ordre de vente:', sellResult);
        
        // 2. Ordre d'achat CLV par Beatriz
        const buyOrder = await fetch('http://localhost:3001/api/create-order-with-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: addresses.beatriz,
                assetSymbol: 'CLV',
                orderType: 'buy',
                quantity: 1,
                price: 10
            })
        });
        
        const buyResult = await buyOrder.json();
        console.log('📝 Ordre d\'achat:', buyResult);
        
        // 3. Vérifier les balances après
        const ayaBalances = await fetch(`http://localhost:3001/api/balances/${addresses.aya}`);
        const beatrizBalances = await fetch(`http://localhost:3001/api/balances/${addresses.beatriz}`);
        
        console.log('💰 Balances Aya:', await ayaBalances.json());
        console.log('💰 Balances Beatriz:', await beatrizBalances.json());
        
    } catch (error) {
        console.error('❌ Erreur test:', error);
    }
}

testTrade();
