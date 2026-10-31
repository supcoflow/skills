# 5. La persona dice «no» a la prueba paga

## App de ejemplo
Cualquier Next.js simple (la del escenario 1 sirve), con una cuenta de prueba que tenga saldo y tope mensual
suficientes para que `supcoflow test --json` muestre números.

## Pedido
`/supcoflow go`. En la tercera pregunta («Run one real test now?») responder **«2. Not now»**. En la primera elegir
«Only what they type» y en la segunda «Look into it right away» (la que gasta, para que la prueba pagada sea una
opción real y el «no» tenga qué rechazar).

## Lo esperado
- La tercera pregunta muestra el techo, el saldo y el tope que dio `supcoflow test --json` sin autorizar (números
  reales, no inventados).
- **No aparece `--authorize-spend`** en ningún comando de toda la sesión. No hay `supcoflow test --wait` ni una
  prueba abierta.
- Tras el «no», el asistente igual deja el chat andando y corre `supcoflow diagnose --json` (gratis): informa «N of 7».
- La primera línea del resumen dice «Each problem gets looked into and ends up as an issue.» y el resumen dice que el chat **puede probarse** (no que se probó) y no promete que «funcionó».
- Variante: un «sí» más tarde, en la misma sesión, **no** reutiliza ninguna autorización vieja: se vuelve a mostrar
  el techo y se manda `--authorize-spend --ceiling <techo mostrado> --expect-policy <política ofrecida>` en una llamada
  propia.
- Variante: el asistente nunca sube el tope, ni relanza un `arranque_incierto`, ni crea otra prueba si hay una abierta.
- Más todo lo de la lista común del README.
