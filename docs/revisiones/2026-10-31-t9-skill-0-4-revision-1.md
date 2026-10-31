# Revisión independiente, vuelta 1 — T9: skill 0.4.0 («construir con tus componentes»)

Revisor: Claude Opus 5.5 (en lugar de GPT, sin cupo). Sólo lectura sobre el repo de skills, commit `6572203` (rama `fm/ui-t9-skill`) contra `main` local `40fa632`. Fecha: 2026-10-31.

## Veredicto

**Aprobado con cambios menores.** No hay P1 ni P2. El camino nuevo hace lo que pidió el dueño: no copia componentes con estilo, no pregunta colores, no pone marca de Supcoflow, declara `locale`, conserva el historial, deja el widget de respaldo y dice por qué. Coincide con el contrato 1.1.0, el núcleo, el hook de React y la conformidad del sdk (`main` local `6b8987c`), con la ruta `/widget` del motor (`main` `1458afa5`) y con la terminal 0.9.0 (`main` `36adcad`). No abre ningún camino que gaste o publique. La prueba en el navegador es real: la repetí y salió igual.

Hay 9 hallazgos P3: huecos de claridad para el agente y cosas que el informe de la prueba tiene que decir mejor. Ninguno frena el merge local.

**En simple, para el dueño:** la skill nueva arma el chat con los botones, los íconos y los colores de cada app, sin poner nada nuestro a la vista. Lo comprobé en las dos apps de prueba y anda. Quedan detalles de redacción para que otro asistente no dude en algunos pasos, y en el informe hay que aclarar que la versión final del texto no la volvió a seguir un asistente de punta a punta.

## Qué hice

1. Pasé el checkout de esta worktree a `6572203` (detached) y leí todo el diff contra `40fa632`: `SKILL.md`, `referencias/interfaz-propia.md`, `nextjs.md`, `prueba.md`, los escenarios 8 a 11, el informe `docs/pruebas/2026-10-31-t9-ensayo-en-navegador.md`, `scripts/huella.mjs` y el README.
2. Tests y huella:
   - `npx vitest run` → **240 pasaron** (1 archivo).
   - `npm run huella` → `0.4.0` / `aa4044…f573`, igual a `test/vectores/huella-de-la-skill.json`.
3. Vector de `describe`: corrí `node --experimental-transform-types --no-warnings <cli>/src/cli.ts describe --json` desde `cli` `main` `36adcad` y lo comparé con `cmp` contra `test/vectores/describe-0.9.0.json`: **iguales byte a byte**, versión `0.9.0`.
4. Comparé cada nombre del texto de la skill con su fuente:
   - **sdk:** `docs/presentation-contract.md`, `docs/core.md`, `docs/react.md`, `docs/conformance.md`, `docs/testing.md`, `conformance/chat.conformance.template.tsx`, `conformance/checks.ts`, `src/testing/servidor-local.ts`, `src/testing/catalogo.ts` y `package.json` (`files` publica `examples/` y `conformance/`).
   - **terminal:** `src/diagnostico.ts`, `src/comandos/probar.ts`, `src/comandos/instalacion.ts`, `src/comandos/widget.ts`, `src/comandos/describir.ts` y `test/interfaz-propia-del-motor.ts`.
   - **motor:** `app/api/proyectos/[projectId]/widget/route.ts` y `src/widget/instalacion.ts`.
