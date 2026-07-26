# Patrimoine Phones

Application personnelle de suivi de patrimoine pour une activité de revente et
réparation de téléphones. Voir `SPEC.md` (racine) pour le cahier des charges complet.

Stack : Vite + React + TypeScript, Tailwind CSS v4, Zustand, IndexedDB (`idb-keyval`),
`vite-plugin-pwa`. Aucun backend.

## Développement

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
```

## Build

```bash
npm run build
npm run preview
```

## Déploiement

Le workflow `.github/workflows/deploy.yml` publie automatiquement `dist/` sur GitHub
Pages à chaque push sur `main` (source : GitHub Actions, à activer dans
Settings → Pages du dépôt). Le `base` de `vite.config.ts` est fixé à
`/patrimoine-phones/` — à adapter si le dépôt est renommé.

**Statut actuel : non encore vérifié.** Git n'était pas installé sur la machine de
développement au moment de la création du projet ; le premier push et la vérification
du déploiement se feront une fois le dépôt GitHub en place.
