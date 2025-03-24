<div align="center">

# 🔐 CursorGhost 🔐

[![Next.js](https://img.shields.io/badge/Next.js-13.4.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**Surveillance et analyse en temps réel des communications avec api2.cursor.sh**

<img src="public\images\001.PNG" alt="ProxyVault Banner" width="800px" />
<img src="public\images\002.PNG" alt="ProxyVault Banner" width="800px" />
<img src="public\images\003.PNG" alt="ProxyVault Banner" width="800px" />
<img src="public\images\004.PNG" alt="ProxyVault Banner" width="800px" />
<img src="public\images\005.PNG" alt="ProxyVault Banner" width="800px" />
<img src="public\images\006.PNG" alt="ProxyVault Banner" width="800px" />
<img src="public\images\007.PNG" alt="ProxyVault Banner" width="800px" />

_Un système complet de proxy et de visualisation avec interface techno-futuriste_

</div>

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🖥️ Captures d'écran](#️-captures-décran)
- [🚀 Installation](#-installation)
- [🔧 Utilisation](#-utilisation)
- [⚙️ Configuration](#️-configuration)
- [📂 Structure du projet](#-structure-du-projet)
- [📡 API du proxy](#-api-du-proxy)
- [❓ Dépannage](#-dépannage)
- [📝 Licence](#-licence)
- [🔮 Roadmap](#-roadmap)

---

## Vue d'ensemble

ProxyVault combine un **serveur proxy** qui intercepte les communications et une **interface web moderne** avec un design techno-futuriste qui permet de visualiser et d'analyser le trafic réseau entre votre machine et `api2.cursor.sh`.

## ✨ Fonctionnalités

<table>
  <tr>
    <td>
      <h3>🔍 Interception</h3>
      Capture toutes les requêtes entre votre machine et <code>api2.cursor.sh</code>
    </td>
    <td>
      <h3>📊 Visualisation</h3>
      Affiche les flux de données entrants et sortants avec des animations
    </td>
  </tr>
  <tr>
    <td>
      <h3>📝 Journalisation</h3>
      Enregistre les méthodes, URLs, tailles et statuts des requêtes
    </td>
    <td>
      <h3>📈 Statistiques</h3>
      Compteurs de requêtes entrantes et sortantes
    </td>
  </tr>
  <tr>
    <td>
      <h3>🎨 Interface</h3>
      Tableau de bord avec code couleur (vert pour entrantes, rouge pour sortantes)
    </td>
    <td>
      <h3>🛡️ Sécurité</h3>
      Support HTTPS avec certificats personnalisés
    </td>
  </tr>
</table>

## 🖥️ Captures d'écran

<div align="center">
  <img src="https://via.placeholder.com/800x450/0d1117/0d7fff?text=Network+Monitor" alt="Network Monitor" width="400px" />
  <img src="https://via.placeholder.com/800x450/0d1117/0d7fff?text=Security+Visualization" alt="Security Visualization" width="400px" />
</div>

## 🏗️ Architecture

L'application est divisée en plusieurs sections complémentaires:

- **🧭 Navigation** - Accès facile à toutes les sections
- **📡 Moniteur réseau** - Visualisation des communications en temps réel
- **🔎 Détails des requêtes** - Inspection approfondie du contenu des requêtes
- **🔒 Section sécurité** - Visualisation des aspects sécuritaires avec motifs hexagonaux
- **📚 Documentation** - Liens vers les ressources et la documentation
- **📊 Statistiques** - Affichage des métriques de communication

## 🚀 Installation

### Prérequis

- Node.js 14.x ou supérieur
- npm ou yarn

### Étapes d'installation

1. Clonez ce dépôt

```bash
git clone [repository-url]
cd proxyvault
```

2. Installez les dépendances

```bash
npm install
# ou
yarn install
```

## 🔧 Utilisation

### Démarrer le système complet

```bash
npm run dev:all
```

Cela lancera :
- ✅ Le serveur proxy sur http://localhost:7778
- ✅ L'application Next.js sur http://localhost:7777

### Démarrer les composants séparément

```bash
# Démarrer uniquement le serveur proxy
npm run proxy

# Dans un autre terminal, démarrer l'application Next.js
npm run dev
```

### Autres commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev:7777` | Démarrer avec le script bat personnalisé (Windows) |
| `npm run clean` | Nettoyer et redémarrer (Windows) |
| `npm run build` | Build de production |
| `npm run start` | Démarrer en mode production |

## ⚙️ Configuration

### Option 1: Modifier les paramètres réseau de Cursor

Si Cursor permet de configurer un proxy HTTP, vous pouvez définir :
- **Adresse du proxy**: `localhost`
- **Port du proxy**: `7778`

### Option 2: Utiliser un outil d'interception de trafic

Vous pouvez utiliser des outils comme [Fiddler](https://www.telerik.com/fiddler) ou [Charles Proxy](https://www.charlesproxy.com/) pour intercepter et rediriger le trafic de `api2.cursor.sh` vers `localhost:7778`.

### Option 3: Modifier le fichier hosts

1. Ouvrez votre fichier hosts en tant qu'administrateur :
   - **Windows**: `C:\Windows\System32\drivers\etc\hosts`
   - **macOS/Linux**: `/etc/hosts`

2. Ajoutez la ligne suivante :
   ```
   127.0.0.1 api2.cursor.sh
   ```

3. Assurez-vous que votre proxy écoute sur le port 443 (nécessite des privilèges administrateur)

## 📂 Structure du projet

```
proxyvault/
├── proxy-server.js    # Serveur proxy interceptant les communications
├── start.js           # Script pour démarrer proxy + app Next.js
├── components/        # Composants React
│   ├── NetworkMonitorSection.js  # Visualisation temps réel
│   ├── SecuritySection.js        # Visualisation aspects sécurité
│   └── RequestContentSection.js  # Détails des requêtes
├── pages/             # Pages de l'application Next.js
├── styles/            # Styles CSS
├── public/            # Ressources statiques
└── cert/              # Certificats pour le support HTTPS
```

## 🛠️ Technologies utilisées

<table>
  <tr>
    <td align="center"><img src="https://cdn.worldvectorlogo.com/logos/next-js.svg" width="40px" /><br/>Next.js</td>
    <td align="center"><img src="https://cdn.worldvectorlogo.com/logos/express-109.svg" width="40px" /><br/>Express</td>
    <td align="center"><img src="https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg" width="40px" /><br/>Tailwind CSS</td>
  </tr>
  <tr>
    <td align="center"><img src="https://cdn.worldvectorlogo.com/logos/framer-motion.svg" width="40px" /><br/>Framer Motion</td>
    <td align="center"><img src="https://cdn.worldvectorlogo.com/logos/react-2.svg" width="40px" /><br/>React</td>
    <td align="center"><img src="https://cdn.worldvectorlogo.com/logos/nodejs-icon.svg" width="40px" /><br/>Node.js</td>
  </tr>
</table>

## 📡 API du proxy

Le serveur proxy expose les endpoints suivants :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/logs` | GET | Récupère la liste des dernières requêtes interceptées |
| `/stats` | GET | Récupère les statistiques des requêtes (entrantes/sortantes) |

## ❓ Dépannage

<details>
<summary><strong>Le tableau de bord n'affiche pas de données</strong></summary>

1. Assurez-vous que le serveur proxy est en cours d'exécution (`npm run proxy`)
2. Vérifiez que vous pouvez accéder à http://localhost:7778/logs dans votre navigateur
3. Si aucune requête n'est interceptée, le système génère automatiquement des données de test
</details>

<details>
<summary><strong>Erreurs CORS</strong></summary>

Si vous rencontrez des erreurs CORS, assurez-vous que le serveur proxy est configuré pour autoriser les requêtes depuis l'origine de votre application Next.js.
</details>

<details>
<summary><strong>Ports déjà utilisés</strong></summary>

Utilisez le script `killPort.js` pour libérer les ports nécessaires :
```bash
node killPort.js
```
</details>

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE).

## 🔮 Roadmap

### 🎨 Interface utilisateur
- 🔍 **Filtrage avancé** - Filtrer les requêtes par méthode, statut, URL
- 📊 **Visualisations d3.js** - Graphiques sophistiqués pour l'analyse des données
- 🌓 **Mode sombre/clair** - Thèmes visuels adaptables

### 🚀 Fonctionnalités avancées
- ✏️ **Modification de requêtes** - Intercepter et modifier les requêtes avant envoi
- 🔔 **Système de notifications** - Alertes pour types de requêtes spécifiques
- 💾 **Persistance des données** - Stockage des logs en base de données
- 📤 **Exportation** - Format JSON/CSV pour analyse externe

### ⚡ Performance
- 🔄 **WebSockets** - Mises à jour en temps réel plus efficaces
- 🚀 **Optimisation** - Gestion améliorée des grandes quantités de données
- 🔒 **Sécurité renforcée** - Chiffrement avancé des communications

---

<div align="center">

**[⬆ Retour en haut](#-proxyvault-)**

</div> 