5. Leí las dos transcripciones de la ronda 2 (`run2-app-con-src`, `run2-app-sin-src`), miré las capturas y el código que quedó en las apps descartables.
6. **Repetí la evidencia por mi cuenta**, sobre copias hechas con `cp -c` dentro de mi worktree, sin tocar las apps del ensayo:
   - Conformidad en `app-con-src` y en `app-sin-src-conf` (`npx vitest run`): **27 pasaron, 4 saltados** en las dos. El `checks.ts` de cada una es igual byte a byte al del sdk (`cmp`).
   - En Chrome (`chrome-devtools-axi`), `next dev` en el puerto 3091 contra `npx supcoflow-chat-fake report-confirmed --port 4091`, recorrí `report-confirmed` en la app con `src/`:
     - **El botón y la hoja:** «Help» en la cabecera abre un `dialog "Support"`, con «You are chatting with an automated assistant.» y el foco en el campo.
     - **La confirmación:** muestra el título y el cuerpo enteros, «No attachments go with this report.» y los dos botones del servidor.
     - **Antes del clic:** `/__fake/state` tenía 4 pedidos (2 de disponibilidad, `open` y `follow`) y **ninguno con `respuesta`**.
     - **Después de «Yes, report it»:** llegó el pedido 5, `{"respuesta":{"requestId":"req_1","optionId":"approve"}}`, con las cabeceras `x-supcoflow-locale: en` y `x-supcoflow-capabilities: attachImage,newConversation`. La pantalla mostró «Report sent · rep_3f9a1c2b7d4e5a60», «New conversation», y desapareció el botón de adjuntar (P8).
     - **Al terminar:** apagué los dos servidores y nada quedó escuchando.

No cambié ni la skill, ni el sdk, ni el motor, ni la terminal. No publiqué nada y no gasté nada.

## Lo que está bien (verificado)

- **Nada de estilo propio (D1 A, D3):** la skill prohíbe copiar componentes con aspecto propio, `ChatDeIntake`, `chat brand`, librerías nuevas y cualquier marca, en `SKILL.md:313-319` y `interfaz-propia.md:182-191`. Las dos apps lo cumplen:
  - **Con `src/`:** usa el `Sheet`, `Button`, `ScrollArea` y `Textarea` de la app, con `lucide-react`.
  - **Sin `src/`:** usa CSS Modules con 25 `var(--…)` de la app, sin un solo color fijo, y `font-family: var(--font)`.
  - **En las dos:** `git diff package.json` no suma ninguna librería de interfaz.
- **Contrato y núcleo:** coinciden las opciones (`tenantId`, `projectId`, `backendUrl`, `user`, `autoContext`, `storage`, `resume`, `locale`, `capabilities`, `fetch`), `state.allows` (`screenshots` cubre `attachImage`: `core.md:215-217`), `canCaptureScreen()`, `isLongPaste()`, `parseAssistantText`, `confirmReport(id)` y `answer(id, …)`. También P14 (`resume` en true, `storage` distinto de «none», esperar `ready`), P16 «todavía no aplica» y que «newConversation» cuenta como declarado.
- **Conformidad:** coinciden con `docs/conformance.md` y la plantilla las tres marcas `ADAPT` (más la 3b de `personWired`), `words.close`, `root` con portales, «no editar `checks.ts`», «un saltado no es un aprobado» y `MANUAL`.
- **Servidor falso:** coinciden `supcoflow-chat-fake`, `--list`, los escenarios nombrados y que la dirección sea sólo de desarrollo.
- **Terminal y motor:**
  - **`interfaz_propia`:** los campos (`estado`, `paquete`, `version`, `instalar`, `tenant_id`, `project_id`, `backend_url`, `csp`, `opciones_del_nucleo`, `contrato`, `entradas`, `documentos`) son los de `cli/test/interfaz-propia-del-motor.ts` y los de `interfazPropiaJson` del motor.
  - **`install record`:** `--shape own-interface` y `--file` repetible existen (`instalacion.ts:2,42`).
  - **El diagnóstico:** «N of 7» y la frase salen de `lineaDeLoRevisado` (`diagnostico.ts:28-29`); `instalacion.ok` y `instalacion.total` existen (`probar.ts:188`); el punto 7 trae `aviso: true` (`diagnostico.ts:61`).
  - **El `/widget` antes de prender el chat:** que la skill lo llame en el paso 5, antes de `chat on`, es seguro, porque la ruta no mira el estado del chat (`route.ts`).
