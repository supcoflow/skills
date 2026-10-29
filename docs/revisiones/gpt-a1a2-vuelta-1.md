# Revisión independiente GPT — A1, A2 y A4 de la skill supcoflow

**Versión revisada:** `0.3.0`, rama `fm/e1-skill`, commit `d5fa3f9cb276563056dcede312bb88d087d9a550`.

**Resultado:** requiere otra vuelta: el nuevo comienzo obligatorio con `config` frena una instalación nueva y hay que aclarar qué preguntas omiten los caminos cortos.

## Hallazgos

1. **P1 — El nuevo comienzo con `config` no contempla un repo que todavía no tiene proyecto.**
   - **Referencia:** `skills/supcoflow/SKILL.md:44–45`, aplicado a la fila de instalación de `:53`.
   - **Qué pasa:** todas las filas deben empezar por `supcoflow config --json`, pero sólo se explica cómo continuar si devuelve 2. La terminal real devuelve **4, `sin_proyecto`** cuando ese repo aún no tiene proyecto. La regla general de la skill (`:35`) ordena detenerse y esperar a una persona ante un 4. Por eso el nuevo mapa impide llegar al paso 2 del orden completo, que justamente conecta el repo y crea el proyecto.
   - **Caso concreto:** una app nueva, con sesión válida y remoto git, recibe `/supcoflow go`. El primer `config` responde que no hay proyecto y el asistente se detiene; no llega a `repo connect` / `project create`. Es precisamente el estado inicial permitido por `docs/escenarios/01-src-app.md:6`.
   - **Evidencia real:** en la terminal `fm/e1-terminal` @ `19d210b`, `src/comandos/configurar.ts:42–44` llama a `proyectoDelRepo`; `src/comandos/proyecto-del-repo.ts:28–30` devuelve `SALIDA.haceFaltaUnaPersona` con `error: "sin_proyecto"`; `src/contrato.ts:10` fija ese código en 4. Reproduje esa respuesta ejecutando esas funciones reales en memoria con dependencias falsas y sin red: `{"codigo":4,"json":{"ok":false,"error":"sin_proyecto",…}}`.
   - **Arreglo propuesto:** mantener `config` como primera lectura, pero agregar una excepción **sólo para `error: sin_proyecto`**: en el camino de instalación continuar por la conexión/creación del paso 2 y volver a leer `config`. Para los pedidos parciales, explicar que falta la instalación y ofrecer ese camino, sin crear cosas por una petición de diagnóstico. No convertir todos los códigos 4 en permiso para continuar. Agregar un test que fije ese caso; el test nuevo de `test/skill.test.ts:705–710` sólo exige que aparezca la orden inicial y hoy no controla cómo se sale de este estado.

2. **P2 — Las prohibiciones absolutas de hacer más preguntas chocan con permisos y preguntas obligatorias de las secciones a las que envían.**
   - **Referencia:** `skills/supcoflow/SKILL.md:50–51`; tests que fijan esas frases en `test/skill.test.ts:716–717`.
   - **Qué pasa:** «Update the guide» manda a los puntos 8 y 9, pero termina con **“Nothing else is asked”**. El punto 9 exige preguntar por las reglas del negocio y pedir permiso antes del commit (`:171–184`); el punto 7 también exige consultar antes de tocar un archivo con cambios de la persona (`:151–155`). La fila de datos dice **“No other question”**, mientras el punto 5 sigue ordenando incondicionalmente **“These three, in one panel”** (`:102`). No queda explícito que se omiten sólo las preguntas de configuración ajenas al pedido, no los permisos de seguridad.
   - **Caso concreto:** la persona pide «actualizá la guía» con `.supcoflow/guide.md` modificada a mano, como en el escenario 4. Un asistente que tome literalmente “Nothing else is asked” puede omitir la consulta antes de sobrescribir o antes del commit, o no preguntar los plazos/reembolsos que el punto 9 exige. En el camino de datos, otro asistente puede obedecer el punto 5 y volver a ofrecer política y prueba, aunque el mapa se lo prohíbe. No afirmo que estos comportamientos se hayan observado con un asistente real: la contradicción está en las instrucciones nuevas.
   - **Arreglo propuesto:** reemplazar las frases absolutas por algo como «no preguntes por datos, política ni prueba; conservá las consultas y permisos de los puntos 7 y 9». Aclarar que el panel de tres preguntas del punto 5 corresponde al recorrido completo y a lo que falte fijar; el cambio de datos usa sólo su primera pregunta, su advertencia de alcance y **toda** su tabla de aplicación, incluido el código de la app. Los permisos antes de tocar archivos siguen vigentes en todos los caminos. Actualizar los tests para fijar esta distinción, en lugar de exigir las prohibiciones ambiguas actuales.

