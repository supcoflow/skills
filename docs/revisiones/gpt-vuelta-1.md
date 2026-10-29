# Revisión independiente — supcoflow skill 0.3.0, vuelta 1

**Versión revisada:** `fm/e1-skill`, commit `958e2677334795ed7bc3529fa820280ad39eb585` (`958e267`), contra `main` `4d3721e`.

**Resultado:** requiere corregir una contradicción de privacidad en la prueba de navegador antes de publicar; además hay una mejora menor pendiente en el control de flags.

## Hallazgos

1. **P2 — La prueba de navegador todavía exige una promesa de 1B que 1A no cumple.**
   - **Dónde:** `skills/supcoflow/referencias/prueba.md:44–45`; el control que no lo detecta está en `test/skill.test.ts:489–494`.
   - **Qué pasa:** dice literalmente: “If they did not allow them, the chat must not offer to attach one: check that.” Es lo contrario de `skills/supcoflow/SKILL.md:89–92`, que explica correctamente que el chat siempre ofrece capturas y señalar elementos, aunque el acuerdo los rechace. AD2 y T4.2 del plan 1A exigen conservar esa salvedad, no sólo en la pregunta principal. El test llamado “ninguna frase de la promesa de 1B” busca únicamente tres formulaciones concretas; no reconoce esta otra formulación que ya está en el texto.
   - **Escenario concreto:** la persona elige “Only what they type” y luego autoriza la prueba de nivel 2. El widget de 1A muestra el botón de captura, como está previsto. El asistente sigue esta referencia, lo informa como un fallo de privacidad o propone modificar el widget para esconderlo. Se termina juzgando o cambiando 1A según un requisito que fue postergado expresamente a 1B.
   - **Arreglo propuesto:** reemplazar esa última instrucción por la salvedad de 1A: si no se autorizaron capturas, no adjuntar ninguna para probar; su botón puede seguir apareciendo y eso no es un fallo de esta etapa. Explicar que el acuerdo actúa al guardar y sobre la IA que investiga, no sobre lo que ve la IA del chat. Añadir un test positivo sobre el texto de **nivel 2**, además de un control negativo que detecte esta formulación de “must not offer”. Rehacer la huella de la 0.3.0 sin publicar. Este arreglo debe entrar antes de publicar la skill y antes de usar ese nivel de prueba.

2. **P3 — Los tests aceptan flags reales colocados en comandos que los rechazan.**
   - **Dónde:** `test/skill.test.ts:89–94,160–168` (uso del conjunto global `FLAGS_CONOCIDOS`); `test/skill.test.ts:245–255` (casos de control).
   - **Qué pasa:** la lista de flags se junta entre todos los comandos. El validador comprueba que el nombre exista en algún lugar, pero no que pertenezca al comando de esa invocación. Lo reproduje ejecutando las funciones del propio test, sin escribir archivos:
     ```text
     `supcoflow widget --ceiling 2 --json`
       comandosInventados → []; flagsInventados → []
     `supcoflow guide check --authorize-spend --json`
       comandosInventados → []; flagsInventados → []
     ```
     La terminal real de `750820c` hace una validación por comando: `src/cli.ts:42–54` consulta `flagQueNoAplica`; `src/flags-por-comando.ts` reserva `authorizeSpend`, `ceiling` y `expectPolicy` a `test`. Esas invocaciones terminan con salida 3, `flag_no_aplica`, antes de armar el entorno.
   - **Escenario concreto:** una edición futura pone `--ceiling` en `widget` o copia `--authorize-spend` a `guide check`; el control “cada --flag existe” sigue verde aunque la instrucción ya no pueda ejecutarse. El segundo caso también queda fuera del control que busca `test … --authorize-spend`, porque no contiene `test`.
   - **Arreglo propuesto:** resolver primero el comando de cada invocación y validar sus flags contra los de **ese comando** en `describe`, más los globales. Añadir ambos casos negativos. El texto actual no contiene esas invocaciones erróneas: es una debilidad del control, no un gasto sin permiso observado.

## Qué verifiqué correcto

### Alcance, fuentes y sólo lectura

- Leí completo el pedido `/Users/germanflores/firstmate/data/e1-skill/revision-pedido.md` y el README del repositorio. No hay `CLAUDE.md` ni `AGENTS.md` en este árbol de la skill.
- Ejecuté el checkout solicitado en el worktree de revisión:
  ```text
  git -C /Users/germanflores/.treehouse/skills-7f6d2e/2/skills checkout --detach fm/e1-skill
  git -C /Users/germanflores/.treehouse/skills-7f6d2e/2/skills log -1
  → 958e2677334795ed7bc3529fa820280ad39eb585
  ```
