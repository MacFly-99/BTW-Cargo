# 🚢 BTW-Cargo

> Plateforme de gestion logistique maritime et jumeau numérique (Digital Twin) d'un port à conteneurs.

🎓 **Projet de formation — Session 2026**

---

## 📋 Sommaire

1. 🎯 [Présentation](#-présentation)
2. ✨ [Fonctionnalités](#-fonctionnalités)
3. 🛠️ [Stack technique](#️-stack-technique)
4. 🏗️ [Architecture](#️-architecture)
5. 🚀 [Installation locale](#-installation-locale)
6. 🌐 [Déploiement](#-déploiement)
7. 🧪 [Tests](#-tests)
8. 🔒 [Sécurité](#-sécurité)
9. 📁 [Structure du projet](#-structure-du-projet)
10. 👤 [Auteur](#-auteur)

---

## 🎯 Présentation

**BTW-Cargo** est une plateforme de gestion logistique maritime conçue comme un **jumeau numérique (Digital Twin)** d'un port à conteneurs.

Elle a été développée dans le cadre d'un projet de formation avec pour objectifs :

- ✅ Mettre en œuvre une **architecture full-stack moderne** (Next.js + Prisma + PostgreSQL).
- ✅ Démontrer la maîtrise des **architectures temps réel** (CRON, simulation).
- ✅ Assurer une **sécurité de niveau production** (JWT, RBAC, rate limiting, security headers).

---

## ✨ Fonctionnalités

### 👤 Visiteur (non authentifié)

- Consulter la page d'accueil
- Se connecter à l'application

### 👥 Utilisateur connecté (ROLE_USER)

- Accéder au **Dashboard Opérateur**
- Valider les chargements de conteneurs
- Consulter la **messagerie** du Tour de Contrôle
- Gérer son profil et son mot de passe

### 🛡️ Administrateur (ROLE_ADMIN)

- Accéder au **Dashboard Admin** avec statistiques en temps réel
- Gérer la **flotte de navires** (CRUD complet)
- Gérer l'**inventaire des conteneurs** (70 000+)
- Gérer les **utilisateurs** (création, suppression)
- Diffuser des **messages** via le Tour de Contrôle
- Superviser la **simulation** du port

Interface **100% responsive** (adaptée aux mobiles et tablettes).

---

## 🛠️ Stack technique

### ⚙️ Backend

| Technologie | Version | Rôle                          |
| ----------- | ------- | ----------------------------- |
| Next.js     | 15      | Framework full-stack (App Router) |
| TypeScript  | 5       | Langage                       |
| PostgreSQL  | 16      | Base de données               |
| Prisma      | 7       | ORM                           |
| Node-Cron   | 3.x     | Simulation temps réel         |
| JWT (jose)  | 6.x     | Authentification              |
| Bcrypt      | 2.x     | Hachage des mots de passe     |
| Zod         | 3.x     | Validation des données        |

### 🎨 Frontend

| Technologie  | Version | Rôle                  |
| ------------ | ------- | --------------------- |
| React        | 19      | Bibliothèque UI       |
| Tailwind CSS | 4.x     | Framework CSS         |
| Lucide React | 0.x     | Icônes                |
| Sonner       | 1.x     | Notifications (Toasts) |

### 🧰 Outils

- **Git + GitHub** : versioning
- **Docker** : conteneur PostgreSQL
- **Prisma Studio** : exploration BDD

---

## 🏗️ Architecture

L'application suit une **architecture full-stack découplée** :

### 🔄 Flux utilisateur

1. **Utilisateur** (navigateur web)
2. ↓ HTTPS
3. **Next.js** héberge le frontend et le backend (Server Actions + API Routes)
4. ↓ Requêtes SQL
5. **PostgreSQL** (Docker) pour les données métier
6. ↓ CRON
7. **Node-Cron** simule la vie du port en arrière-plan

### 📦 Composants et responsabilités

| Composant                | Rôle                                                   |
| ------------------------ | ------------------------------------------------------ |
| 🎨 **Next.js (Frontend)** | Interface utilisateur, routage App Router              |
| 🐘 **Next.js (Backend)**  | Server Actions, API Routes, authentification JWT       |
| 🗄️ **PostgreSQL (Docker)** | Données métier (users, ships, containers, broadcasts) |
| ⏰ **Node-Cron**          | Simulation logistique (navires, camions, trains)       |

### 💡 Principes

- **Full-stack Next.js** : frontend et backend dans le même projet.
- **Server Actions** : communication sécurisée entre client et serveur.
- **Prisma** : ORM type-safe pour PostgreSQL.
- **CRON** : simulation autonome du port.

---

## 🚀 Installation locale

### 📋 Prérequis

- Node.js 18.17+
- pnpm 8+
- Docker Desktop
- Git

### 🔧 Étapes

#### 1️⃣ Cloner le dépôt

```bash
git clone https://github.com/votre-username/btw-cargo.git
cd btw-cargo
```

#### 2️⃣ Installer les dépendances

```bash
pnpm install
```

#### 3️⃣ Lancer PostgreSQL avec Docker

```bash
docker run --name btw-cargo-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=btw_cargo \
  -p 5432:5432 \
  -d postgres:16
```

#### 4️⃣ Créer le fichier `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/btw_cargo?schema=public"
JWT_SECRET="votre_secret_tres_long"
ADMIN_EMAIL="admin@btwcargo.com"
ADMIN_PASSWORD="votre_mot_de_passe_admin"
OPERATOR_EMAIL="operateur@btwcargo.com"
OPERATOR_PASSWORD="votre_mot_de_passe_user"
```

#### 5️⃣ Lancer l'application

```bash
pnpm dev
```

### 🌐 Accès

- **Application** : <http://localhost:3000>

### 🔑 Comptes de test

| Rôle             | Email                  | Mot de passe              |
| ---------------- | ---------------------- | ------------------------- |
| 👑 Administrateur | admin@btwcargo.com     | votre_mot_de_passe_admin  |
| 👤 Opérateur      | operateur@btwcargo.com | votre_mot_de_passe_user   |

---

## 🌐 Déploiement

### 📦 Composants en production

| Composant           | Plateforme | URL        |
| ------------------- | ---------- | ------------------------------ |
| 🎨 Application      | Vercel     | https://btw-cargo.vercel.app/  |
| 🗄️ Base de données  | Neon.tech  |                                |

### ⚙️ Procédure simplifiée

1. **Frontend/Backend** : déployé sur Vercel.
2. **Base de données** : provisionnée sur Neon.tech (PostgreSQL Serverless).
3. **CRON** : configuré via Cron-Job.org.

---

## 🧪 Tests

L'application dispose d'une suite de tests automatisés pour garantir la fiabilité du moteur de simulation et la sécurité des accès.

### 🔬 Tests Unitaires (Vitest)

Les fonctions pures de la logique métier (générateurs de codes, profils des navires) sont testées.

**Résultat :** 5 tests validés.

### 🗄️ Tests d'Intégration (Vitest + Prisma)

La création de conteneurs est testée sur une base de données isolée (`btw_cargo_test`) pour ne pas polluer la base de développement.

**Résultat :** 1 test validé.

### 🔐 Tests de Sécurité (RBAC & Rate Limiting)

Les Server Actions sont testées pour s'assurer que :

- Un **Opérateur** ne peut pas effectuer d'actions Admin (3 tests).
- Un **Admin** a bien les droits nécessaires (2 tests).
- Le **Rate Limiting** bloque après 5 tentatives de connexion échouées (1 test).

**Résultat :** 6 tests validés.

### 📊 Rapport global

- **5 fichiers de test**
- **12 tests passés** (100% de réussite)
- **Durée :** ~760ms

---

## 🔒 Sécurité

### 🛡️ Mesures en place

- **Authentification JWT** avec cookies HttpOnly.
- **RBAC** (Role-Based Access Control) : Admin / Opérateur.
- **Rate Limiting** sur le login (5 tentatives / minute).
- **Sanitization** des messages (anti-XSS).
- **Security Headers** : X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **Validation Zod** sur toutes les Server Actions.
- **Secrets isolés** : fichier `.env` exclu du dépôt Git.

---

## 📁 Structure du projet

```text
btw-cargo/
├── prisma/
│   └── schema.prisma             🗄️ Modèles (User, Ship, Container, Broadcast)
├── public/
│   ├── blue-container.jpg        🖼️ Images conteneurs (6 couleurs)
│   ├── Le_Titan.jpg              🖼️ Images navires (12 navires)
│   └── ...
├── simulation/
│   ├── logistics.ts              ⚙️ Constantes, helpers, générateurs
│   ├── shipOperations.ts         🚢 Arrivées, départs, chargements
│   ├── truckOperations.ts        🚚 Flux routiers (import/export)
│   ├── trainOperations.ts        🚂 Flux ferroviaires et urgences
│   ├── maintenance.ts            🔧 Rotation de maintenance
│   └── README.md
├── src/
│   ├── app/
│   │   ├── dashboard/            📊 Layout et pages protégées
│   │   │   ├── admin/            🛡️ Supervision + Tour de Contrôle
│   │   │   ├── containers/       📦 Inventaire + Détail
│   │   │   ├── ships/            🚢 Flotte + Détail
│   │   │   ├── users/            👥 Gestion des utilisateurs
│   │   │   ├── messages/         💬 Historique des messages
│   │   │   └── profile/          👤 Profil utilisateur
│   │   ├── login/                🔐 Page de connexion
│   │   ├── actions/              ⚡ Server Actions (auth, ships, containers, users, broadcast)
│   │   └── api/                  🔌 API Routes (admin-stats, add-test-container)
│   ├── components/               🧩 Composants réutilisables
│   │   ├── ContainerList.tsx
│   │   ├── ShipList.tsx
│   │   ├── UserManagement.tsx
│   │   ├── BroadcastBanner.tsx
│   │   ├── BroadcastForm.tsx
│   │   ├── CreateContainerModal.tsx
│   │   ├── CreateShipModal.tsx
│   │   ├── DeleteShipButton.tsx
│   │   ├── GlobalCapacityAlert.tsx
│   │   ├── Logo.tsx
│   │   └── ...
│   └── lib/                      🧰 Utilitaires (db, auth, constants)
├── cron.ts                       ⏰ Point d'entrée du CRON de simulation
├── seed.ts                       🌱 Script de remplissage initial
├── next.config.ts                ⚙️ Configuration Next.js
├── middleware.ts                 🛡️ Protection des routes
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

## 👤 Auteur

**🎓 Matteo Ventura**

- Projet d'entraînement — 2026
- 🐙 GitHub : [MacFly-99](https://github.com/MacFly-99)
- 🌐 Application : [BTW-Cargo](https://btw-cargo.vercel.app)

---

## 📄 Licence

Projet propriétaire. Usage pédagogique uniquement.

Je tiens à remercier "Pixabay", "Unsplash" et "Pexels" pour les photos/images fournies ainsi que :

- 'kliempictures', 'vidar-nordli-mathisen', 'venti-views', 'ian-taylor', 'thomas_g', 'ellen26', 'fotoart-treu', 'peterkraayvanger', 'bobrov69', 'kelly' et 'robertkso' concernant les images/photos pour les navires,
- 'jan-van-der-wolf', '2427999-belgium', 'whoOne', 'rattakarn-port', 'igor-passchier' et 'declan-sun' pour les images/photos pour les conteneurs.