- **Gasto:** el nivel 3 sigue con su propio sí. La regla de la skill («si falla un punto que no es aviso, o no está listo, no se gasta»: `SKILL.md:114-117`, `prueba.md:60-61`) es **más estricta** que el `listo` de la terminal, que sólo mira sesión, repo, máquina y lo que dice el motor (`probar.ts:182`). Así que el «N of 7» y el aviso no aflojan nada. Una ruta local o una URL en `instalar` frena (`SKILL.md:312-314`). La dirección del servidor falso no se commitea (`interfaz-propia.md:156-158`).
- **El camino viejo:** el widget sigue igual, salvo el texto condicionado («with the widget…») y el «N of 7». El escenario 10 cubre las cuatro salidas al widget. No quedan restos de «of 6» ni de `0.8.1`, salvo la línea histórica del README.
- **Un solo chat y no borrar** (`SKILL.md:320-322`); **el orden instalar → leer → proponer de nuevo si cambia** (`SKILL.md:314-316`, `interfaz-propia.md:35-38,44-45`).
- **La evidencia del navegador es real** (ver «Qué hice», punto 6). Las capturas `app1-*` y `app2-confirmacion.png` corresponden al código que está en las apps.

## Hallazgos

### P3-1 — La versión final del texto no la siguió ningún agente de punta a punta, y el informe no lo dice claro

**Evidencia:**
- Las apps de la ronda 2 se escribieron a las 15:36–15:38 (`ls -lT` de `support-chat.tsx` y `chat-ayuda.tsx`). Eso fue con el texto de `d989649` (15:31), antes de `b733136` (15:44) y `879b178` (15:49).
- Por eso la app con `src/` declara `capabilities: { attachImage: true, … }` (`support-chat.tsx:98`) con el acuerdo «Only the page and browser». La regla final (`SKILL.md:200-204`) manda declarar las tres en `false` y no preguntar por herramientas.
- La captura `app1-confirmacion.png` muestra un clip que con el texto final no existiría.
- El informe (`docs/pruebas/…:36`) dice «Tres fricciones de esa ronda quedaron arregladas», pero no que esos arreglos no se volvieron a ensayar.

**Arreglo:** decirlo explícitamente en el informe y anotar que el clip de `app1-*` es de la regla anterior. Mejor todavía: una tercera corrida corta de un agente sobre la app con `src/`, con el acuerdo 2.

### P3-2 — El informe tiene dos «defectos fuera de la skill» que no lo son, y una captura mal nombrada

**Evidencia:**
- **Defecto 3** («`/__fake/state` no mostró las respuestas»): la ruta devuelve `requests`, como documenta `testing.md:42` («returns what your app asked»; código en `servidor-local.ts:68-69`). El `approve` está ahí: yo lo vi como pedido 5 con `optionId: "approve"`. Además, la frase de la línea 42 del informe («antes del clic el falso no registró ninguna respuesta») se apoya justamente en eso.
- **Defecto 5** («`diagnose --json` no imprime la línea»): con `--json` la terminal sólo imprime el JSON. Es lo esperado, y la skill ya dice que la línea se arma de `instalacion.ok/total`.
- **`capturas/app2-movil.png`** es idéntica byte a byte a `app2-reporte-enviado.png` (mismo md5 `29359eb8…`). No es una vista de móvil.

**Arreglo:**
- Quitar o reescribir los defectos 3 y 5.
- En la línea 42, citar que en `requests` no hay ninguna `respuesta` antes del clic.
- Borrar `app2-movil.png` o anotar que es la misma imagen; el informe ya dice que el móvil no se vio.

### P3-3 — Volver más tarde: faltan pasos, y un segundo registro choca con «no commitear `instalacion.json`»