3. **P3 — El escenario de la guía permite un pedido parcial, pero no prepara el chat que la lista común exige.**
   - **Referencia:** `docs/escenarios/04-guia-sin-commitear.md:3–10,24`, junto con `docs/escenarios/README.md:34`.
   - **Qué pasa:** la app de ejemplo sólo exige Next.js, una guía y cambios de git. El pedido puede ser «actualizá la guía». Con el nuevo mapa, ese pedido no instala el componente, pero la lista común exige terminar con un chat montado.
   - **Caso concreto:** se prepara literalmente una app sin chat, con proyecto de prueba y `guide.md` ya existente. El asistente actualiza y publica correctamente la guía, sin instalar nada ajeno al pedido. La comprobación común lo marca como fallo por no haber un chat, aunque siguió el mapa.
   - **Arreglo propuesto:** para la variante «actualizá la guía», exigir en la preparación un chat ya instalado y un proyecto conectado; o separar esa variante y aclarar que conserva el estado del chat y no lo instala. Se puede mantener `/supcoflow go` como variante de instalación completa.

## Qué verifiqué correcto y cómo

### Alcance y fuentes

- Leí completos el pedido `/Users/germanflores/firstmate/data/e1-skill/revision-pedido.md`, el informe `/Users/germanflores/firstmate/data/skill-vercel/report.md`, el README del repo, `SKILL.md`, sus tres referencias y los tests. Tomé **A1, A2 y A4** de la sección «Ideas para supcoflow» como especificación; A3 queda fuera.
- En mi worktree `/Users/germanflores/.treehouse/skills-7f6d2e/2/skills` ejecuté `git checkout --detach fm/e1-skill` y confirmé el commit completo indicado arriba. Revisé únicamente `git diff c96792d..d5fa3f9`: los commits `b312dd0` y `d5fa3f9`. No reabrí la aprobación de `c96792d` ni hice observaciones sobre problemas anteriores a ese rango.
- Contrasté las afirmaciones relevantes con la terminal `/Users/germanflores/projects/Supcoflow/cli`, rama `fm/e1-terminal` @ `19d210b`, y con el motor en la ruta que firstmate autorizó por bandeja: `/Users/germanflores/.treehouse/Supcoflow-6848a7/1/Supcoflow`, rama `fm/e1-motor` @ `07885c7a`. En esos repos usé exclusivamente lecturas `git show`, `git log` y `git grep`. No ejecuté sus tests, ni su terminal contra una cuenta, ni sus bases de datos.

### A1 y A2

- El mapa está antes del recorrido completo, tiene las cinco filas pedidas y conserva `config` como primera lectura. Los destinos existen: puntos 5, 8 y 9; pasos 6 y 9; y `referencias/prueba.md`.
- No agrega un comando de gasto al diagnóstico ni al cambio de guía/datos. La fila de prueba remite a la referencia existente y conserva el sí propio del nivel 3. Las reglas de techo/política, no reutilizar autorizaciones y no relanzar `arranque_incierto` no fueron modificadas. Los hallazgos anteriores se refieren al recorrido y la claridad del texto, no a un gasto que haya ocurrido.
- La descripción tiene **414 caracteres**, incluye todos los disparadores pedidos y la exclusión explícita de otros proveedores y de construir un chat desde cero. Es un escalar YAML llano válido: no tiene `: ` ni ` #` dentro del valor. No hay una prueba con un modelo real que permita prometer activación perfecta; el cambio sí satisface la forma textual pedida.
- `git diff --name-only c96792d..d5fa3f9 -- skills/` devuelve solamente `skills/supcoflow/SKILL.md`; su diff contiene únicamente la descripción y el mapa. No entró A3 ni cambiaron las referencias.

### A4

