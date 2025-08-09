import Link from 'next/link';

export default function FAQ() {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ borderBottom: '1px solid #ccc', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1>❓ FAQ - Questions Fréquentes</h1>
                <Link href="/" style={{ color: '#007bff', textDecoration: 'none' }}>← Retour à l'accueil</Link>
            </header>

            <div style={{ maxWidth: '800px' }}>
                <h2>Comment utiliser la plateforme</h2>

                <div style={{ marginBottom: '30px' }}>
                    <h3>🔗 1. Connexion du wallet</h3>
                    <p>Pour utiliser la plateforme, vous devez d'abord connecter votre wallet MetaMask:</p>
                    <ol>
                        <li>Installez l'extension MetaMask dans votre navigateur</li>
                        <li>Créez ou importez un wallet</li>
                        <li>Cliquez sur "Connecter MetaMask" sur la page d'accueil</li>
                        <li>Autorisez la connexion dans MetaMask</li>
                    </ol>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>📝 2. Inscription</h3>
                    <p>Lors de votre première connexion, vous devrez fournir:</p>
                    <ul>
                        <li>Votre nom légal</li>
                        <li>Une photo de votre passeport (pour référence future)</li>
                    </ul>
                    <p>Ces informations sont stockées de manière sécurisée et ne sont utilisées qu'à des fins d'audit.</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>💰 3. Actifs disponibles</h3>
                    <p>La plateforme propose trois types d'instruments financiers:</p>
                    <ul>
                        <li><strong>TRG (Triangle)</strong>: Stablecoin utilisé comme monnaie de base</li>
                        <li><strong>CLV (Clove Company)</strong>: Actions avec système de dividendes</li>
                        <li><strong>ROO (Rooibos Limited)</strong>: Actions avec système de dividendes</li>
                        <li><strong>GOV (Government Bonds)</strong>: Obligations gouvernementales à 1 an, 10% d'intérêt</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>📊 4. Consulter votre portfolio</h3>
                    <p>La page Portfolio vous permet de:</p>
                    <ul>
                        <li>Voir vos balances pour chaque actif</li>
                        <li>Distinguer les actifs sur la plateforme vs dans votre wallet</li>
                        <li>Retirer des actifs de la plateforme vers votre wallet</li>
                        <li>Visualiser la répartition de votre portfolio</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>📈 5. Trading</h3>
                    <p>Pour trader un actif:</p>
                    <ol>
                        <li>Allez sur la page de l'actif (CLV, ROO, ou GOV)</li>
                        <li>Consultez l'historique des prix et le carnet d'ordres</li>
                        <li>Créez un ordre d'achat ou de vente avec la quantité et le prix souhaités</li>
                        <li>Ou achetez directement au prix du marché</li>
                    </ol>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>🔒 6. Sécurité</h3>
                    <p>Vos actifs sont protégés par:</p>
                    <ul>
                        <li>Un système de vault multi-signature</li>
                        <li>L'autorisation de la plateforme requise pour les retraits</li>
                        <li>La vérification des transactions sur la blockchain</li>
                        <li>Aucune garde complète - vous gardez le contrôle de vos clés privées</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>💸 7. Dépôts et retraits</h3>
                    <p>Pour déposer des actifs:</p>
                    <ol>
                        <li>Transférez vos tokens vers l'adresse du vault de la plateforme</li>
                        <li>Utilisez la fonction "Monitor deposits" pour vérifier la transaction</li>
                    </ol>
                    <p>Pour retirer des actifs:</p>
                    <ol>
                        <li>Allez sur votre page Portfolio</li>
                        <li>Cliquez sur le bouton "Retirer" à côté de l'actif souhaité</li>
                        <li>Confirmez la transaction dans MetaMask</li>
                    </ol>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>🎯 8. Prix par défaut</h3>
                    <p>Les prix de base sont:</p>
                    <ul>
                        <li>CLV: 10 TRG par action</li>
                        <li>ROO: 10 TRG par action</li>
                        <li>GOV: 200 TRG par obligation</li>
                    </ul>
                    <p>Ces prix évoluent selon l'offre et la demande sur la plateforme.</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>⚠️ 9. Avertissements</h3>
                    <ul>
                        <li>Cette plateforme fonctionne sur un réseau de test</li>
                        <li>Ne jamais envoyer de vrais fonds sur ce réseau</li>
                        <li>Les clés privées utilisées sont publiques</li>
                        <li>À des fins éducatives et de démonstration uniquement</li>
                    </ul>
                </div>

                <div style={{ backgroundColor: '#d1ecf1', padding: '15px', borderRadius: '5px' }}>
                    <h3>🆘 Besoin d'aide?</h3>
                    <p>Si vous rencontrez des problèmes:</p>
                    <ol>
                        <li>Vérifiez que MetaMask est connecté au bon réseau</li>
                        <li>Assurez-vous d'avoir suffisamment de TRG pour les frais de transaction</li>
                        <li>Rechargez la page si une transaction semble bloquée</li>
                        <li>Consultez la console du navigateur pour les erreurs techniques</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
