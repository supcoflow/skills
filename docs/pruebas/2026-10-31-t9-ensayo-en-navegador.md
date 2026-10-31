# T9 — skill 0.4.0: el camino «construir con tus componentes» (ensayo en navegador)

Fecha: 2026-10-31. Rama `fm/ui-t9-skill`. Todo local y gratis: nada publicado, ningún push, ningún login real, ningún gasto, ninguna llamada a producción.
Plan: `data/ui-agnostico/report.md` §2.5 y §5 T9; decisiones del dueño D1 A, D2 A, D3 (sin marca), D4 A (con historial), D5 A, D6 A.

## Qué cambia

| Pieza | Antes (0.3.1) | Ahora (0.4.0) |
|---|---|---|
| Forma | Sólo el widget; la descripción decía «no usar para construir un chat desde cero». | Next.js (App Router) con `interfaz_propia.estado: disponible` → el chat se construye con los componentes, íconos y estilos de la app (D1 A). Otro stack, sin `interfaz_propia`, `sin_publicar` o si la persona pide el widget → el widget de siempre, y lo dice en una línea. |
| Terminal | Fija 0.8.1 | Fija 0.9.0 (vector `test/vectores/describe-0.9.0.json`, salida de `supcoflow describe --json` de la terminal local `36adcad`). «N of 7» y el punto 7 (`interfaz`) es un aviso: baja la cuenta y no frena la prueba. |
| Preguntas | Tres. | Las tres de siempre y, sólo para la interfaz propia, un segundo panel (cómo se abre; qué herramientas de evidencia). Nunca colores, fuentes ni íconos; nunca `chat brand`. |
| Referencia nueva | — | `referencias/interfaz-propia.md`: detectar, proponer y mostrar, preguntar, escribir, verificar, anotar; tabla de detección del sistema de diseño; qué exige cada punto del contrato; conformidad y servidor falso. |
| Resumen final | «Done. The chat is a bubble…» | Con interfaz propia: «Done. The chat opens from <disparador>, built with your own components…»; si algo quedó sin hacer, «Not finished: …». |
| Escenarios | 7 | 11 (8 y 9 interfaz propia con y sin `src/`; 10 sin camino; 11 conformidad en rojo / widget ya montado). |
| Huella | 0.3.1 | 0.4.0 (sin publicar; la 0.3.1 ya salió). |

Tests: `npx vitest run` → **240 en verde** (los nuevos se escribieron antes y se vieron en rojo). La skill no tiene typecheck propio.

## El ensayo

**Entorno (todo descartable, en `data/ui-t9-skill/scratch/`)**
- Dos apps Next.js 16.4.3 / React 19.3.0 creadas con `create-next-app`: `app-con-src` (con `src/`, Tailwind, shadcn «base-nova», `lucide-react`, cabecera con avatar; inglés) y `app-sin-src` (sin `src/`, sin Tailwind ni librerías, CSS global con variables y CSS Modules, barra propia, modo oscuro por `prefers-color-scheme`; castellano). Las dos con `AGENTS.md` propio.
- La terminal **0.9.0 local sin publicar** (`node --experimental-transform-types src/cli.ts`, repo `cli` en `36adcad`) contra un **motor falso** (`fake-engine.mjs`) que contesta lo mínimo y trae `interfaz_propia` con la forma literal del motor T8 (copia de `cli/test/interfaz-propia-del-motor.ts`). Desvío del ensayo: el `instalar` del motor falso es el `.tgz` del sdk local (`npm pack` de `packages/widget` del sdk `6b8987c`), porque `@supcoflow/chat` 2.4.0 no está en npm.
- El servidor falso del paquete (`supcoflow-chat-fake`) y `chrome-devtools-axi` para el navegador.
- **Dos agentes de código** (subagentes) siguieron la skill de punta a punta como lo haría un asistente, con respuestas de «la persona» escritas de antemano, sin leer más que la skill y lo instalado en `node_modules`. Transcripciones: `data/ui-t9-skill/ronda1-*` y `run2-*`.

