# Historique Des Commits

Cette note documente les commits importants du projet MineralChain avec les fichiers touchés et les fonctionnalités apportées.

## Jalons Principaux

| Commit | Date | Message | Fichiers principaux | Fonctionnalités apportées |
|---|---|---|---|---|
| `00a357e0` | 2026-07-15 | `Add commit history documentation` | `COMMITS.md` | Première version de la documentation d’historique des commits. |
| `6a4c476d` | 2026-07-15 | `Polish MineralChain presentation and stability` | `README.md`, `backend-minier/README.md`, `backend-minier/routes/auth.py`, `backend-minier/routes/blockchain.py`, `backend-minier/utils/blockchain_config.py`, `mineralchain/README.md`, `mineralchain-mobile/README.md`, `mineralchain-mobile/src/services/api/client.js`, `mineralchain-mobile/src/services/api/blockchainService.js`, `mineralchain-mobile/src/viewmodels/useAuthViewModel.js`, `mineralchain-mobile/src/views/screens/AdminTransactionsScreen.js`, `mineralchain/src/config/blockchain.js`, `mineralchain-mobile/.env.example`, `modele_ia_minier/modeles/fraud_threshold_config.json` | Nettoyage de la présentation du dépôt, homogénéisation des README, ajout de fichiers d’environnement exemples, stabilisation du backend, amélioration du client réseau mobile, alignement du seuil de fraude à `0,30`. |
| `bc900dee` | 2026-07-08 | `Set fraud threshold default to 0.3` | `backend-minier/models/load_models.py` | Mise à jour du seuil de fraude par défaut utilisé au chargement des modèles. |
| `4e35743e` | 2026-06-09 | `Integrate IA models with backend loader` | `backend-minier/models/load_models.py`, `backend-minier/requirements.txt`, `modele_ia_minier/dataset_minier.csv`, `modele_ia_minier/modeles/*.pkl`, `modele_ia_minier/rapports/*.csv`, `modele_ia_minier/visualisations/*.png` | Connexion des modèles IA au backend, ajout du dataset d’entraînement, génération des rapports et des matrices de confusion, intégration des classifieurs et du prétraitement. |
| `8e8e9a4c` | 2026-06-01 | `Improve project README documentation` | `README.md`, `mineralchain/README.md`, `mineralchain-mobile/README.md` | Réécriture de la documentation principale et des guides web/mobile pour mieux expliquer l’installation, l’usage et les parcours métier. |
| `cf566f89` | 2026-06-01 | `Add camera QR scanning workflows` | `mineralchain-mobile/package.json`, `mineralchain-mobile/src/navigation/routes.js`, `mineralchain-mobile/src/views/AppView.js`, `mineralchain-mobile/src/views/components/DrawerMenu.js`, `mineralchain-mobile/src/views/screens/TransporterMenuScreen.js`, `mineralchain-mobile/src/views/screens/TransporterScannerScreen.js`, `mineralchain/package.json`, `mineralchain/src/contexts/i18nContext.jsx`, `mineralchain/src/pages/regulator/RegulatorAnalysisPage.jsx`, `mineralchain/src/pages/transporter/TransporterPages.jsx` | Ajout du scan QR sur mobile et renforcement des parcours QR côté web pour transporteurs et régulateurs. |
| `fd426069` | 2026-06-01 | `Improve web auth retry and mobile reload` | `mineralchain-mobile/src/views/components/TopBar.js`, `mineralchain-mobile/src/views/screens/DashboardScreen.js`, `mineralchain/src/App.js`, `mineralchain/src/services/api.js` | Amélioration de la reconnexion web, meilleur comportement de rechargement mobile et gestion plus robuste des retours API. |
| `009fb531` | 2026-05-29 | `Certify lots after regulator lab validation` | `backend-minier/routes/validate.py`, `mineralchain/src/pages/regulator/RegulatorAnalysisPage.jsx`, `mineralchain/src/services/api.js` | Mise en place de la certification après validation DGMR du fichier de laboratoire. |
| `286f09e4` | 2026-05-29 | `Require regulator lab file for double analysis` | `backend-minier/routes/validate.py`, `mineralchain-mobile/src/services/api/client.js`, `mineralchain-mobile/src/viewmodels/useAuthViewModel.js`, `mineralchain-mobile/src/viewmodels/useDashboardViewModel.js`, `mineralchain-mobile/src/views/screens/RegulatorAnalysisScreen.js`, `mineralchain/build/sample_lab_results_dgmr.xlsx`, `mineralchain/src/pages/regulator/RegulatorAnalysisPage.jsx` | Renforcement du double contrôle avec import du fichier labo DGMR obligatoire avant validation. |
| `84f3d06d` | 2026-05-29 | `Allow any regulator lab file import` | `backend-minier/routes/validate.py`, `mineralchain-mobile/src/views/screens/RegulatorAnalysisScreen.js`, `mineralchain/src/pages/regulator/RegulatorAnalysisPage.jsx` | Assouplissement du contrôle d’import pour accepter le flux attendu côté régulateur. |
| `0887ab32` | 2026-06-21 | `.` | `mineralchain-mobile/src/models/BlockchainTransaction.js`, `mineralchain-mobile/src/models/UserSession.js`, `mineralchain-mobile/src/navigation/routes.js`, `mineralchain-mobile/src/services/api/blockchainService.js`, `mineralchain-mobile/src/viewmodels/useAuthViewModel.js`, `mineralchain-mobile/src/views/AppView.js`, `mineralchain-mobile/src/views/screens/AdminMenuScreen.js`, `mineralchain-mobile/src/views/screens/AdminTransactionsScreen.js`, `mineralchain-mobile/src/views/screens/LoginScreen.js` | Ajout du journal des transactions blockchain dans l’application mobile et amélioration du parcours d’authentification. |

## Commits Techniques Ou De Contrôle

Ces commits existent dans l’historique, mais ils servent surtout de jalons intermédiaires et portent un message non exploitable pour une documentation publique :

- `bc64faa0`
- `638577fe`

## Lecture Recommandée

Pour présenter le projet, l’ordre le plus lisible est :

1. certification et validation DGMR
2. scan QR web et mobile
3. intégration des modèles IA
4. stabilisation et nettoyage de présentation
