# Revisión independiente — skill Supcoflow 0.3.1, vuelta 2 (última)

**Versión revisada:** `fm/1a1-skill`, commit `64d9952af731417bcc42af764fa07a6a1e632b68`, contra `5c7439d1931f9773c3fe7e5d2bedc62e791d5d21`. Terminal contrastada: `fm/1a1-terminal`, `2ca55a4`, versión 0.8.1.

**Resultado:** los tres hallazgos de la primera vuelta están corregidos; no encontré P1 ni P2 nuevos. Queda una aclaración menor en el tratamiento de errores de la recuperación.

## Hallazgos

1. **P3 — Explicitar que la recuperación sólo pasa a `--wait` si recibió aceptación.**
   - **Referencias:** `skills/supcoflow/referencias/prueba.md:121-131` y `:139`, frente al manejo de errores de `:81-101` y la regla general de `skills/supcoflow/SKILL.md:38`.
   - **Qué pasa:** la sección nueva sustituye los puntos 3 y 4 y termina ambas recetas con «Then point 5», sin remitir al manejo de errores que quedó dentro del punto 4. La tabla general sí manda frenar con salida 4, por lo que **no es una autorización de gasto indebido ni un bloqueo**. Conviene evitar que la instrucción local se lea como un salto incondicional a `--wait`.
   - **Escenario concreto:** un pendiente con techo 3 nunca llegó al motor; el techo vigente es 2. Recuperarlo con su techo correcto devuelve 4 `techo_distinto`, y la terminal descarta ese intento ante el rechazo definitivo. Si se interpreta literalmente «Then point 5», un `test --wait` sin id puede seguir la última prueba anterior, no la que se acaba de intentar recuperar. Reproduje esa secuencia con la función real de 2ca55a4 y dependencias en memoria: la recuperación dio 4 `techo_distinto`; el `--wait` posterior dio 0 `guardado` para `prb_aaaaaaaaaaaaaaaa`, que era la prueba anterior. El rechazo del motor fue un doble en memoria, consistente con el prechequeo real del motor `a00b8a5:src/pruebas/crear.ts:206-213`. No ejecuté el motor real.
   - **Arreglo propuesto:** en las dos recetas, decir «Only with exit 5 and `prueba_id`, go to point 5; otherwise handle the result as in point 4». Mantener la recuperación con los valores del pendiente; ante `techo_distinto` o `politica_distinta`, volver a consultar y pedir otro sí antes de cualquier prueba nueva. Añadir un control de texto para esa condición. Es una precisión pequeña sobre una barrera que la tabla general ya contiene.

## Lo que verifiqué que está correcto

### Cierre de la vuelta 1

- **Hallazgo 1, P2: corregido.** `referencias/prueba.md:71-75` da prioridad a `maquina.ok: false`, no ofrece recuperar en ese estado, y manda al camino separado cuando cambia el techo, cambia la política o la política es nula. Si no se quiere recuperar, sólo ofrece «Not now». `:87-94` conserva el mismo sí únicamente para los mismos valores; con otros valores exige preguntar otra vez. La sección `:119-139` usa el techo y la política **del pendiente**, sin `--message`, en lugar de los actuales u ofrecidos para una prueba nueva. `SKILL.md:92-95` sustituye la opción de prueba nueva por la recuperación con su propio sí; `:114-115` evita reutilizar los valores de la prueba nueva en el paso 9. La excepción de política nula está descrita en la referencia enlazada. No encontré un camino textual que permita recuperar con un permiso para otros números.
- **Hallazgo 2, P2: corregido.** `referencias/prueba.md:132-139` explica que la política nunca quedó fijada, que recuperar puede gastar hasta el techo aunque ahora rija `guardar`, y que no se puede prometer gratuidad. Exige el sí a esa posibilidad; si sólo se autorizó una prueba gratis, prohíbe recuperar. Usa el comando de recuperación que proporciona el mensaje de `test --json`, sin inventarle una política. La regla general de fijación de terminal sigue vigente: «supcoflow» en las recetas significa la terminal 0.8.1 seleccionada según `SKILL.md:19-26`.
- **Hallazgo 3, P3: corregido.** `SKILL.md:122` retoma por `project show`, línea de contexto y `config`. Los escenarios 4 y 6 y la fila 6 de su índice fueron alineados. Los tests nuevos incluyen esas tres superficies.

### Contraste con la terminal real y el plan