**Ronda 1** (skill recién escrita): 19 y 17 fricciones. Varias eran defectos de mi motor falso (`project show` 404, `sites add` que no persistía, `install record` rechazando la guía); esos se arreglaron en el motor falso. Las **reales** se corrigieron en la skill (commits `d989649`, `b733136`, `879b178`):
1. La terminal lee el repo de la carpeta: ahora se dice «corré la terminal desde la carpeta de la app».
2. El segundo panel podía contradecir la primera respuesta, y **una imagen cuenta como captura** en el acuerdo de datos (`allows.screenshots` cubre `attachImage`): con «sólo la página» o «sólo lo que escriben» ya no se pregunta por herramientas.
3. «Mostrar antes de aplicar» chocaba con «instalar primero y después leer el paquete»: la propuesta sale de la app y la referencia; al instalar se lee el contrato y, si cambia lo propuesto, se pregunta de nuevo.
4. Un `instalar` con ruta local no se commitea (se frena y se avisa ya en el paso 5).
5. Qué no se commitea (interfaz, pruebas, `instalacion.json`), el resumen «Not finished», `sites add` verificado por su JSON, la línea de diagnóstico armada de `instalacion.ok/total`, sin sesión no se permite `user_id,user_role`, sin código de salida visible no se agrega `echo $?`.
6. Referencia: ids en una constante copiada del JSON, `AGENTS.md` de la app, carpeta de pruebas, conflicto de versiones de vitest, `test` script y `vitest.config.ts`, `root: document.body` con portales y `words.close`, fondo del panel al capturar, el componente recibe las opciones como props (para inyectar el backend falso) y cada control un nombre accesible distinto.

**Ronda 2** (skill corregida, apps y motor reiniciados): las dos instalaciones terminaron con `install record` bien y `diagnose` en **7 de 7** (punto 7 en orden con el contrato 1.1.0). Tres fricciones de esa ronda quedaron arregladas (las de arriba, 2 y 6); las demás eran de la regla de una orden por llamada con el entorno del ensayo y de la guía (precios).

## Lo que se vio en el navegador (Chrome, `next dev`, backend falso del paquete)

| App | Qué se hizo | Resultado |
|---|---|---|
| Con `src/` (botón «Help» en la cabecera → hoja lateral del shadcn de la app) | Abrir, enviar, recorrer `report-confirmed`; luego `link-to-another-site` y `daily-cap-on-open` | La hoja es el `Sheet` de la app, con `Button`, `Textarea`, `ScrollArea` y un ícono de `lucide-react`. Dice «You are chatting with an automated assistant.»; el foco va al campo al abrir. La confirmación muestra título y cuerpo completos, «No attachments go with this report.» y los dos botones del servidor; **antes del clic `GET /__fake/state` mostraba sólo los pedidos de disponibilidad, `open` y `follow` (en `requests` no había ninguna `respuesta`)** y después de «Yes, report it» aparece «Report sent · rep_3f9a1c2b7d4e5a60» y «New conversation». El enlace al propio sitio es un enlace; los de otros sitios salen como texto. El tope diario dice «The assistant is not available for now…» sin ningún botón de más presupuesto (queda «Retry»). Capturas: `data/ui-t9-skill/capturas/app1-*.png` (hechas con el texto de la ronda 2, no con el final: el clip de adjuntar se ve porque esa ronda declaró `attachImage` con el acuerdo «sólo la página»; la regla final no lo permite, ver «Qué no se re-ensayó»). |
| Sin `src/` (botón flotante → panel propio, modo oscuro, serif, variables CSS) | Abrir, enviar, recorrer `report-confirmed` | Textos en castellano («Estás hablando con un asistente automático.»), tonos de la app, un solo botón de adjuntar imagen (lo elegido). Las peticiones llevan `x-supcoflow-locale: es` y `x-supcoflow-capabilities: attachImage,newConversation`. El número del reporte y «Nueva conversación» aparecen tras el «Yes». Capturas: `app2-*.png`. |
| Ambas | Recursos pedidos por la página | Sólo `localhost` y el servidor falso: **ninguna llamada a `chat.supcoflow.dev`**. |

