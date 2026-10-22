# ⚙️ Le Moteur de Simulation (Digital Twin)

Ce dossier contient le cœur logistique de **BTW-Cargo**. Il s'agit d'un moteur de simulation autonome conçu pour reproduire le fonctionnement réel d'un port à conteneurs.

Le moteur tourne en arrière-plan (via un CRON) et fait "vivre" le port en temps réel, indépendamment des actions des utilisateurs.

---

## 🧠 Concept du Digital Twin

L'objectif de ce moteur est de maintenir un équilibre dynamique (le port "respire") autour d'un taux de remplissage cible de **60%**.

Pour ce faire, il simule trois acteurs physiques et une contrainte de maintenance :
1. **Les Navires** (Import / Export)
2. **Les Camions** (Flux routier)
3. **Les Trains** (Flux ferroviaire massif)
4. **La Maintenance** (Rotation de la flotte)

---

## 📂 Architecture du moteur

Le moteur est découpé en plusieurs fichiers pour séparer les responsabilités (physique du port, flux, régulation).

| Fichier | Rôle principal |
| :--- | :--- |
| `logistics.ts` | Constantes globales, profils des navires, générateurs et helpers de BDD. |
| `shipOperations.ts` | Gestion du cycle de vie des navires (grues, chargement/déchargement, arrivées). |
| `truckOperations.ts` | Gestion des flux routiers (camions entrants et sortants) selon l'heure. |
| `trainOperations.ts` | Gestion des trains (arrivées/départs à horaires fixes et trains d'urgence). |
| `maintenance.ts` | Rotation calendaire pour mettre un navire en maintenance. |

---

## 🚢 Le cycle de vie d'un navire (`shipOperations.ts`)

Chaque navire suit un cycle réaliste basé sur son type (profil) :
- **En mer** : Il voyage pendant une durée moyenne définie.
- **Arrivée (Déchargement)** : Il accoste, et les grues vident sa cargaison vers le parc (le port se remplit).
- **Chargement** : Si le parc a du stock, les grues chargent des conteneurs à destination du navire.
- **Départ** : Dès qu'il est plein (ou après un temps maximum à quai), il repart en mer (vidant le port).

---

## 🚚 Les flux terrestres

### Les Camions (`truckOperations.ts`)
Le flux routier est bidirectionnel et suit le rythme d'une journée de travail :
- **Entrées** : Les camions déposent des conteneurs (export). Le flux est plus intense le matin (10h) et l'après-midi (15h), et ralentit la nuit.
- **Sorties** : Les camions viennent récupérer des conteneurs (import). Plus le parc est rempli, plus il y a de camions qui repartent avec des conteneurs (loi de séjour moyen : 1,5 jour).

### Les Trains (`trainOperations.ts`)
Les trains agissent comme des vannes de régulation massive :
- **Horaires fixes** : Des trains arrivent et partent à des heures précises (ex: 1h, 7h, 13h, 19h).
- **Train d'urgence** : Si le port dépasse le seuil critique de saturation, un train d'urgence est déclenché automatiquement pour évacuer massivement des conteneurs.

---

## ⚖️ La régulation automatique

Pour éviter que le port ne sature (ou ne se vide), le CRON ajuste les flux en continu :
- **Si le port se remplit trop (> 70%)** : Le train d'urgence se déclenche.
- **Si le port est saturé (> 92%)** : Les camions sont bloqués (le parc est fermé).
- **Si le port est trop vide (< 20%)** : Les grues arrêtent de charger (il n'y a plus rien à charger).

C'est cet équilibre constant qui donne l'impression que le port "respire" naturellement.

---

## 🔧 La maintenance (`maintenance.ts`)

Pour être réaliste, la flotte ne peut pas être disponible à 100% en permanence.
- Un calendrier autonome gère une **rotation de maintenance**.
- Tous les 2 mois environ, **un navire différent** est immobilisé pendant 10 jours.
- Un navire qui est à quai termine son escale et repart avant d'entrer en maintenance.

---

## ⏱️ Le CRON (Le chef d'orchestre)

Le fichier `cron.ts` (situé à la racine du projet) est le point d'entrée. Il s'exécute **toutes les 30 secondes** et réalise les étapes dans un ordre strict :
1. Vérification de la maintenance (1 fois par heure).
2. Comptage du stock actuel (taux de remplissage).
3. Simulation des opérations des navires.
4. Simulation des flux de camions.
5. Simulation des flux de trains.
6. Affichage du bilan dans la console (ex: `📊 62.45% | navires +20/-50 | camions +30/-20 | trains +0/-200`).

C'est ce fichier qui fait le lien entre tous les modules pour garantir qu'il n'y ait pas de conflit (comme un navire qui partirait alors qu'il est en train de charger).