- Revisé el diff `main..fm/e1-skill`, sus archivos completos y `git diff --check` (sin errores). `git status --short` quedó vacío. El pedido dice siete commits sobre main; `git rev-list --count main..fm/e1-skill` devuelve **6**. No cambia el alcance: revisé el commit y el diff solicitados.
- Contrasté el plan 1A en `supcoflow`, rama `fm/e1-plan-1a` @ `80d18d9c`: §6/V-K, §8/V-GO, F4/T4.1–T4.5 y el orden de publicación. Leí la adenda, incluidos AD2, AD9 y AD6. Contrasté también el diseño original §10–§10.3 y las tareas originales T4.1–T4.5 de `landing-es-verdad-etapa-1` @ `9c44be46`. Las lecturas de otros repos se hicieron mediante `git -C … show/log/grep`, sin cambiar esos árboles.
- No instalé dependencias, no ejecuté login, no hice peticiones a producción, no publiqué, no gasté ni modifiqué archivos de repositorios. No pedí otra revisión: ésta es la revisión independiente solicitada.

### Copias y contratos reales

Leí las fuentes con `git show` y comparé los bytes en memoria:

| Control | Fuente | Resultado |
|---|---|---|
| `test/vectores/guia-de-ejemplo.md` | motor `07885c7a:src/guia/vectores/guia-de-ejemplo.md` | Iguales byte a byte; SHA-256 `5a3e96c98f5a7fe05791084bf56520f17cfcc696f135045584515024f9e897ad` |
| `test/vectores/motivos-del-motor.json` | motor `07885c7a:src/guia/vectores/motivos.json` | Iguales byte a byte; SHA-256 `f73cd4306b2e13cbdb79ea34b504c3ec21543459be683c68998577a491445674` |
| `test/vectores/describe-0.8.0.json` | terminal `750820c:src/comandos/describir.ts`, con `SALIDA` de `src/contrato.ts` | Salida reconstruida en memoria igual byte a byte: **17.730 bytes**, incluido el salto final |

Para el último control usé `node:module.stripTypeScriptTypes` de Node `v24.12.0` y `node:vm` sobre el texto devuelto por `git show`: ejecuté solamente la descripción pura, no el entrypoint de la terminal ni su entorno. **No reconstruí ni ejecuté un `dist/cli.js`**; la igualdad contra el build final sigue siendo el control V-K previo a publicar.

- La guía de ejemplo aparece literalmente en `referencias/guia.md`. Los motivos de `motivos-de-la-guia.json` coinciden exactamente con la copia del motor y la tabla tiene una fila para cada uno; leí también el parser real `07885c7a:src/guia/formato.ts` y las indicaciones de reparación.
- Los comandos y flags que efectivamente aparecen en la skill existen y corresponden a la terminal 0.8.0; no encontré invocaciones castellanas. La salvedad del hallazgo 2 afecta la fuerza del test, no este inventario actual.
- El motor `07885c7a:src/widget/instalacion.ts` mantiene `ChatDeSoporte`, el nombre nuevo `app/_supcoflow/support-chat.tsx` y el anterior dentro de `nextjs`; la skill y `referencias/nextjs.md` coinciden. **La constante del widget en ese commit del motor todavía es 2.2.1**, no 2.3.0: es el cambio expresamente pendiente hasta después de P2 en T2.11. No doy por cumplida la publicación ni la instalación real de 2.3.0.
- La afirmación histórica sobre el wrapper tiene evidencia: `landing-es-verdad-etapa-1:docs/verificaciones/2026-10-17-la-skill-y-nextjs.md`, sección L1-R7, registra `next build` 0 con wrapper y 1 al importar `ChatDeIntake` directamente, con `useRef is not a function`. La referencia distingue correctamente ese ensayo histórico de una verificación futura con la nueva versión.

### Escena, permisos y seguridad del flujo

