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
Pages à chaque push sur `main` (source : GitHub Actions, activée dans
Settings → Pages du dépôt). Le `base` de `vite.config.ts` est fixé à
`/mon-patrimoine/` pour correspondre au nom du dépôt
[phonelabdev-beep/mon-patrimoine](https://github.com/phonelabdev-beep/mon-patrimoine)
— à adapter si le dépôt est renommé.

Application déployée : https://phonelabdev-beep.github.io/mon-patrimoine/
