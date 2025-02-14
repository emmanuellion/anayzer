# Anayzer

<img src="example.png" alt="Example"/>

**Anayzer** est un outil en ligne de commande (CLI) qui analyse rapidement votre projet JavaScript/TypeScript et vous fournit diverses métriques ainsi que des informations sur la complexité, les dépendances et l’utilisation des ressources. Il peut également vous aider à repérer des problèmes de lint et à obtenir un aperçu global de la santé de votre code.

---

## Installation

```bash
npm i anayzer
```

---

## Utilisation

Une fois le package installé, vous pouvez lancer l’analyse de votre projet à l’aide de :

```bash
npx anayzer
```

---

## Fonctionnalités

Anayzer fournit différents types d’informations et de rapports :

1. **Statistiques générales**
   - **Nombre de dépendances** : le nombre de packages listés dans vos fichiers `package.json`.
   - **Build time** : le temps de construction (ou d’analyse) du projet.
   - **Nombre total de lignes** : les lignes de code (LOC) comptabilisées dans votre projet.
   - **Starting time** : le temps nécessaire pour initialiser le projet ou l’outil.
   - **Nombre total de handles** : le nombre de ressources ou de « handles » (descripteurs de fichiers, sockets, etc.) ouverts.
   - **Nombre de fonctions asynchrones** : recense les fonctions `async`/`await` dans le code.
   - **Complexity index** : un indicateur global de la complexité de votre projet (nombre de classes, de fonctions, etc.).

2. **Ressources système**
   - **CPU usage** : mesure l’utilisation du processeur pendant l’analyse.
   - **Memory usage** : mesure la mémoire utilisée par l’outil pendant l’exécution.
   - **Informations sur la machine** : hôte, architecture, plateforme, version de Node.js, etc.

3. **Rapport de lint**
   - Anayzer peut lister les éventuelles erreurs ou avertissements de lint dans votre code (par exemple, règles ESLint).
   - Chaque message indique la gravité (erreur ou avertissement), la description et la règle concernée.

4. **Visualisation**
   - Le résultat est présenté sous forme de tableau et de graphiques (dans la console ou via une interface simplifiée) pour vous aider à repérer rapidement les zones problématiques.

Voici un aperçu d’une interface d’exemple (simplifiée) :

---

## Exemples d’utilisation

- **Analyse rapide** : pour avoir un aperçu global de l’état de votre projet avant de le pousser en production.
- **Intégration CI/CD** : vous pouvez exécuter `npx anayzer` dans vos pipelines pour repérer rapidement les problèmes de lint, vérifier le nombre de dépendances, etc.
- **Audit de performance** : identifiez si votre projet consomme trop de ressources (CPU ou mémoire) lors du build ou du démarrage.

---

## Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez ajouter des fonctionnalités, corriger des bugs ou améliorer la documentation, n’hésitez pas à ouvrir une **issue** ou une **pull request** dans le dépôt GitHub correspondant.

---

## Licence

Anayzer est distribué sous licence [MIT](LICENSE). Vous êtes libre de l’utiliser, de le modifier et de le redistribuer.

---

**Bon usage et bonne analyse de vos projets !**