**Evidencia:**
- `interfaz-propia.md:177-180` dice «read the new contract, change the interface and run the conformance checks again». No dice:
  - instalar la versión que da `interfaz_propia` ahora (sin eso, `node_modules` sigue con el contrato viejo);
  - reemplazar `checks.ts` por el nuevo, cosa que `conformance.md:21` pide;
  - volver a correr `install record` para que se anote el contrato nuevo. Sin eso, el punto 7 sigue en rojo para siempre, porque compara lo anotado (`diagnostico.ts:86-90`).
- Además, la skill pide no commitear `.supcoflow/instalacion.json` (`SKILL.md:326`), y `install record` se niega a reescribirlo si git no lo tiene: devuelve `archivo_no_versionado`, salida 4 (`instalacion.ts:147-151,286-287`). La skill no menciona ese caso. El mismo problema aparece si el agente tiene que volver a registrar en la misma sesión, por ejemplo después de agregar un archivo al arreglar la conformidad.

**Arreglo:**
- En «Coming back later», nombrar los tres pasos: instalar la versión nueva con mostrar antes, copiar el `checks.ts` nuevo sin editarlo, y `install record` otra vez.
- Agregar en el punto 10 o en la referencia: «si `install record` sale con `archivo_no_versionado` o `cambios_sin_commit`, decile a la persona que commitee o descarte `.supcoflow/instalacion.json`; no lo borres ni lo commitees vos».

### P3-4 — El «sí» a la propuesta no está definido; los dos agentes tropezaron con eso

**Evidencia:**
- `interfaz-propia.md:44` dice «Wait for the yes».
- `SKILL.md` punto 6 (`:210-214`) sólo dice «Show».
- El paso 5 (`SKILL.md:98-102`) pone las preguntas y la propuesta en el mismo momento, pero no dice si responder los paneles es aceptar la propuesta.
- Las dos transcripciones anotan «PREGUNTA SIN RESPUESTA PREVISTA: ¿aprobás esta propuesta?» (con `src/` §2.1, sin `src/` §2.4). Es el ítem 4 del pedido («mostrar antes de aplicar»).

**Arreglo:** una frase en el punto 6: «con una interfaz propia, la propuesta va en el mismo mensaje que los paneles, y las respuestas valen como sí sólo si la persona no corrige la propuesta», o bien un sí aparte, explícito. Elegir una y usarla igual en las dos referencias.

### P3-5 — «Nunca dejes elementos pelados» contradice «usá elementos simples» en una app sin sistema de diseño

**Evidencia:**
- `interfaz-propia.md:69-71` («Never leave its bare elements in the app: every `<button>`, `<textarea>`, `<section>` and `<details>` becomes the app's own component») y `:184` chocan con `:63` («If the app has none of these, use plain elements styled with the app's own CSS»).
- La app sin `src/` usa con razón `<button>` estilados con sus CSS Modules.
- La app con `src/` usa `<details>`/`<pre>` con tokens de Tailwind porque no tiene `Collapsible`.
- El escenario 8 (`08-…:22`) pide «ningún elemento pelado del esqueleto».

**Arreglo:** «cada elemento pasa a ser el componente de la app que hace eso; si la app no tiene uno, un elemento simple con el sistema de estilos y los tokens de la app, nunca el del esqueleto sin estilo».

### P3-6 — Qué archivos van en `install record --file`: tres versiones distintas

**Evidencia:**
- `SKILL.md:115` («one `--file` for each file of the chat»).
- `SKILL.md:327-329` («the ones you created for the chat and the one that mounts it»).
- `interfaz-propia.md:170-172` («the interface, its trigger, the conformance test… and the file that mounts it»).
- Por eso, el agente con `src/` anotó `checks.ts` y el test, y el sin `src/` anotó el `.module.css` y el layout (transcripción sin `src/`, fricción 8).
- `diagnose` marca en rojo un archivo anotado que ya no está (`diagnostico.ts:80`): anotar pruebas que la persona después mueve deja el punto 7 en rojo.

