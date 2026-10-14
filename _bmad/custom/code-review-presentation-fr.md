# Code review — contrat de présentation (Skin Studio)

Ce document s’applique à **toute** sortie utilisateur de `bmad-code-review`, Bugbot et revues adversariales explicites.
Il prime sur le style des sous-agents et des étapes internes du workflow.

**Barème partagé (obligatoire) :** charger et appliquer `clarity-bar-fr.md` en premier. Tout ce qui suit **ajoute** la structure revue ; rien n’assouplit le barème.

**Rappel phrase-test :** la première présentation d’un constat doit déjà être aussi claire que si Guillaume venait de dire « Reformule en langage naturel, sans jargon excessif ». S’il devrait le dire, **réécrire**. Même exigence pour **chaque** question et décision de la revue. SSOT : `clarity-bar-fr.md` + `.cursor/rules/bmad-clarity-bar.mdc`.

---

## Langue

- **Toujours répondre en français** à Guillaume.
- Ne jamais coller tel quel un output sous-agent en anglais, ni des noms de champs JSON (`decision-needed`, `patch`, etc.) sans les traduire.
- Chemins `fichier:ligne` et noms de symboles : autorisés **en complément court**, jamais comme colonne vertébrale du texte.

## Ton

- Phrases **courtes et complètes**, langage naturel — producteur de musique qui lit le code occasionnellement.
- Interdit : style télégraphique, pile de jargon, phrases qui empilent fichier + critère d’acceptance + pixels + noms de modules.
- Un terme technique indispensable → une courte glose à la première occurrence (ex. « canvas = zone de dessin interactive dans le navigateur »).

| Interne | Dire à Guillaume |
|---------|------------------|
| `decision-needed` | décision à prendre |
| `patch` | correction à appliquer |
| `defer` | à reporter |
| `dismiss` | sans action |
| Blind Hunter | analyse du diff |
| Edge Case Hunter | cas limites |
| Acceptance Auditor | conformité à la spec |
| oneshot / File List / AC #N | oneshot → petite tâche hors story ; File List → liste de fichiers ; AC → critère d’acceptance (éviter les numéros d’AC dans le corps du problème) |

---

## Structure globale (avant le détail)

1. **En bref** — une phrase sur ce qui a été revu et l’enjeu principal **en langage de produit**, pas de fichiers.
2. **Verdict** — comptes : décisions à prendre / corrections à appliquer / à reporter.

---

## Format de chaque constat (présentation chat)

### Titre

- **Décision à prendre :** titre = **question claire** que Guillaume peut comprendre sans ouvrir le code  
  (ex. « Est-ce qu’on valide 1-2 alors que d’autres changements sont dans les mêmes fichiers ? »).  
  Interdit : titres abstraits du type « Contenu hors périmètre dans les fichiers de la story ».
- **Correction / à reporter :** titre = action ou risque en français simple.

### Corps — quatre blocs, dans cet ordre

1. **Ce qui est en jeu** — ce que ça change pour Guillaume ou pour l’utilisateur de Skin Studio (quand tu valides, ce qui reste flou, ce qui peut casser). Max 2–3 phrases courtes. Zéro pile de noms de fichiers.
2. **Le problème** — raconter d’abord **l’intention** (« La story devait… »), puis **ce qui ne colle pas** en puces courtes, en français. Les preuves techniques (fichier, ligne, AC, pixels) viennent **après**, en une ligne ou une parenthèse, pas dans la phrase principale.
3. **Ce qu’il faut faire** — action unique, ou options numérotées avec des **verbes du quotidien** (« Tout garder ensemble », « Ne garder que cette story »), pas du jargon d’ingénierie.
4. **Si on ne fait rien** — conséquence concrète en une phrase.

### Recommandation BMad (obligatoire pour chaque décision)

- **Option recommandée** — numéro + intitulé court  
- **Pourquoi** — 2 à 4 phrases **accessibles** (même barème / phrase-test)  
- **Confiance** — `ferme` ou `nuancée`

Guillaume ne doit jamais devoir redemander la recommandation.

Critères de choix : (1) risque utilisateur / stabilité, (2) `AGENTS.md` et conventions, (3) périmètre de la story.

---

## Règles anti-densité (ce qui a fait échouer les revues passées)

**Interdit dans « Le problème » et « Ce qui est en jeu » :**

- Empiler dans une même phrase : chemin de fichier + numéro d’AC + cotes en pixels + noms de modules
- Allusions opaques (« Option A′ », « oneshot `spec-…` », jargon interne) sans dire d’abord ce que ça signifie pour la décision
- Partir des fichiers pour raconter le problème (partir de l’intention produit)

**Autorisé :**

- Une courte liste à puces de « choses en trop / manquantes »
- Une ligne technique en bas : « Détail technique : `SkinPreview.tsx`, largeurs grille, … »

### Auto-contrôle avant d’envoyer

Appliquer **intégralement** la checklist de `clarity-bar-fr.md`, plus :

1. Le titre est-il une question (décision) ou une action claire (correction) ?
2. Les options se distinguent-elles sans connaître le code ?

Si Guillaume devrait dire « reformule en langage naturel, sans jargon excessif », **le message n’est pas prêt**.

---

## Exemple — mauvais puis bon

### Mauvais (trop dense — à ne plus produire)

> **Décision 1 — Contenu hors périmètre dans les fichiers de la story**  
> Dans `SkinStore.ts` et `PreviewCanvas.tsx`, outre le toggle grille et le shrink export, le diff contient le recalage de largeurs (palette → 56, EXPORT/RETRY → 48)… Les chiffres d’AC #4 (EXPORT à x=244) ne tiennent qu’avec ce paquet… Il existe déjà une oneshot `spec-skin-grid-widths`…

### Bon (niveau exigé dès la première version)

> **Décision 1 — Est-ce qu’on valide 1-2 alors que d’autres changements sont dans les mêmes fichiers ?**  
> **Ce qui est en jeu** — Quand tu diras « 1-2 est bon », on doit savoir si tu valides seulement le toggle grille, ou aussi d’autres retouches d’interface dans le même lot.  
> **Le problème** — La story devait ajouter le toggle grille et rétrécir le bouton export. Or, dans les mêmes fichiers, il y a aussi des largeurs déjà changées ailleurs et un détail de mise en page. Sans ces largeurs, l’alignement ne tombe pas juste.  
> **Options** — (1) Tout garder ensemble · (2) Ne garder que 1-2 · (3) Garder les largeurs, sortir le reste  
> **Recommandation BMad** — Option 1, parce que les largeurs sont déjà là et nécessaires pour l’alignement ; tout ressortir maintenant coûte cher pour peu de gain. Confiance : nuancée.

---

## Story file vs chat

- Section **Review Findings** dans la story : peut rester plus compacte / technique (pour la traçabilité).
- **Chat avec Guillaume** : toujours le niveau « Bon » ci-dessus. Ne jamais coller le texte dense de la story tel quel dans le chat.

## Sous-agents

Toujours reformuler en français clair avant présentation. Un tableau récap peut garder `fichier:ligne` dans une colonne Emplacement.

## Walkthrough des décisions (step 04)

Une décision à la fois, déjà au niveau « Bon » / phrase-test, avec Recommandation BMad, puis attente du numéro de Guillaume.
