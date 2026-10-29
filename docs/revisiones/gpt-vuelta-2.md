# Revisión independiente — supcoflow skill 0.3.0, vuelta 2 (última)

**Versión revisada:** `fm/e1-skill`, commit `67cef923f1c8411957d2bcc5f7d211b06f8f0809` (`67cef92`). Base: `main` `4d3721e`; revisión anterior: `958e2677334795ed7bc3529fa820280ad39eb585`.

**Resultado:** los dos hallazgos anteriores están corregidos y sus regresiones se detectan; no encontré defectos nuevos en los cambios de esta vuelta. Aprobación del código y los textos revisados, no de su publicación ni de las verificaciones de integración pendientes.

## Hallazgos

No encontré hallazgos nuevos P1, P2 ni P3. Los dos de la vuelta 1 quedan cerrados con la evidencia siguiente.

## Qué verifiqué correcto

### 1. Resolución del P2: la prueba de navegador ya no exige la promesa de 1B

- **Texto corregido:** `skills/supcoflow/referencias/prueba.md:44–48`. Si no se autorizaron capturas, manda no adjuntar ninguna para probar. El botón puede seguir apareciendo y eso no constituye un fallo de esta etapa. Explica que el acuerdo actúa al guardar y sobre la IA que investiga, no sobre lo que ve la IA del chat. Prohíbe informar **ese comportamiento del botón** como fallo de privacidad o modificar el widget para esconderlo.
- Coincide con `skills/supcoflow/SKILL.md:89–92`, AD2 y T4.2 del plan 1A. No encontré otra instrucción que vuelva a exigir ocultar capturas o señalar elementos según el acuerdo.
- **Control positivo específico:** `test/skill.test.ts:548–554` recorta la sección de nivel 2 y exige las cuatro partes de la salvedad. No se limita a comprobar la pregunta principal.
- **Control negativo y control del control:** `test/skill.test.ts:432–435,531–546` aplica el detector a todos los textos de la skill y prueba cuatro formulaciones incorrectas, incluida la frase original, junto con dos formulaciones válidas.
- **Regresión reproducida sólo en memoria:** reemplacé el párrafo nuevo por “If they did not allow them, the chat must not offer to attach one: check that.” Fallan exactamente estos dos casos:
  ```text
  ninguna frase de la promesa de 1B (skill 0.3.1) en el texto
  la prueba de nivel 2 (captura) conserva la salvedad de 1A: sin permiso no se adjunta, el botón puede seguir
  ```
  El resto de los 90 casos de sólo lectura pasa. No escribí la mutación en el repositorio.

### 2. Resolución del P3: los flags se contrastan contra su comando

- `test/skill.test.ts:95–106` construye el conjunto por comando desde el vector real, sumando los globales. `comandoDe`, en `:171–176`, resuelve los nombres de una y dos palabras; `flagsInventados`, en `:183–201`, busca la invocación que contiene cada flag y usa ese conjunto, no la unión de todos los comandos. Fuera de invocaciones mantiene el tratamiento anterior.
- `test/skill.test.ts:280–288` incluye los casos negativos y positivos solicitados. Ejecuté las funciones reales del test en memoria:
  ```text
  supcoflow widget --ceiling 2 --json                       → ["--ceiling"]
  supcoflow guide check --authorize-spend --json            → ["--authorize-spend"]
  supcoflow --json guide check --authorize-spend            → ["--authorize-spend"]
  supcoflow test --allow nothing                           → ["--allow"]
  supcoflow whoami && supcoflow widget --expect-policy save → ["--expect-policy"]
  supcoflow guide check --json                             → []
  supcoflow data set --allow nothing                       → []
  ```
- Contrasté la regla con la terminal `750820c`: `src/cli.ts:42–54` y `src/flags-por-comando.ts` rechazan el flag que no aplica antes de crear el entorno. `ceiling`, `expectPolicy` y `authorizeSpend` pertenecen a `test`; `allow`, a `data set`.
- **Regresión reproducida sólo en memoria:** cambié el primer `supcoflow widget --json` de `SKILL.md` a `supcoflow widget --ceiling 2 --json`. Falla `SKILL.md: cada --flag existe`, con el valor `['--ceiling']`; los otros 89 casos de sólo lectura pasan.
- El control es un analizador de los ejemplos documentados, no un parser completo de shell. No atribuyo a sus expresiones regulares una garantía general sobre cualquier comando o cualquier frase futura.

### 3. Alcance, historial y fuentes reales

Leí el pedido completo `/Users/germanflores/firstmate/data/e1-skill/revision-pedido.md`, el informe anterior completo y el README del repositorio, incluida su versión actualizada después del checkout. No hay instrucciones `CLAUDE.md` ni `AGENTS.md` en la raíz de este árbol.