**Conformidad (T6) sobre el chat que quedó** (`checks.ts` del paquete sin editar):
- App con `src/` (la hizo el agente en su carpeta `tests/`): **27 pasaron, 0 fallaron, 4 saltados**.
- App sin `src/`: su persona dijo que no a los paquetes de prueba, así que el agente **no los instaló y dijo que la conformidad no se corrió** (lo pide la skill). Para tener el dato la corrí yo en una **copia** de la app (la app del ensayo no se tocó): primera corrida 26 pasaron, 1 falló, 4 saltados. El fallo era un defecto real de lo que escribió el agente: con el panel abierto, dos botones se llamaban igual («Cerrar la ayuda») y el check de P13 no puede distinguirlos (tampoco un lector de pantalla). Renombrado el del panel: **27 pasaron, 0 fallaron, 4 saltados**. La regla quedó escrita en la referencia.
- Los 4 saltados son siempre los mismos: P10 ×3 (no hay `words.pickElement`) y P11 (la app no tiene sesión: `personWired`).

## Qué no se re-ensayó con un agente

Las dos apps del navegador salieron del texto de la **ronda 2** (`d989649`). Los arreglos de después (`b733136`, `879b178` y los de la revisión) se probaron con los tests de texto, no se siguieron de punta a punta, salvo lo de la **ronda 3** de abajo. En particular, la conformidad y las capturas son de la ronda 2.

**Ronda 3** (texto final, un agente, app con `src/`, acuerdo «Only the page and browser»): ver el apartado «Ronda 3» al final.

## Lo que no se pudo ver ni probar (dicho tal cual)

- **Móvil:** `chrome-devtools-axi resize 390 800` no cambió el viewport (siguió en 1440×900): no se vio el chat en un teléfono. (La captura que había sacado como «móvil» era una copia de otra y se borró.)
- No se probó el widget de respaldo en estas apps, ni Pages Router u otros stacks.
- **Con el motor real** (`/widget` del motor T8 de verdad), `npm i @supcoflow/chat@…` desde npm y la terminal publicada: nada de eso existe todavía; el motor falso usa la forma del motor T8 copiada.
- Las **etiquetas en el idioma de la app** (D2) las pone el servidor real: el backend falso reproduce grabaciones en inglés, así que sólo se vio que se declara `locale: es`, no que los botones salgan en castellano.
- Captura de pantalla y «señalar un elemento» con la interfaz (sólo se ofreció imagen en la app sin `src/`; en la otra el agente dejó los controles gateados por `state.allows`); la subida de adjuntos no se recorrió en el navegador.
- Lectura con un lector de pantalla y recorrido sólo con teclado: no se hicieron más que el foco al abrir.
- Nivel 2 y 3 de `prueba.md`: no se corrieron (nivel 3 gasta; la persona dijo «Not now»).

## Defectos y huecos encontrados FUERA de la skill (no se tocaron)

1. **sdk:** `packages/widget/package.json` sigue en `2.3.1` pero el contenido es el de la `2.4.0` sin publicar (el `CHANGELOG` y el motor T8 dicen 2.4.0). Hay que subir la versión antes de empacar.
2. **sdk, conformidad:** los 3 checks de P10 (adjuntos) se saltan si el adaptador no da `words.pickElement`, aunque la interfaz ofrezca sólo imagen: una interfaz «sólo imágenes» queda sin cobertura de P10. Debería poder correrse con `attachImage` solo.
3. **sdk, backend falso:** los textos de las grabaciones están sólo en inglés: con `locale: es` los botones del Sí/No siguen en inglés en el falso; no se puede ver la traducción de D2 sin el backend real.
4. **Motor/terminal (previo a T9):** `nextjs.estado: "probando"` del `/widget` no está explicado en la skill y los agentes preguntaron qué hacer con él.

## Cómo probarla en las apps reales del dueño (MacBook)

Pre-requisitos que hoy NO existen: `@supcoflow/chat` 2.4.0 en npm, la terminal 0.9.0 en npm y el motor T8 desplegado. **Sin eso la skill usa el widget** (`interfaz_propia` ausente o `sin_publicar`), como la 0.3.1. Para probar antes de publicar:

1. Instalar la skill de la rama: `npx skills add <ruta-al-clon-de-skills-en-la-rama-fm/ui-t9-skill>` (o copiar `skills/supcoflow/` a `~/.claude/skills/`).
2. Empaquetar el sdk local: en una copia de `sdk` (`git archive HEAD | tar -x -C <carpeta>`), `npm ci`, subir la versión de `packages/widget/package.json` a `2.4.0`, `npm run build -w @supcoflow/chat`, `npm pack` dentro de `packages/widget`. Guardar el `.tgz`.
3. Terminal 0.9.0 local: un script `supcoflow` que corra `node --experimental-transform-types --no-warnings <repo cli>/src/cli.ts "$@"` y ponerlo primero en el `PATH`; el motor, o bien el T8 local, o bien el motor falso del ensayo (`data/ui-t9-skill/scratch/fake-engine.mjs`, con `TGZ=<el .tgz>` y `CONTRACT_JSON=<contract.json del sdk>`, puerto 4777) con `SUPCOFLOW_API_URL=http://127.0.0.1:4777`, `SUPCOFLOW_SIN_LLAVERO=1` y una clave sembrada en `credenciales.json`. **Nunca contra producción.**
4. En cada app **en una rama aparte** (o una copia), abrir Claude Code y escribir `/supcoflow go`. Responder: abrir = lo que proponga el asistente (revisar que sea algo de la app: cabecera, menú, página de ayuda); herramientas = las que quiera (con el acuerdo «sólo la página» no se pregunta); prueba paga = **«Not now»**. Aceptar los paquetes de prueba si la app no tiene corredor. Como el paquete local no está en npm, la skill se **frena a propósito** con «that line cannot be committed»: contestar «es una build local, instalala igual; nunca commitees `package.json` ni `package-lock.json`».
5. Mirar: (a) que use **los componentes y los íconos de esa app** y no agregue librerías (`git diff package.json`); (b) que no aparezca ninguna marca de Supcoflow; (c) la conformidad (`npx vitest run` en la carpeta de pruebas que haya creado); (d) el servidor falso en un navegador: `npx supcoflow-chat-fake report-confirmed` desde la carpeta de la app y `NEXT_PUBLIC_SUPCOFLOW_BACKEND_URL=http://127.0.0.1:4010 npm run dev`; recorrer `report-confirmed`, `link-to-another-site`, `daily-cap-on-open`, `reload-with-pending-confirmation`; (e) en el celular (o el modo responsivo del navegador): abrir, escribir, cerrar con el gesto de la app.
6. **Antes de mezclar nada:** `git diff` de la app, revisar que no haya quedado la dirección del servidor falso ni el `file:` del `.tgz` en `package.json`, `package-lock.json`, y `git status` (la interfaz, las pruebas y `.supcoflow/instalacion.json` quedan sin commitear a propósito).
7. Probar el camino del widget en una de las dos: `/supcoflow go` pidiendo «ponelo con el widget» (o con el motor sin `interfaz_propia`).

## Ronda 3 (texto final del 2026-10-31, tras la revisión de la vuelta 1)

Un agente siguió la skill en la app con `src/` reiniciada, con el acuerdo «Only the page and browser» (el caso que en la ronda 2 dejó un clip que el acuerdo no deja ver). Transcripción: `data/ui-t9-skill/run3-app-con-src/transcripcion.md`.
- **No hizo la pregunta de herramientas**, dijo «Your data agreement doesn't take screenshots, images or pointed elements, so the chat won't offer evidence tools.» y dejó `capabilities: { attachImage: false, screenshot: false, pickElement: false }`.
- La propuesta fue en el mismo mensaje que los paneles y siguió con las respuestas como «sí» (P3-4 de la revisión); `install record` con `--shape own-interface` y dos `--file` (la interfaz y el archivo que la monta; sin las pruebas); `diagnose` 7 de 7.
- Conformidad en su carpeta de pruebas: **27 pasaron, 0 fallaron, 4 saltados** (P10 ×3 porque no ofrece herramientas de evidencia, P11 porque no hay sesión). No se vio en un navegador (el agente no tenía) y las capturas del informe siguen siendo las de la ronda 2.
- Fricciones nuevas, resueltas: la línea literal de «gasto cero» en la tercera pregunta con «Save», «el segundo panel queda con una pregunta» y `vitest.config.mts`. Quedan sin resolver (menores, de redacción): la numeración «punto N» / «step N» que se pisa, un ejemplo concreto de versión de vitest en un conflicto de pares, y que el resumen de tres líneas es corto para todo lo que hay que decir.
