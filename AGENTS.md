<!-- bmad:context -->
<!-- Verified 2026-10-14 against e0ef69a5956dd3c1c57943f4c5198d9780e42255. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Matrix-Control Skin Studio

Éditeur web de skins pour le plugin Matrix-Control. Greenfield front (HTML/CSS/JS ou stack à figer). Planning et artefacts BMad dans `_bmad-output/` ; connaissance projet prévue dans `docs/` quand elle existera.

## Policy

- Chat avec Guillaume en français courant (tutoiement) ; code, IDs, chemins et messages de commit en anglais.
- Commits et push uniquement sur demande explicite de Guillaume.
- **GPC** / **GPM** = générer un prompt collable — ne pas exécuter le chantier, ne pas créer de PR.
- **ROFHA** = ton objectif / franc / honnête — ne pas coder ni relancer un workflow.
- **RFC** / **RFCD** = reformuler en français clair — ne pas changer le verdict ni exécuter.
- Ne pas inventer de pipeline lint / analyseur C++ ; le clean code web est en guidance jusqu’à un lint réel.

## Where things are

- Raccourcis acronymes : `.cursor/rules/gpc-gpm-prompt-shortcuts.mdc`, `rofha-honest-answer.mdc`, `rfc-rfcd-reformulation.mdc`
- Clarté BMad (SSOT) : `_bmad/custom/clarity-bar-fr.md` + `.cursor/rules/bmad-clarity-bar.mdc`
- Titres chat / amorce story : `.cursor/rules/bmad-agent-chat-titles.mdc`, `bmad-story-context-amorce.mdc`
- Présentation build / revue : `_bmad/custom/build-presentation-fr.md`, `code-review-presentation-fr.md`
- Clean code web (guidance) : `.cursor/rules/clean-code.mdc`
- Config langue BMad équipe : `_bmad/custom/config.toml`

## Conventions that differ from defaults

- Noms produit en anglais dans le chat français : Skin Studio, Matrix-Control, skins `Black` / `Green` — ne pas les traduire de force.
- Pendant `bmad-build` / `bmad-code-review` : amorce `## Contexte de la Story` puis barème de clarté ; artefacts générés en anglais.

<!-- /bmad:context -->
