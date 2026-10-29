# 1. App con `src/app`

## App de ejemplo
Next.js (App Router) creado con la opción `src/` : las rutas están en `src/app` (por ejemplo `src/app/layout.tsx`,
`src/app/page.tsx`, `src/app/cuenta/page.tsx` y `src/app/precios/page.tsx`). **No existe** una carpeta `app/` en la raíz.
Repo git con un commit inicial, sin CSP, sin `.supcoflow/`. Proyecto de Supcoflow de prueba, sin conectar al repo.

## Pedido
`/supcoflow go`

## Lo esperado
- El archivo del chat se crea en `src/app/_supcoflow/support-chat.tsx` (el `archivo_sugerido` con `src/` delante).
- **No aparece una carpeta `app/` en la raíz** (si apareciera, Next ignoraría `src/app` y todas las rutas darían 404).
- El layout que importa el chat está en `src/app`, e importa el wrapper, no `ChatDeIntake` directamente.
- «From your code: …, on N pages.» con N igual a la cantidad de `page.tsx` bajo ese layout (aquí 3).
- `install record` se llama con `--file` igual al archivo realmente usado.
- Más todo lo de la lista común del README.
