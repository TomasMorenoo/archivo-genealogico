# Reglas del proyecto

## Antes de cada release (beta u oficial)

Siempre agregar una entrada en `frontend/src/data/changelog.ts` con las novedades de la versión y actualizar `CHANGELOG_VERSION` en `electron/main.ts` para que coincida con el último id del changelog.

- Entradas beta llevan `channel: 'beta'`
- Entradas oficiales no llevan `channel` (o `channel: 'stable'`)
- Los IDs son globales y únicos en todo el array
- Una entrada por release — solo lo que cambió en esa versión