- Las tres preguntas y sus opciones están en el orden y con los textos literales del plan; los números salen del `test --json` sin autorización. Se conserva “Talk to the person in the language they use”. La pregunta principal contiene correctamente la salvedad de AD2; la excepción encontrada está en la referencia de nivel 2.
- El sí final se vincula a **una** prueba, con el techo mostrado y la política ofrecida, mediante `--ceiling` y `--expect-policy`; no se permite elegir un número releído. `techo_distinto` y `politica_distinta` obligan a preguntar de nuevo. Contrasté esto con `750820c:src/comandos/probar.ts`: el pedido autorizado usa esos valores y no relee el diagnóstico para elegirlos.
- El diagnóstico exige 6 de 6 y estar listo antes del paso que gasta. La referencia de nivel 2 advierte el costo de la IA del chat y exige permiso antes; el nivel 3 exige el sí explícito. No encontré un comando actual que autorice gasto sin ese sí.
- Las reglas del negocio van en el mismo mensaje que el diff y el mensaje exacto de commit, antes del commit; si la persona añade reglas, se vuelve a validar y mostrar el diff. Se conserva “Never deduce them from the code”. El commit usa sólo la ruta de la guía, sin tomar archivos ajenos del índice; nunca se hace push.
- El orden para elegir el wrapper y las reglas de no pisar contienen los casos pedidos: cambios sin commit, borrado registrado, symlink y archivo no versionado. `install record` lleva `--file`; contrasté su contrato y las validaciones de la terminal real. No se renombra ni borra la guía antigua automáticamente.
- La referencia mantiene el seguimiento de la misma prueba, la prohibición de relanzar `arranque_incierto` desde la terminal y el tratamiento de cobro pendiente/perdido como desconocido, nunca cero.
- Los cuatro archivos de instrucciones y referencias están en inglés, conservando nombres de campos y códigos del contrato. No encontré texto castellano de instrucciones pendiente de traducir.

### Pruebas y huella: qué corrí y qué no

**No repetí `npm test` con Vitest.** Este worktree no tiene `node_modules`; instalarlo violaría la condición de sólo lectura. Además, dos tests del propio archivo crean directorios y copias temporales. Los “90 verdes” del pedido siguen siendo evidencia aportada por el autor, no una corrida oficial de este revisor. `package.json` no declara typecheck.

Para revisar los tests sin escribir, ejecuté sus cuerpos con un arnés efímero **en memoria**, usando `node:vm`, `stripTypeScriptTypes` y aserciones de Node equivalentes a los matchers utilizados. Bloqueé las funciones de escritura y procesos. Resultado:

```text
88 casos ejecutados: 88 pasan, 0 fallan.
2 casos que crean copias temporales: omitidos en ese arnés.
```

No presento ese resultado como una corrida de Vitest. Sirve para contrastar las aserciones y comprobar mutaciones sin alterar el repo. Cuatro cambios sólo en memoria produjeron cada uno el fallo semántico esperado:

```text
Cambiar el texto de la pregunta 3 → falla su test literal.
Cambiar “Never a number you re-read” → falla el test del techo autorizado.
Cambiar el primer número del orden de elección de archivo → falla el test de orden.
Cambiar “not what the chat's AI sees” → falla el test de la salvedad de 1A.
```

Aun así, el texto real de capturas del hallazgo 1 pasa esos controles: la ausencia de promesas de 1B no queda probada por los tres regex actuales.

- Ejecuté `node scripts/huella.mjs` sin opciones de escritura. La huella calculada coincide con la registrada: versión `0.3.0`, SHA-256 `db52dc6be594c8a83c40949e768b3f7e8f934ec81f76a1f940bead4d8e71c2f1`.
- Revisé el cambio de `scripts/huella.mjs`: la excepción pasa de 0.1.0 a la 0.3.0 sin publicar, manteniendo el algoritmo de huella. Ejecuté también el código del script en un entorno virtual donde `writeFileSync` sólo captura la intención de escribir y `process.exit` no termina el revisor:
  ```text
  registro previo 1.0.0 + --sin-subir-version → salida 1; no intenta escribir.
  registro previo 0.3.0 + --sin-subir-version → salida 0; intenta actualizar la huella virtual.
  ```
  No se escribió ninguna copia. Antes de publicar se debe retirar o mover la excepción, como ya indica el comentario del script.

**Recomendación de entrega:** aplicar el hallazgo 1 y su test en la rama del autor, regenerar la huella y ejecutar allí los tests oficiales. Conviene incluir también el hallazgo 2. Son cambios concretos de documentación y tests que deben entregarse; este revisor no los implementó por el contrato de sólo lectura.

## Preguntas que sólo puede contestar el dueño

Ninguna nueva. La decisión de no prometer el filtro de 1B en 1A ya está tomada en AD2; corregir la referencia no requiere otra decisión de producto. No se pide autorización para publicar, gastar o tocar producción como parte de esta revisión.

requiere otra vuelta
