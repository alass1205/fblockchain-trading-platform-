#!/bin/bash

# Trouver les lignes de début et fin de la fonction execute-trade
START_LINE=$(grep -n 'app\.post("/api/execute-trade"' server.js | head -1 | cut -d: -f1)
END_LINE=$(awk -v start="$START_LINE" 'NR >= start && /^});$/ {print NR; exit}' server.js)

echo "🔍 Fonction trouvée ligne $START_LINE à $END_LINE"

# Créer un fichier temporaire
head -n $((START_LINE - 1)) server.js > temp_server.js
cat fix-execute-trade.txt >> temp_server.js
tail -n +$((END_LINE + 1)) server.js >> temp_server.js

# Remplacer le fichier original
mv temp_server.js server.js
echo "✅ Fonction execute-trade mise à jour"
