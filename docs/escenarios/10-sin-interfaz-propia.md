# 10. Sin camino de interfaz propia: el widget de siempre

## App de ejemplo
Cualquiera de estas, una por corrida: **(a)** Next.js con el motor de hoy, que **no** manda `interfaz_propia` en `widget --json`; **(b)** Next.js con
`interfaz_propia.estado: sin_publicar` (el paquete todavía no está en npm); **(c)** una app que no es Next.js App Router (Pages Router, o Vite); **(d)** una app
Next.js con el camino disponible donde la persona **pide el widget** por nombre. Proyecto de prueba ya conectado.

## Pedido
`/supcoflow go` (en **(d)**: «ponelo con el widget de Supcoflow, la burbuja»).

## Lo esperado
- El asistente dice **en una línea** por qué usa el widget (otro stack, sin `interfaz_propia`, `sin_publicar`, o lo pidió).
- Sigue el camino de siempre (`referencias/nextjs.md`): el archivo `app/_supcoflow/support-chat.tsx` (con `src/` si corresponde) con el contenido que dio el motor, sin reescribir los ids.
- **No** instala el paquete de la interfaz propia, **no** escribe una interfaz propia ni corre conformidad, y las preguntas son las tres de siempre, **sin** el segundo panel.
- `install record` sin `--shape own-interface` (o con `--shape widget`); `diagnose` da «N of 7» con el punto 7 «not applicable».
- En **(c)** dice que ese stack no está probado y no improvisa.
- En el resumen: «Done. The chat is a bubble on N pages, in English.»
- Más todo lo de la lista común del README.
