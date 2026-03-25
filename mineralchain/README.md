# MineralChain — Interface React
## Système de Certification des Minerais Stratégiques · Katanga, RDC

---

## 🚀 Installation & Démarrage

### Étape 1 — Extraire le projet
```bash
unzip mineralchain.zip
cd mineralchain
```

### Étape 2 — Installer les dépendances
```bash
npm install
```

Si des conflits apparaissent :
```bash
npm install --legacy-peer-deps
```

### Étape 3 — Lancer l'application
```bash
npm start
```
→ Ouvre automatiquement **http://localhost:3000**

---

## 📦 Dépendances installées

| Package | Usage |
|---------|-------|
| `react-router-dom` | Navigation entre pages |
| `recharts` | Graphiques (pie, bar, line) |
| `react-hook-form` | Formulaires avec validation |
| `react-qr-code` | Génération QR Code dans les certificats |
| `jspdf` | Export PDF des certificats |
| `html2canvas` | Capture du certificat pour PDF |
| `axios` | Appels API Flask |

---

## 🏗️ Architecture du Projet

```
src/
├── App.js                              ← Routing principal
├── index.js                            ← Point d'entrée
├── styles/global.css                   ← Thème "Mineral Premium Dark"
│
├── contexts/
│   └── AppContext.jsx                  ← État global (lots, tokens, profils)
│
├── services/
│   └── api.js                          ← Appels API Flask + simulation locale
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx                 ← Navigation latérale (3 profils)
│   │   └── Header.jsx                  ← En-tête + notifications toast
│   └── common/
│       ├── UI.jsx                      ← Composants réutilisables
│       └── Certificate.jsx             ← Certificat NFT + QR + PDF
│
└── pages/
    ├── producer/
    │   ├── NewLotPage.jsx              ← Formulaire analyse + résultats IA
    │   ├── LotDetailPage.jsx           ← Détail lot + transfert vers usine
    │   └── ProducerPages.jsx           ← Dashboard, Mes Lots, Certificats
    ├── regulator/
    │   └── RegulatorPages.jsx          ← Supervision, Alertes, Vérification
    └── transporter/
        └── TransporterPages.jsx        ← Lots assignés, Scanner QR, Historique
```

---

## 👤 Les 3 Profils Utilisateurs

### ⛏ Producteur (KAMOA / KCC)
| Route | Page |
|-------|------|
| `/producer` | Dashboard |
| `/producer/new-lot` | **Soumettre un nouveau lot** |
| `/producer/my-lots` | Mes lots (filtres + export CSV) |
| `/producer/lot/:id` | Détail lot + **Transférer vers usine** |
| `/producer/certificates` | Galerie certificats NFT |

### ⚖ Régulateur (DGMR · CAMI · CEEC)
| Route | Page |
|-------|------|
| `/regulator` | Supervision globale |
| `/regulator/lots` | Tous les lots (vue complète) |
| `/regulator/alerts` | ⚠ Alertes fraude |
| `/regulator/verify` | Vérification certificat |

### 🚛 Transporteur
| Route | Page |
|-------|------|
| `/transporter` | Dashboard |
| `/transporter/assigned` | Lots certifiés à transporter |
| `/transporter/scan` | Scanner QR Code |
| `/transporter/history` | Historique livraisons + traçabilité |

---

## ✅ Fonctionnalités Implémentées

### Analyse & Certification
- ✅ Formulaire complet (10 features IA)
- ✅ Validation des champs obligatoires
- ✅ Génération automatique du Lot ID
- ✅ **Appel API Flask réel** (`POST /api/analyze`, `POST /api/analyze-and-certify`)
- ✅ **Simulation locale automatique** si API indisponible
- ✅ Jauge de confiance animée
- ✅ Badges statut / type colorés

### Certificat NFT
- ✅ **QR Code fonctionnel** encodant l'URL de vérification
- ✅ **Téléchargement PDF** du certificat (html2canvas + jsPDF)
- ✅ **Vérification blockchain** (appel API `/token/:id`)
- ✅ Modal de certificat complet
- ✅ Galerie de certificats

### Traçabilité complète
- ✅ Timeline visuelle : Extraction → Analyse → NFT → Transport → Livraison
- ✅ **Transfert vers usine** (modal avec destination)
- ✅ Mise à jour statut transport
- ✅ Confirmation de livraison

### Interface Transporteur
- ✅ Vue des lots certifiés à prendre
- ✅ Saisie destination + démarrage transport
- ✅ Confirmation livraison
- ✅ Scanner QR (simulation + saisie manuelle)
- ✅ Historique complet avec traçabilité

### Données
- ✅ **Aucune donnée de test pré-chargée** — commence vide
- ✅ Tous vos vrais tests sont sauvegardés en mémoire
- ✅ Export CSV des lots filtrés

---

## 🔌 Configuration API Flask

Dans `src/services/api.js` :
```javascript
baseURL: 'http://localhost:5000/api'
```

Le système bascule **automatiquement** en mode simulation si Flask n'est pas démarré.

**Smart contract :**
```
Adresse : 0xE7A51a1136968A33fE06bAc07B5794757E349Fbb
Réseau  : Ganache (localhost:7545)
Standard: ERC-721
```

---

## 🎨 Design System "Mineral Premium Dark"

- **Polices** : Cormorant Garamond (titres élégants) + Outfit (corps) + JetBrains Mono (hash)
- **Couleurs** : Fond profond `#050709` + Or `#c9a84c` + Cuivre `#b87333` + Cobalt `#3a7bd5`
- **Animations** : fadeUp, countUp, glowPulse, scanLine, drawCircle (jauge)
- **Composants** : Cards, Badges, Gauge, Toast, Timeline, Table, Modal

---

## 🛠️ Commandes Utiles

```bash
npm start          # Démarrage dev (port 3000)
npm run build      # Build production dans /build
```

---

## 🌐 Système Bilingue / Bilingual System

Le système bilingue FR/EN est intégré nativement — aucune dépendance externe requise.

### Comment ça marche

- **Sélecteur de langue** dans l'en-tête (🇫🇷 FR / 🇬🇧 EN)
- **~300 clés de traduction** couvrent 100% de l'interface
- **Persistance automatique** via `localStorage` — le choix est mémorisé
- **Interpolation** supportée : `t('key', { n: 5 })` → `"5 lots trouvés"`

### Ajouter une langue

Dans `src/contexts/i18nContext.jsx`, dupliquez le bloc `en` et changez les valeurs :

```js
const TRANSLATIONS = {
  fr: { 'app.name': 'MineralChain', ... },
  en: { 'app.name': 'MineralChain', ... },
  // Ajouter :
  sw: { 'app.name': 'MineralChain', 'app.region': 'KATANGA · DRC', ... },
};
```

Puis dans `LanguageSwitcher.jsx` :
```js
const langs = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'sw', flag: '🇹🇿', label: 'SW' }, // Swahili
];
```
