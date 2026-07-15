# Instance Locale

Ce dossier contient les bases de donnees locales utilisees en developpement.

## Fichiers locaux

- `mineralchain_dev.db`
- `mineralchain.sqlite`

Ces fichiers sont generes localement et ignores par Git. Ils ne sont pas versionnes pour eviter de publier des donnees d'execution ou des bases de test.

## Utilisation

Le backend peut creer ou reutiliser ces bases automatiquement en local selon la configuration `DATABASE_URL` ou le fallback SQLite.
