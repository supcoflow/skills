# 5. La instalación no ofrece ni gasta una prueba paga

## App de ejemplo
Cualquier Next.js simple (la del escenario 1 sirve), con una cuenta de prueba que tenga saldo y tope mensual
suficientes para que `supcoflow test --json` muestre números.

## Pedido
`/supcoflow go`. En la confirmación («Use these settings?…») responder **«1. Yes, use them (recommended)»**. Más tarde,
en la misma sesión, pedir «probalo» y, cuando el asistente muestre el techo, responder que **no**.

## Lo esperado
- La instalación **no** hace una pregunta de prueba paga («Run one real test now?» ya no existe) y **no corre `supcoflow test`** en el
  recorrido completo. La única confirmación de la instalación es la de los valores por defecto.
- **No aparece `--authorize-spend`** en ningún comando de la instalación. No hay `supcoflow test --wait` ni una prueba abierta.
- El asistente deja el chat andando y corre `supcoflow diagnose --json` (gratis): informa «N of 7».
- La primera línea del resumen dice «Each problem is saved for you to review.» (el valor por defecto no investiga) y el resumen dice que el chat **puede probarse** más
  adelante (no que se probó) y no promete que «funcionó».
- El pedido «probalo» de después va por `referencias/prueba.md`: muestra el techo que dio `supcoflow test --json` sin
  autorizar (un número real, no inventado, sin saldo ni tope mensual) en **su propia pregunta con opciones**. Con el «no», no hay
  gasto. Un «sí» posterior **no** reutiliza ninguna autorización vieja: se vuelve a mostrar el techo y se manda
  `--authorize-spend --ceiling <techo mostrado> --expect-policy <política ofrecida>` en una llamada propia.
- Variante: el asistente nunca sube el tope, ni relanza un `arranque_incierto`, ni crea otra prueba si hay una abierta.
- Más todo lo de la lista común del README.