- Hay seis escenarios, con los tres apartados pedidos y enlaces desde el índice. Dicen expresamente **«escritos, no corridos»**. No los corrí: ese gasto y esa operación no forman parte del encargo.
- El caso `src/app` coincide con los puntos 3 y 10 y con la referencia de Next.js: wrapper dentro de `src/app`, layout real y `--file` del archivo usado. Las tres variantes de CSP conservan las fuentes existentes, no duplican `connect-src` y no agregan CSP donde no había.
- La actualización del chat anterior coincide con los nombres y el componente reales de `motor/src/widget/instalacion.ts:28–36,82–94`: `chat-de-soporte.tsx`, `support-chat.tsx` y `ChatDeSoporte`. La lectura de instalación v1 como archivo no registrado y el fallback al layout coinciden con `cli/src/instalacion.ts:123–133` y el punto 10 de la skill.
- Las expectativas sobre guía sucia/ignorada/nombre viejo, commit limitado a la guía y aviso de que subirla a GitHub queda a cargo de la persona reflejan los puntos 7–9. La preparación insuficiente de la variante parcial está señalada en el hallazgo 3.
- El «no» a la prueba conserva la lectura previa de números sin autorizar, no presenta una ejecución como exitosa y no permite usar ese no como autorización futura. La reanudación se basa en `config` y en actualizar el chat en su lugar. La idempotencia de la publicación con el mismo contenido está respaldada por `motor/src/guia/publicar.integration.test.ts:254–265`; la terminal conserva `ya_publicada` en `src/comandos/guia.ts:200–203`.
- La lista común prohíbe `git push`, `git add .`, `git commit -a` y `--force`, limita el resumen y exige permisos para gasto y commit. Son criterios escritos, no evidencia de haber pasado una corrida real.

### Validaciones ejecutadas sin escribir archivos del repo

1. **Tests:** corrí Vitest por su API en memoria con `config: false`, `cache: false`, `watch: false`, raíz absoluta y `testNamePattern: '^(?!--sin-subir-version)'`. Resultado:
   ```text
   Test Files  1 passed (1)
        Tests  105 passed | 2 skipped (107)
   ```
   Están incluidas las **15 pruebas nuevas** del diff: 6 de A1/A2 y 9 de A4 contando los seis casos de `it.each`. Omití únicamente los dos tests preexistentes de `--sin-subir-version`, porque crean copias temporales y escriben archivos fuera de los entregables permitidos. Por tanto, **no presento esto como una repetición íntegra de `npm test` con 107 verdes**. No hay script de typecheck en `package.json`.
2. **Cobertura textual:** revisé las aserciones nuevas. Exigen la exclusión de proveedores, las filas, el inicio con `config`, los destinos y los seis documentos. No son pruebas de comportamiento del asistente ni detectan el estado `sin_proyecto`; además, hoy fijan las frases ambiguas del hallazgo 2. No repetí las mutaciones declaradas por el autor ni doy esa declaración por ejecución propia.
3. **Huella:** `node /Users/germanflores/.treehouse/skills-7f6d2e/2/skills/scripts/huella.mjs` imprimió:
   ```json
   {"version":"0.3.0","huella":"a9eea7ceac724d6263a1e0e5633b648c19e829a16bbc35556e85521debd28ff3"}
   ```
   Coincide con `test/vectores/huella-de-la-skill.json`. Los escenarios viven fuera de `skills/`, así que no alteran la huella.
4. **Contraste con fuentes reales:** un script Node en memoria leyó con `git show` las funciones de configuración de la terminal y las ejecutó con sesión/repositorio/proyecto falsos, sin red, para reproducir el hallazgo 1. También comparó byte a byte la guía de ejemplo y los motivos con `fm/e1-motor`: coinciden con sus vectores locales; SHA-256 respectivos `5a3e96c98f5a7fe05791084bf56520f17cfcc696f135045584515024f9e897ad` y `f73cd4306b2e13cbdb79ea34b504c3ec21543459be683c68998577a491445674`.
5. **Limpieza:** `git diff --check c96792d..d5fa3f9` terminó sin salida y `git status --porcelain` quedó vacío. No edité ni creé archivos del repositorio, no hice commits, no publiqué, no hice push, no pedí login y no toqué producción. El único archivo de entrega es este informe, además de los estados y el acuse de la bandeja autorizados por el brief.

**Recomendación:** corregir los hallazgos 1 y 2 en esta misma versión sin publicar, ajustar la preparación del escenario 4, rehacer la huella si cambia `SKILL.md` y pedir la segunda vuelta sobre el nuevo diff. Son correcciones técnicas concretas; no requieren una decisión de producto del dueño.

## Preguntas que sólo puede responder el dueño

Ninguna nueva. A1/A2/A4 en la 0.3.0, A3 fuera y escenarios sólo escritos ya están decididos en el pedido. No se solicita autorización para ejecutar escenarios, gastar ni publicar.

requiere otra vuelta