Comandos de alcance ejecutados en el worktree de revisión:

```text
git -C /Users/germanflores/.treehouse/skills-7f6d2e/2/skills checkout --detach fm/e1-skill
git -C /Users/germanflores/.treehouse/skills-7f6d2e/2/skills log -1
→ 67cef923f1c8411957d2bcc5f7d211b06f8f0809

git -C /Users/germanflores/.treehouse/skills-7f6d2e/2/skills diff 958e267..67cef92
git -C /Users/germanflores/.treehouse/skills-7f6d2e/2/skills diff --stat main..fm/e1-skill
```

La vuelta 2 contiene dos commits: `0c07322` (informe anterior) y `67cef92` (correcciones). Son cuatro archivos modificados desde `958e267`: informe, referencia de prueba, tests y huella. Comparé el informe commiteado `docs/revisiones/gpt-vuelta-1.md` con el informe recibido: **idénticos byte a byte**. El historial completo tiene ocho commits sobre `main`; `merge-base --is-ancestor main 67cef92` confirma que `main` es ancestro. `git diff --check main..fm/e1-skill` no informa errores y `git status --short` queda vacío.

Fuentes contrastadas, usando exclusivamente lecturas `git -C … show/log/grep` en los otros repositorios:

- Motor `/Users/germanflores/firstmate/projects/supcoflow`, `fm/e1-plan-1a` @ `80d18d9c1077ea92f296d9643aed5e15a5277c18`: plan `docs/superpowers/plans/2026-10-28-la-landing-es-verdad-etapa-1a.md`, F4/T4.1–T4.5, §6/V-K y condiciones de publicación; adenda `docs/superpowers/specs/2026-10-28-la-landing-es-verdad-etapa-1a-addendum.md`, incluidos AD2, AD9 y AD6. AD6 no introduce una tarea nueva en esta skill.
- Mismo repo, rama `landing-es-verdad-etapa-1`: diseño original `2026-10-28-la-landing-es-verdad-etapa-1-design.md`, §10–§10.3, y plan original T4.1–T4.5, subordinando la promesa de privacidad original a AD2.
- `fm/e1-motor` sigue en `07885c7a38393a317354e19acd64d58d3dcbae0e`; `fm/e1-terminal`, en `/Users/germanflores/firstmate/projects/cli`, sigue en `750820c155bf002de30cfa8e90d2afafc027e9a5`. Son las fuentes que identifica el pedido.

### 4. Copias, contratos y resto del texto

Volví a comparar las copias contra las fuentes con `git show`, sin escribir archivos:

| Copia de la skill | Fuente | Resultado |
|---|---|---|
| `test/vectores/guia-de-ejemplo.md` | motor `07885c7a:src/guia/vectores/guia-de-ejemplo.md` | Iguales byte a byte; SHA-256 `5a3e96c98f5a7fe05791084bf56520f17cfcc696f135045584515024f9e897ad` |
| `test/vectores/motivos-del-motor.json` | motor `07885c7a:src/guia/vectores/motivos.json` | Iguales byte a byte; SHA-256 `f73cd4306b2e13cbdb79ea34b504c3ec21543459be683c68998577a491445674` |
| `test/vectores/describe-0.8.0.json` | descripción pura de terminal `750820c:src/comandos/describir.ts`, con `src/contrato.ts` | Salida reconstruida igual byte a byte: 17.730 bytes; SHA-256 `753a70736840548baff920368cabf08ce37664826558565531e101d9f470200f` |

Para la última fila ejecuté únicamente las funciones puras de esos textos en `node:vm`, luego de transformar TypeScript en memoria; no ejecuté el entrypoint de la terminal, su entorno ni un `dist/cli.js`. La comparación con la terminal **construida** sigue correspondiendo a V-K antes de publicar.

Releí `SKILL.md` y las tres referencias completas. Se mantienen correctos:

- Inglés en las instrucciones y referencias, nombres canónicos de comandos y flags, terminal fijada a `0.8.0`, skill `0.3.0` y “Talk to the person in the language they use”. Las claves y códigos internos del contrato pueden seguir en castellano.
- Las tres preguntas y opciones literales, techo/saldo/tope obtenidos sin autorización, sí a **una** prueba con los valores mostrados y la política ofrecida, sin elegir un número releído; ante `techo_distinto` o `politica_distinta`, se pregunta de nuevo (`SKILL.md:118–125`). Contrasté el envío real con terminal `750820c:src/comandos/probar.ts:170–188,198–231,234–260`.
- Diagnóstico 6 de 6 y listo antes del gasto, autorización explícita de nivel 3, advertencia y permiso separados para el costo de la IA del chat en nivel 2, sin mandar reportes reales como parte de esa prueba. No encontré una autorización nueva de gasto, publicación externa o acción de producción agregada en esta vuelta.
- Reglas del negocio con el diff y el mensaje exacto del commit, antes del commit; si aporta reglas, nueva validación y nuevo diff. No se deducen del código. Se conserva el commit limitado a la guía y la prohibición de push (`SKILL.md:158–177`).
- Orden de elección del wrapper, actualización en su lugar, casos de no pisar y `install record --file` con el archivo realmente usado. El contrato del motor `07885c7a:src/widget/instalacion.ts` mantiene ambos nombres dentro de `nextjs` y el componente `ChatDeSoporte`; la terminal pasa esos campos y registra `archivo` (terminal `750820c:src/api.ts:393–416`, `src/comandos/instalacion.ts`, `src/instalacion.ts`).
- La referencia de Next.js distingue el build histórico de la prueba futura con 2.3.0. Contrasté `landing-es-verdad-etapa-1:docs/verificaciones/2026-10-17-la-skill-y-nextjs.md:288–308`: build 0 con wrapper y 1 al importar directamente, error `useRef is not a function`.
- El seguimiento conserva la misma prueba, no relanza `arranque_incierto` desde la terminal y no convierte gasto pendiente o perdido en cero.

**No cambia la salvedad de la vuelta 1:** el motor citado aún declara widget **2.2.1**; T2.11 pospone el cambio a 2.3.0 hasta después de P2. Esta revisión no certifica que el widget 2.3.0 ya se instale, que V-K completo sea SÍ, ni que las verificaciones reales de `/supcoflow go` hayan ocurrido. Son gates de entrega/publicación, no una regresión de esta corrección.

### 5. Pruebas y huella: alcance exacto de mi validación

**No corrí `npm test` con Vitest ni instalé dependencias.** Este worktree no tiene `node_modules`; además, dos tests crean copias temporales. El contrato de esta revisión prohíbe escribir archivos. Los **92 tests verdes** del pedido son el resultado declarado por el autor, no una ejecución oficial repetida por mí. `package.json:6–8` no declara typecheck.

Ejecuté los cuerpos de los tests de sólo lectura con un arnés efímero en memoria: Node `v24.12.0`, `stripTypeScriptTypes`, `node:vm` y aserciones equivalentes a los matchers usados. Las funciones de escritura y procesos quedaron bloqueadas; omití los dos casos que crean copias temporales. Resultado del arnés corregido:

```text
90 pasan; 0 fallan; 2 omitidos por escritura.
```

Además de las dos regresiones principales, repetí cuatro mutaciones sólo en memoria: pregunta 3, prohibición de releer el techo, orden de elección del archivo y salvedad de lo que ve la IA del chat. Cada una hace fallar su test semántico correspondiente. No presento este arnés como sustituto de Vitest.

Ejecuté sin opciones de escritura:

```text
node /Users/germanflores/.treehouse/skills-7f6d2e/2/skills/scripts/huella.mjs
→ version: 0.3.0
→ huella: 55af411baf91aa8a7502466d11f1671004a34e7040b25b1949f40f02129611bf
```

Coincide con `test/vectores/huella-de-la-skill.json:1–4`. La versión no cambia y la huella sí incluye el párrafo corregido. Revisé el diff de `scripts/huella.mjs` contra main: conserva el algoritmo y mueve la excepción a la versión 0.3.0 sin publicar. Ejecuté su rama de escritura en un entorno virtual que captura la intención de escribir, sin hacerla:

```text
registro previo 1.0.0 + --sin-subir-version → salida 1, cero escrituras intentadas
registro previo 0.3.0 + --sin-subir-version → salida 0, una actualización virtual de la huella
```

La excepción debe retirarse o moverse al publicar, como ya advierte el propio script. No comprobé el estado de publicación con una consulta de red.

No modifiqué ni creé archivos en ningún repositorio, no hice commits, no pedí otra revisión, no instalé paquetes, no inicié sesión, no gasté y no accedí a producción. La única escritura de entrega es este informe, además de los registros de estado autorizados.

**Recomendación para firstmate:** dar por resueltos P2 y P3 y aceptar la vuelta 2 de L4. No identifico otro arreglo que deba implementarse en esta rama. Conservar los resultados oficiales del autor y mantener los gates de V-K, integración y permiso de publicación del plan; esta aprobación no los reemplaza.

## Preguntas que sólo puede contestar el dueño

Ninguna nueva. Las correcciones aplican decisiones ya tomadas; no requieren elegir un comportamiento de producto ni autorizar gasto o publicación. No se solicita una tercera vuelta.

aprobado
