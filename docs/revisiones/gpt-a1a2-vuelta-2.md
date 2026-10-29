# Revisión independiente GPT — supcoflow 0.3.0, A1 + A2 + A4, vuelta 2 (final)

**Versión revisada:** `0.3.0`, rama `fm/e1-skill`, commit `4d84c8c30abe1b71d5adaa3248d24f169869f192`.

**Resultado:** aprobado: los tres hallazgos de la vuelta 1 están corregidos y no encontré problemas nuevos en el diff de resolución.

## Hallazgos

Sin hallazgos abiertos P1, P2 ni P3 en el alcance revisado. No hace falta otra vuelta.

## Qué verifiqué correcto

### Resolución de cada hallazgo anterior

1. **P1 anterior — resuelto: instalación sin proyecto.**
   - **Referencias:** `skills/supcoflow/SKILL.md:44–48,62–65`; `test/skill.test.ts:729–736`; `docs/escenarios/01-src-app.md:12`; `docs/escenarios/README.md:19–24`.
   - Antes, una app nueva con sesión válida recibía 4 `sin_proyecto` al empezar con `config` y quedaba detenida antes de poder crear el proyecto. Ahora la excepción se limita explícitamente a ese error: si el pedido es instalar, sigue por el paso 2 y vuelve a leer `config`; ante otro pedido ofrece la instalación completa y no crea nada; cualquier otro 4 conserva la detención para una persona.
   - Contrasté esto con la terminal real `fm/e1-terminal` @ `19d210b`: `src/comandos/configurar.ts:42–44` resuelve el proyecto; `src/comandos/proyecto-del-repo.ts:28–30` devuelve `error: "sin_proyecto"` con `SALIDA.haceFaltaUnaPersona`; `src/contrato.ts:10` fija ese código en 4. Además, `src/comandos/proyecto.ts:202–215` confirma que `project show` devuelve 0 con `proyecto: null`, por lo que el paso 2 sí puede llegar a conectar y crear. El recorrido de creación exige una conexión confirmada (`:138–142`); no se salta la aprobación de GitHub.
   - El test nuevo exige las tres ramas y comprueba que exista el paso 2 al que se remite. El escenario de app nueva y su índice ya describen esa misma salida. No se convirtió cualquier código 4 en permiso para continuar.

2. **P2 anterior — resuelto: preguntas de caminos parciales y permisos.**
   - **Referencias:** `skills/supcoflow/SKILL.md:53–54,105–108,126–132,152–158,174–189`; `test/skill.test.ts:716–728`.
   - La fila de guía ya no dice «Nothing else is asked»: omite únicamente datos, política y prueba, y conserva expresamente las consultas sobre sobrescritura, reglas del negocio y commit. El caso concreto de una guía modificada por la persona ya no enfrenta una prohibición de preguntar con un permiso obligatorio.
   - La fila de datos conserva sólo la primera pregunta **con su advertencia de alcance y toda su tabla**, incluidos los cambios en el código de la app. Excluye la segunda y tercera preguntas, no los permisos antes de tocar archivos.
   - El punto 5 ahora limita el panel de tres preguntas al recorrido completo y a lo que todavía no esté fijado; remite al mapa para el cambio de datos. No se modificaron las reglas de mostrar antes de aplicar, no pisar ni pedir el sí antes del commit. Los tests exigen esas distinciones y rechazan las dos frases absolutas anteriores.

3. **P3 anterior — resuelto: preparación del escenario de guía.**
   - **Referencias:** `docs/escenarios/04-guia-sin-commitear.md:4–18`; `docs/escenarios/README.md:41–43`; `test/skill.test.ts:785–801`.
   - La preparación exige proyecto de prueba conectado y un chat ya instalado y commiteado. Se separan expresamente «actualizá la guía» y `/supcoflow go`.
   - En la variante parcial no se instala otro chat ni se preguntan datos, política o prueba; sí se mantienen las consultas de seguridad y negocio. La lista común aclara que «un solo chat» es el que ya estaba. Así, actualizar correctamente una guía sin instalar un componente ya no produce el falso fallo de la vuelta anterior.

### Alcance, contraste y ausencia de cambios ajenos

