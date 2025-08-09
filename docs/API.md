# Documentation API

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### 1. Test de connectivité

**GET** `/test`

Vérifie que l'API fonctionne et retourne les informations de configuration.

**Réponse :**
```json
{
  "message": "Backend API fonctionnel!",
  "blockchain": "http://127.0.0.1:8545",
  "contracts": {
    "TRG": "0x...",
    "CLV": "0x...",
    "ROO": "0x...",
    "GOV": "0x...",
    "VAULT": "0x..."
  }
}
```

### 2. Enregistrement utilisateur

**POST** `/register`

Enregistre un nouvel utilisateur avec ses informations KYC.

**Body (multipart/form-data) :**
- `walletAddress` (string) : Adresse Ethereum de l'utilisateur
- `legalName` (string) : Nom légal de l'utilisateur
- `passport` (file) : Photo du passeport

**Réponse :**
```json
{
  "success": true,
  "message": "Utilisateur enregistré avec succès",
  "userId": 1
}
```

### 3. Informations utilisateur

**GET** `/user/:address`

Récupère les informations d'un utilisateur par son adresse.

**Paramètres :**
- `address` : Adresse Ethereum de l'utilisateur

**Réponse :**
```json
{
  "id": 1,
  "wallet_address": "0x...",
  "legal_name": "John Doe",
  "passport_image": "filename.jpg",
  "created_at": "2023-08-09T16:30:00.000Z"
}
```

### 4. Liste des actifs

**GET** `/assets`

Retourne la liste de tous les actifs disponibles sur la plateforme.

**Réponse :**
```json
[
  {
    "id": 1,
    "symbol": "TRG",
    "name": "Triangle",
    "type": "stablecoin",
    "contract_address": "0x...",
    "current_price": 1.0
  },
  {
    "id": 2,
    "symbol": "CLV",
    "name": "Clove Company",
    "type": "share",
    "contract_address": "0x...",
    "current_price": 10.0
  }
]
```

### 5. Détails d'un actif

**GET** `/assets/:symbol`

Récupère les détails d'un actif spécifique avec son historique de prix.

**Paramètres :**
- `symbol` : Symbole de l'actif (TRG, CLV, ROO, GOV)

**Réponse :**
```json
{
  "id": 2,
  "symbol": "CLV",
  "name": "Clove Company",
  "type": "share",
  "contract_address": "0x...",
  "current_price": 10.0,
  "priceHistory": [
    {
      "price": 10.0,
      "timestamp": "2023-08-09T16:30:00.000Z"
    }
  ]
}
```

### 6. Créer un ordre

**POST** `/orders`

Crée un nouvel ordre d'achat ou de vente.

**Body (JSON) :**
```json
{
  "userAddress": "0x...",
  "assetSymbol": "CLV",
  "orderType": "buy",
  "quantity": 5.0,
  "price": 9.5
}
```

**Réponse :**
```json
{
  "success": true,
  "orderId": 1,
  "message": "Ordre créé avec succès"
}
```

### 7. Ordres d'un utilisateur

**GET** `/orders/:address`

Récupère tous les ordres d'un utilisateur.

**Paramètres :**
- `address` : Adresse Ethereum de l'utilisateur

**Réponse :**
```json
[
  {
    "id": 1,
    "user_address": "0x...",
    "asset_symbol": "CLV",
    "order_type": "buy",
    "quantity": 5.0,
    "price": 9.5,
    "status": "pending",
    "created_at": "2023-08-09T16:30:00.000Z"
  }
]
```

### 8. Carnet d'ordres

**GET** `/orderbook/:symbol`

Récupère le carnet d'ordres pour un actif spécifique.

**Paramètres :**
- `symbol` : Symbole de l'actif

**Réponse :**
```json
{
  "buyOrders": [
    {
      "id": 1,
      "user_address": "0x...",
      "asset_symbol": "CLV",
      "order_type": "buy",
      "quantity": 5.0,
      "price": 9.5,
      "status": "pending"
    }
  ],
  "sellOrders": [
    {
      "id": 2,
      "user_address": "0x...",
      "asset_symbol": "CLV",
      "order_type": "sell",
      "quantity": 3.0,
      "price": 10.5,
      "status": "pending"
    }
  ]
}
```

## Codes d'erreur

- **200** : Succès
- **400** : Requête malformée
- **404** : Ressource non trouvée
- **500** : Erreur serveur interne

## Exemples d'utilisation

### Créer un ordre d'achat
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "assetSymbol": "CLV",
    "orderType": "buy",
    "quantity": 10,
    "price": 9
  }'
```

### Récupérer les actifs
```bash
curl http://localhost:3001/api/assets
```

### Vérifier le carnet d'ordres
```bash
curl http://localhost:3001/api/orderbook/CLV
```