# 9. Interfaz propia en una app sin `src/` y sin sistema de diseño

## App de ejemplo
Next.js (App Router) **sin** `src/`: `app/layout.tsx`, `app/page.tsx`, `app/ayuda/page.tsx`, CSS global con variables (`--bg`, `--fg`, `--accent`) y un
CSS Module por componente; **sin** librería de componentes ni de íconos, sin Tailwind. Tiene una barra superior propia (`app/_components/barra.tsx`). Sin CSP.
Repo git con un commit inicial. Proyecto de Supcoflow de prueba ya conectado; el mismo motor de prueba que el escenario 8.

## Pedido
`/supcoflow go`. En el segundo panel elegir **2** («A floating button in a corner that opens a panel») y en las herramientas **2** («Only attach an image»).

## Lo esperado
- Variante: si en la primera pregunta se elige «Only the page and browser» o «Only what they type», el asistente **no** hace la pregunta de herramientas, dice que el acuerdo no toma capturas, imágenes ni elementos y declara las tres en `false`.
- La interfaz usa **los mismos tokens** (las variables CSS y los CSS Modules de la app) y el mismo sistema de estilos; **no** instala Tailwind, ni una librería de íconos
  ni de componentes, ni fuentes. Los íconos, si hacen falta, son SVG en línea con un trazo parecido al de la app, y el asistente lo dice en su propuesta.
- El archivo del chat y el disparador están bajo `app/`, **no** en un `src/` inventado.
- `capabilities` es `{ attachImage: true, screenshot: false, pickElement: false }` (más `newConversation`), y la interfaz no muestra captura ni señalar.
- Los textos del marco están en el idioma de la app (aquí castellano, por el i18n que la app tenga o, si no tiene, en sus propios textos), con `locale: "es"` declarado, y la línea de
  «asistente automático» se ve antes del primer mensaje.
- Respeta teclado (Esc), foco al campo al abrir y `prefers-reduced-motion`.
- Si la app no tiene corredor de pruebas, el asistente **no instala uno sin el sí** y dice que la conformidad no se corrió; igual mira cada escenario en un navegador contra el servidor falso.
- Más todo lo de la lista común del README y lo del escenario 8 que aplique (forma, registro, resumen).