**Arreglo:** una sola lista, la misma en los dos archivos. Por ejemplo: los archivos de la interfaz (componentes y estilos), el del disparador si es otro, y el que la monta; las pruebas aparte o nunca.

### P3-7 — Cambiar el acuerdo de datos más tarde no dice nada de `capabilities`

**Evidencia:** la fila «Change what the chat sees about their users» (`SKILL.md:73`) pide aplicar «all of its table, including what changes in the app's code». La equivalencia para la interfaz propia (`SKILL.md:167-169`) habla de `user` y `autoContext`, pero no de `capabilities`. La regla «acuerdo 2 o 3 → las tres en `false`» (`SKILL.md:200-204`) sólo vive en el segundo panel.

**Impacto:** es bajo. La interfaz igual oculta lo que `state.allows` no deja, y el servidor sólo puede quitar. Pero el chat seguiría declarando herramientas que la persona ya no quiere.

**Arreglo:** sumar a la equivalencia: «y si la respuesta pasa a 2 o 3, `capabilities` con las tres en `false`; si pasa a 1, preguntá el panel de herramientas».

### P3-8 — Huecos chicos de la conformidad y del servidor falso para un agente

**Evidencia:**
- `conformance.md:29`: en el DOM de una prueba, un panel que sólo se oculta con una clase (`.hidden` de Tailwind) se ve abierto, y el check de cerrar falla. La referencia no lo dice.
- `conformance.md:21` pide vitest porque el `expect` de jest no sirve. La referencia (`interfaz-propia.md:131-136`) no dice qué hacer en una app que ya usa jest: ¿se suma vitest sólo para esto, con el sí de la persona?
- Si la app tiene un CSP con `connect-src`, el servidor falso (`http://127.0.0.1:4010`) queda bloqueado también en desarrollo. La referencia no lo menciona (`interfaz-propia.md:153-158`).

**Arreglo:** tres frases en el paso 5 de la referencia.

### P3-9 — El procedimiento para las apps del dueño no dice qué contestar cuando la skill frena por la instalación local

**Evidencia:** el procedimiento (`docs/pruebas/…:72-79`) usa el `.tgz` local. Con eso, la skill frena a propósito («that line cannot be committed»: `SKILL.md:312-314`). El paso 4 no dice qué responder; en el ensayo se respondió «instalala igual; nunca commitees package.json ni package-lock.json».

**Arreglo:** agregar esa respuesta al paso 4 y, en el paso 6, revisar también `package-lock.json`.

## Lo que se dice bien en el informe sobre lo que no se vio

El móvil, las etiquetas en castellano del servidor real, la captura de pantalla y el señalar un elemento, el lector de pantalla, el widget de respaldo en estas apps, y los niveles 2 y 3: todo eso está dicho tal cual (`docs/pruebas/…:51-59`). Los defectos reales de fuera de la skill también están bien anotados:

- la versión `2.3.1` en el `package.json` del sdk, que yo vi en la cabecera `x-supcoflow-sdk: core/2.3.1`;
- que los checks de P10 se saltan sin `words.pickElement`;
- que las grabaciones del servidor falso están sólo en inglés;
- que `nextjs.estado: "probando"` no está explicado.

## Recomendación

Hacer el merge local tal cual, o después de un commit chico que resuelva los P3 de texto: 3, 4, 5, 6, 7 y 8 en la skill (la huella se rehace, sigue siendo la 0.4.0 sin publicar), y 1, 2 y 9 en el informe. No hace falta una segunda vuelta por estos hallazgos. Si se hace la corrida corta de P3-1 y aparece algo nuevo, sí.

**Preguntas para el dueño:** ninguna. Todo lo de arriba es de redacción o de evidencia, no de producto.

**Lo que habría que hacer fuera de la skill** (fuera del alcance de esta revisión, ya anotado por T9): subir a `2.4.0` la versión del `package.json` del sdk antes de empaquetar.