- **Recuperación canónica:** ejecuté `probar()` de la fuente exacta 2ca55a4 con tres registros en memoria: techo distinto (pendiente 3 frente a diagnóstico 2), política distinta (`relevar` frente a `guardar`) y política nula. Los tres comandos de recuperación correspondientes fueron aceptados por el doble del motor, con una sola llamada por caso, la misma clave guardada y el mismo mensaje guardado. No se generó una clave ni se abrió un intento nuevo. La política enviada fue `relevar`, `relevar` y `null`, respectivamente. Esto verifica qué construye y envía la terminal, no la admisión de un motor en producción.
- **Alias antiguo:** `2ca55a4:src/comandos/probar.ts:75-82` construye el alias sin política sólo para el pendiente nulo. La validación y el reintento conservan ese nulo; el texto nuevo no lo convierte en `save` ni utiliza un sí a gasto cero. La advertencia añadida responde al riesgo real: el motor `a00b8a5:src/pruebas/crear.ts` pasa `politicaEsperada: null` a la preparación, sin la fijación que protege a la receta canónica.
- **Contexto antes del navegador:** `2ca55a4:src/comandos/proyecto.ts`, función `proyectoVer`, llama a `coherenciaAlCrear` cuando no encuentra proyecto, antes de devolver el resultado sin proyecto. Ejecuté esa función con dependencias en memoria: dueño distinto → 4 `contexto_incoherente`, motivo `dueno_distinto_del_login`; login nulo → 4, motivo `sin_github`; `owner` contra `OWNER` → 0. `SKILL.md:82-84` ahora nombra el freno de `project show` antes de `repo connect`, además del de `project create`. El vector declara la salida 4 y los motivos nuevos.
- **Vector:** evalué `comandoDescribir()` de `2ca55a4:src/comandos/describir.ts` y sus dependencias, cargadas directamente desde `git show`. Su JSON serializado más salto final es idéntico, **byte a byte**, a `test/vectores/describe-0.8.1.json` y a `/Users/germanflores/firstmate/data/1a1-terminal/describe-0.8.1.json`. No me limité a comparar dos copias del vector.
- **Versión y huella:** metadata 0.3.1, terminal fijada a 0.8.1 y único vector de esa terminal. Calculé la huella con el algoritmo real de `scripts/huella.mjs`: `0fb73ab735066492f210c034cc206ba17841f4a3a14bcb005c8b6d6d749ee9fb`, igual al registro. La excepción de versión sin publicar sigue limitada a 0.3.1.
- **Lo aprobado antes no sufrió cambios funcionales:** S1 (rama y sí al commit), S2 (nueve pasos, progreso y no mostrar JSON), S4 (README e instalador), S7 (asociación explícita del remoto con permiso), y S6 fuera de los ajustes señalados. El diff no modifica esas recetas ni agrega comandos de publicación, login o gasto al trabajo del revisor. La revisión de la vuelta 1 incorporada en `docs/revisiones/gpt-1a1-skill-vuelta-1.md` es idéntica byte a byte al informe original.

## Alcance, comandos y límites de la evidencia

- Leí completo `/Users/germanflores/firstmate/data/1a1-skill/revision-pedido.md`, el informe de la vuelta 1 y el plan `/Users/germanflores/firstmate/data/dx-1a1/report.md`. Leí el README actual y los nueve archivos del diff, incluido el informe incorporado.
- En el worktree descartable `/Users/germanflores/.treehouse/skills-7f6d2e/3/skills` ejecuté:
  - `git -C <worktree> checkout --detach fm/1a1-skill`.
  - `git -C <worktree> log -1 --format=fuller`: confirmó `64d9952af731417bcc42af764fa07a6a1e632b68`.
  - `git -C <worktree> log --oneline 5c7439d..64d9952`: dos commits, el informe y las correcciones.
  - `git -C <worktree> diff 5c7439d 64d9952`, más sus variantes por archivo, `--stat`, `--numstat` y `--check`. Este último no informó errores.
  - `git -C <worktree> status --short` al terminar los controles: vacío.
- Los otros repositorios se consultaron únicamente con `git -C <ruta> show/log`: terminal `/Users/germanflores/.treehouse/cli-f91a9c/1/cli`, rama `fm/1a1-terminal` en 2ca55a4; motor `/Users/germanflores/.treehouse/Supcoflow-6848a7/1/Supcoflow`, fuente a00b8a5. No cambié sus ramas ni ejecuté sus programas con dependencias reales.
- **Controles de texto:** ejecuté en memoria los cuerpos originales de **172 de los 174 tests**, incluidos los 15 agregados, con un adaptador mínimo de `describe`/`it`/`expect` y las aserciones correspondientes, Node 24.12.0 y `stripTypeScriptTypes`. Resultado final: **172 pasan, 0 fallan, 2 omitidos**. Los dos omitidos crean copias temporales y escriben la huella. Las funciones de escritura y lanzamiento de procesos del adaptador estaban bloqueadas. Esto **no equivale a repetir `npx vitest run`**: no instalé dependencias ni ejecuté Vitest. Los 174/174 declarados por el autor no son una corrida mía. `package.json` no tiene script de typecheck.
- **Controles de terminal:** `registerHooks` cargó los módulos desde `git show 2ca55a4:<ruta>` y `stripTypeScriptTypes` los transformó en memoria. Las pruebas usaron funciones inyectadas para git, archivos, credencial y respuestas del motor. Se verificaron las salidas con `node:assert/strict`. No hubo red, servidor, base de datos, credencial real ni gasto.
- No se puede demostrar el orden temporal «tests primero» a partir del commit único de correcciones: revisé su contenido y ejecuté los controles anteriores, no certifico esa secuencia de autoría.
- No modifiqué, creé ni commiteé archivos en ningún repositorio. La única entrega escrita es este informe. No publiqué, no pedí login ni toqué producción. V-5, V-6b, K1 y la autorización de publicar siguen fuera del alcance; no se dan por realizados.

**Recomendación para firstmate:** incorporar la aclaración P3 junto con su test de texto. Los P2 de la primera vuelta están cerrados; no hace falta cambiar la terminal para resolver esta precisión. Ésta es la segunda y última revisión: no solicito una tercera vuelta de GPT. La aprobación del código no autoriza publicaciones ni las pruebas manuales pendientes.

## Preguntas que sólo puede responder el dueño

Ninguna nueva. El informe no abre ninguna decisión del dueño: el único ajuste propuesto es una precisión técnica que mantiene los límites ya decididos.

aprobado con cambios menores