- Leí completos el pedido `/Users/germanflores/firstmate/data/e1-skill/revision-pedido.md`, el informe anterior `/Users/germanflores/firstmate/data/e1-skill-rev3/report.md` y `/Users/germanflores/firstmate/data/skill-vercel/report.md`. Usé A1, A2 y A4 como especificación; A3 sigue fuera. Leí el README, `SKILL.md`, sus tres referencias, los seis escenarios y sus tests.
- En mi worktree `/Users/germanflores/.treehouse/skills-7f6d2e/2/skills` ejecuté `git checkout --detach fm/e1-skill` y `git log -1 --format=fuller`: el HEAD es el commit indicado arriba. También confirmé con `git -C /Users/germanflores/.treehouse/skills-7f6d2e/1/skills log -1 ... fm/e1-skill` que la rama del autor apunta al mismo commit.
- Revisé completo `git diff d5fa3f9..4d84c8c`, incluidos el archivo de revisión archivado y la huella. El rango contiene `601c078` (archivo del informe) y `4d84c8c` (correcciones). El informe archivado en `docs/revisiones/gpt-a1a2-vuelta-1.md` es **idéntico byte a byte** al informe recibido.
- Contrasté también `git diff c96792d..4d84c8c -- skills/`, sin reabrir la aprobación de `c96792d`: sólo cambia `SKILL.md`, en la descripción, el mapa y la aclaración necesaria del punto 5. No cambian las referencias ni entra la lista A3.
- La descripción sigue teniendo **414 caracteres**, los disparadores solicitados y la exclusión de otros proveedores y de construir un chat desde cero; no contiene `: ` ni ` #` dentro del valor. El mapa mantiene cinco filas y `config` como lectura inicial; sus destinos existen. No agrega autorización de gasto al diagnóstico, la guía ni los datos.
- Releí las reglas de prueba: el nivel 3 conserva el sí a números, techo y política exactos, y no reutiliza una autorización para otra prueba. Las correcciones no cambian esas reglas ni permiten relanzar `arranque_incierto`.
- Las seis fichas A4 siguen siendo **escenarios escritos, no corridos**. No ejecuté un asistente real, navegador, login ni comandos contra Supcoflow. Las correcciones de sus expectativas corresponden a las reglas de la skill; las variantes CSP, chat anterior, rechazo de gasto y reanudación no fueron alteradas.
- Las fuentes reales consultadas fueron `/Users/germanflores/projects/Supcoflow/cli`, `fm/e1-terminal` @ `19d210b`, y `/Users/germanflores/.treehouse/Supcoflow-6848a7/1/Supcoflow`, `fm/e1-motor` @ `07885c7a`. En esos repos utilicé exclusivamente `git -C ... show/log/grep`, sin ejecutarlos ni escribir archivos. Confirmé los nombres de wrapper/componente en `src/widget/instalacion.ts:28–36,85–94`, el fallback del registro v1 en `cli/src/instalacion.ts:123–134` y el caso de publicación repetida en `src/guia/publicar.integration.test.ts:254`. Las copias locales de la guía de ejemplo y de los motivos coinciden byte a byte con los vectores del motor.

### Validaciones propias y límites

1. **Tests de sólo lectura.** Ejecuté Vitest por su API, con raíz absoluta, `config: false`, `cache: false`, `watch: false` y `testNamePattern: '^(?!--sin-subir-version)'`:
   ```text
   Test Files  1 passed (1)
        Tests  110 passed | 2 skipped (112)
   ```
   Incluye los cinco tests agregados en esta corrección y todos los tests de A1/A2/A4. Omití exclusivamente los dos tests preexistentes de `--sin-subir-version`, porque crean copias y escriben archivos, incompatible con este encargo de sólo lectura. Por tanto, **no afirmo haber repetido `npm test` con 112 verdes**: ése es el resultado declarado por el autor. No existe script de typecheck en `package.json`.
2. **Cobertura.** Revisé las aserciones nuevas contra las instrucciones completas, no sólo contra sus frases aisladas. Fijan las ramas de `sin_proyecto`, los permisos conservados, el alcance de la pregunta de datos y la preparación del escenario parcial. Son pruebas de texto, no de comportamiento de un asistente. No repetí las mutaciones declaradas por el autor porque no corresponde modificar archivos en esta revisión.
3. **Huella.** Ejecuté, sin flags de escritura:
   ```text
   node /Users/germanflores/.treehouse/skills-7f6d2e/2/skills/scripts/huella.mjs
   ```
   Resultado: versión `0.3.0`, huella **`a925a8e413eff5e9a4b98471c365bbfd2f9ace2ba3b7ae0987838e10acd11dd3`**, igual a `test/vectores/huella-de-la-skill.json`. Los escenarios y la revisión viven fuera de `skills/` y no entran en esa huella.
4. **Limpieza.** `git diff --check d5fa3f9..4d84c8c` y `git diff --check c96792d..4d84c8c` terminaron sin salida; `git status --porcelain` quedó vacío después de la validación. No edité, creé ni commiteé archivos de ningún repositorio. No gasté, publiqué, hice push, pedí login ni toqué producción.

**Recomendación:** dar por aprobada esta corrección de A1/A2/A4 en la 0.3.0 sin publicar. Esta aprobación no acredita una corrida con un asistente real ni autoriza publicar o ejecutar los escenarios; esas acciones están fuera del encargo.

## Preguntas que sólo puede responder el dueño

Ninguna nueva. No hay decisiones pendientes necesarias para cerrar esta revisión.

aprobado
