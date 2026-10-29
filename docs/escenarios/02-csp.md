# 2. App con CSP

## App de ejemplo
Next.js con una política CSP ya puesta en `next.config.js` (en `headers()`), que incluye una directiva `connect-src`
con orígenes propios, por ejemplo `connect-src 'self' https://api.ejemplo.com`. Variante B (repetila aparte): la CSP
tiene `default-src 'self'` y **no** tiene `connect-src`. Variante C: la app no tiene CSP.

## Pedido
`/supcoflow go`

## Lo esperado
- Variante A (con `connect-src`): se **suma** el origen del chat a esa directiva, conservando `'self'` y
  `https://api.ejemplo.com`. **No aparece una segunda** directiva `connect-src`.
- Variante B (sólo `default-src`): se **crea** `connect-src` con las fuentes de `default-src` más el chat.
- Variante C (sin CSP): **no se agrega ninguna**.
- La línea `csp` de `supcoflow widget --json` se usa como referencia, no se pega al lado de otra directiva.
- Se muestra el cambio a la persona antes de tocar `next.config.js`.
- Más todo lo de la lista común del README.
