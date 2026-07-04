# Importer sur GitHub et lancer dans Codespaces (depuis un Chromebook)

Ce guide part de ta situation : **un Chromebook, aucun Linux local, et le fichier
ZIP du projet**. À la fin, le projet tourne dans le navigateur via GitHub
Codespaces, sans rien installer sur la machine.

L'installation (Node, PostgreSQL/PostGIS, Prisma, dépendances) est **automatique**
grâce au dossier `.devcontainer/`. La seule commande à taper au final sera
`npm run dev`.

---

## ⚠️ Le piège à connaître : les fichiers cachés

Le dossier `.devcontainer/` (et `.gitignore`) commence par un point : c'est un
**fichier caché**. Le glisser-déposer de dossier sur le site web de GitHub **peut
les ignorer** — et sans `.devcontainer/`, Codespaces n'installera rien
automatiquement.

La méthode ci-dessous (import **dans** un Codespace) évite complètement ce
problème. C'est la voie recommandée.

---

## Méthode recommandée (fiable, sans perte de fichiers)

### 1. Créer le dépôt sur GitHub
- Va sur https://github.com/new
- Nom : `creole-psf-manage` (ou ce que tu veux)
- Coche **« Add a README file »** (pour que le dépôt soit initialisé)
- Clique **Create repository**

### 2. Ouvrir un Codespace sur ce dépôt
- Sur la page du dépôt : bouton vert **Code** → onglet **Codespaces** →
  **Create codespace on main**
- Un VS Code complet s'ouvre dans le navigateur, avec un vrai terminal Linux
  (ce n'est pas ton Chromebook : c'est une machine distante).

### 3. Envoyer le ZIP dans le Codespace
- Dans l'explorateur de fichiers du Codespace (à gauche), **glisse ton fichier
  `creole-psf-manage.zip`** depuis l'app Fichiers du Chromebook.
- Il apparaît dans la liste des fichiers.

### 4. Décompresser et placer les fichiers (terminal du Codespace)
Ouvre le terminal (menu ≡ → Terminal → New Terminal) et colle ces commandes :

```bash
unzip creole-psf-manage.zip
shopt -s dotglob                      # inclut les fichiers cachés (.devcontainer, .gitignore)
mv creole-psf-manage/* .              # remonte tout à la racine du dépôt
rm -rf creole-psf-manage creole-psf-manage.zip
ls -a                                 # tu dois voir .devcontainer, apps, docs, package.json…
```

`shopt -s dotglob` est la clé : il garantit que `.devcontainer/` est bien
déplacé, sans perte.

### 5. Envoyer sur GitHub
```bash
git add -A
git commit -m "Import complet du projet"
git push
```

### 6. Activer l'installation automatique
Maintenant que `.devcontainer/` est sur GitHub, il faut le faire prendre en
compte :
- **Palette de commandes** (Ctrl/Cmd + Shift + P) → tape **« Rebuild Container »**
  → **Codespaces: Rebuild Container**.
- Le conteneur se reconstruit : Node, PostgreSQL/PostGIS, Prisma et toutes les
  dépendances s'installent, le schéma est créé et les données de démo chargées
  (script `.devcontainer/setup.sh`). Compte quelques minutes la première fois.

> Alternative équivalente : fermer ce Codespace et en **créer un nouveau** sur le
> dépôt — il partira directement avec la bonne configuration.

### 7. Lancer l'application
Dans le terminal :
```bash
npm run dev
```
Codespaces propose alors d'ouvrir le **port 3000** (l'interface). Clique
« Ouvrir dans le navigateur ».

- Interface : port **3000**
- API / Swagger : port **3001** → `/api/docs`
- Connexion de démo : `admin@creolepsf.ht` / `ChangeMoi123!`

---

## Les fois suivantes

Le Codespace garde son état. Il suffit de le rouvrir (page du dépôt → **Code** →
**Codespaces** → ton codespace) et de lancer :

```bash
npm run dev
```

La base de données démarre automatiquement avec le Codespace ; aucune autre
étape.

---

## Résumé

| Étape | Où | Action |
|-------|-----|--------|
| 1 | GitHub web | Créer le dépôt (avec README) |
| 2 | GitHub web | Ouvrir un Codespace |
| 3 | Codespace | Glisser le ZIP |
| 4 | Terminal | `unzip` + `dotglob` + `mv` |
| 5 | Terminal | `git add/commit/push` |
| 6 | Codespace | Rebuild Container |
| 7 | Terminal | `npm run dev` |

Une fois en place, le quotidien se résume à **ouvrir le Codespace** puis
**`npm run dev`**.
