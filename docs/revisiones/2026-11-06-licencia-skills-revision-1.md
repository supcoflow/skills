# Revisión independiente — lote A, vuelta 1 de máximo 2

Fecha: 2026-11-06. Revisión de sólo lectura de las ramas, con validaciones en copias descartables. No publiqué nada ni modifiqué las ramas revisadas.

## Resumen y veredicto por repo

| Repo y alcance | Veredicto | Motivo |
|---|---|---|
| **skills**, `fm/licencia-skills`, `2b089e8` | **No integrar todavía** | El MIT de la raíz es correcto y los 284 tests pasan, pero falta que la licencia viaje dentro de la carpeta de la skill que se instala. Hallazgo S1, P2. |
| **cli**, exclusivamente el commit `963cbd1` de `fm/untangle-a-cli` | **Integrar; aprobado con cambio menor** | MIT, titular y nota de marca correctos. 1001 tests, typecheck y build pasan. Quedó un dato viejo de licencia en el lockfile: C1, P3, no bloqueante. |
| **landing**, `fm/landing-open-source`, `20450a2` y `b50bd49` | **No integrar todavía** | Se corrigió bien el «open source» falso y la tarjeta ya dice `$0 /During the beta`, sin cambios de estructura ni estilos. Pero el FAQ de esa misma página todavía ofrece un plan de $15; también siguen $15 en los metadatos y en `/features`. Hallazgo L1, P2. |

**En castellano simple:** el cambio de la terminal está bien. A la skill le falta llevar una copia de su licencia junto con los archivos que recibe la persona. En la web se cambió el precio grande, pero quedaron textos que siguen diciendo que cuesta 15 dólares. Son arreglos chicos y concretos; no requieren otra decisión de producto.

No encontré hallazgos P1. Hay **dos P2 y un P3**. Recomiendo corregir S1 y L1 antes de integrar esos repos, y verificar esas correcciones en la segunda y última vuelta. No hace falta seguir revisando el resto de la rama de la terminal, que quedó fuera del alcance asignado.

## Alcance y referencias exactas

Repos de origen, usados sólo para leer Git y archivos:

- **SKILLS**: `/Users/germanflores/.treehouse/skills-6496f0/1/skills`.
  - HEAD: `2b089e82427ebc99dafa2dd3547937d8ad004c1a`.
  - Base `origin/main`: `6804cba58dc379e58132b302825a3d6e2d6890bc`.
  - Un commit; cambia únicamente `LICENSE`, `README.md`, `package.json` y `plugin.json`.
- **CLI**: `/Users/germanflores/.treehouse/cli-fb15e0/1/cli`.
  - Commit revisado: `963cbd1c3b2d55f7297ff98432a774f606572d1b`, contra su padre `3af7762`.
  - Sólo cambia `LICENSE`, `README.md` y `package.json`. No emito otro dictamen sobre los commits anteriores de esa rama.
- **LANDING**: `/Users/germanflores/.treehouse/landing-2aa734/1/landing`.
  - HEAD: `b50bd49683057bce2b71f932934237a50384f12d`.
  - Base `origin/main`: `d354e24a4521b13d9e017d44b9a4b03183675bbd`.
  - Dos commits; únicamente cambian cinco líneas de contenido en `PricingPlans.astro` y `TriageSection.astro`.

Leí los README y las instrucciones de los tres repos, el análisis de licencias en `/Users/germanflores/firstmate/data/licencia-cli-skills/report.md` y el informe `/Users/germanflores/firstmate/data/privacy-abogado/report.md`, en particular P9. La instrucción específica de no cambiar `SKILL.md` ni `referencias/` prevalece sobre la sugerencia anterior de agregar el campo `license` al encabezado de la skill: **no señalo esa ausencia como problema**.

## Hallazgos

### S1 — P2 — La licencia no viaja con la skill instalada

**Ubicación:** `skills/LICENSE:11-12` (condición de conservar el aviso), `skills/README.md:73-77` (nueva declaración MIT); archivo que falta: **`skills/supcoflow/LICENSE`**, dentro del repo skills.

El archivo `LICENSE` agregado está sólo en la raíz del repositorio. En `2b089e8`, la carpeta `skills/supcoflow/` contiene únicamente `SKILL.md` y cinco archivos de `referencias/`: no lleva ni el texto MIT ni el aviso `Copyright (c) 2026 Supcoflow`.

Esto importa porque el comando de instalación que se recomienda en el README entrega esa carpeta, no la raíz completa del repositorio. Verifiqué independientemente el código del instalador **`skills@1.7.4`**, descargado de npm sin ejecutar su instalación:

- `dist/cli.mjs:2312-2314`: en modo copia llama a `copyDirectory(skill.path, agentDir, agentType)`.
- `dist/cli.mjs:2334-2336`: en el modo normal copia igualmente `skill.path` al directorio canónico antes de enlazarlo para los agentes.
- `dist/cli.mjs:2401-2423`: `copyDirectory` recorre solamente el directorio recibido y sus hijos. No busca ni agrega la licencia del directorio padre.

Por lo tanto, la instalación ordinaria de esta versión entrega el texto de la skill sin el aviso ni los términos que permiten reutilizarlo. **No significa que el MIT de la raíz sea inválido**: el problema es que no acompaña a la copia entregada. El análisis aprobado ya había identificado esta necesidad en su sección 4, skills, punto 2.

**Arreglo recomendado:** copiar el `LICENSE` de la raíz a `skills/supcoflow/LICENSE` y agregar una comprobación de igualdad para que no se separen. No tocar `SKILL.md`, `referencias/`, la versión ni el vector de huella. `scripts/huella.mjs:34-42` confirma que la huella incluye sólo `SKILL.md` y `referencias/`: un archivo hermano `LICENSE` queda fuera de ella.

**Validación esperada:** ambos LICENSE idénticos, la carpeta entregada incluye LICENSE, 284 tests en verde y la misma huella que se registra más abajo.

### L1 — P2 — La beta gratis convive con el precio viejo de $15

**Cambio incompleto:** `landing/src/components/PricingPlans.astro:94-95`.

**Textos que quedaron sin alinear:**

1. **`src/components/PricingFaq.astro:42-44`**, visible en `/pricing`:
   - `Is the $15 plan metered by usage?`
   - La respuesta todavía lo llama una tarifa plana actual: `Not today. It is a flat rate...`.
2. **`src/pages/pricing.astro:69`**, descripción que alimenta los metadatos de la página y de los enlaces compartidos:
   - `...let Supcoflow host it for a flat $15...`.
   - En el HTML construido aparece en tres etiquetas de descripción: normal, Open Graph y Twitter.
3. **`src/components/FeaturesPricingTeaser.astro:78-79`**, visible en `/features`:
   - `Run it yourself for free, or let us host it for $15 flat.`

Confirmé los tres casos en la salida final del build, no sólo con una búsqueda en comentarios. En `/pricing` la tarjeta desktop y su duplicado mobile sí muestran `$0 /During the beta`, pero el FAQ de la misma página sigue preguntando por el plan de $15. El visitante recibe dos precios incompatibles para el mismo servicio.

**Arreglo recomendado:** decir que el alojamiento es gratis durante la beta también en el FAQ, la descripción y el teaser. Mantener la aclaración separada de que la inferencia usa la cuenta del cliente; no prometer que ese consumo sea gratis ni inventar el precio posterior a la beta. Sólo requiere cambiar texto, no diseño.

**Validación esperada:** build limpio; comprobar el HTML de `/pricing` y `/features`, incluidos los metadatos, para que no quede ninguna oferta actual de alojamiento a $15. Los comentarios históricos no son una oferta visible y no necesitan una limpieza general.

### C1 — P3 — El lockfile de la terminal todavía dice `UNLICENSED`

**Ubicación:** `cli/package-lock.json:10`, frente a `cli/package.json:12`.

El commit cambia correctamente `package.json` a `"license": "MIT"`, pero el paquete raíz descrito en `package-lock.json` conserva `"license": "UNLICENSED"`. Una herramienta que inspeccione el lockfile puede seguir identificando la terminal con la licencia anterior.

**Arreglo recomendado:** sincronizar el dato del paquete raíz en el lockfile, sin actualizar versiones de dependencias. Es una inconsistencia menor, **no bloquea integrar este commit**: el LICENSE es correcto y el empaquetado de npm toma el `package.json` correcto e incluye LICENSE.

## Lo que está bien

### Licencias y marca

- Los dos `LICENSE:1-21` contienen el texto MIT estándar, con el titular exacto **`Copyright (c) 2026 Supcoflow`**, sin condiciones adicionales metidas en el cuerpo de la licencia.
- Son idénticos byte por byte. SHA-256 de cada uno:
  `50bf730e2176f128a93fb207ff594d9c835775f26489255987bc64c118c4305a`.
- `cli/package.json:12`, `skills/package.json:4` y `skills/plugin.json:5` dicen MIT.
- La nota de nombre y logo está separada del MIT y coincide en contenido con la nota aprobada: permite modificar y copiar el código, reserva la identidad de Supcoflow y permite decir que un proyecto funciona con Supcoflow. Referencias: `cli/README.md:391-395` y `skills/README.md:73-77`.
- `npm pack --dry-run --ignore-scripts --json` de la terminal incluye `LICENSE` (1066 bytes), `README.md` y `package.json`, además del código construido. No se generó ni se publicó un paquete real de la terminal.
- El diff de skills sobre `SKILL.md`, `referencias/` y `test/vectores/huella-de-la-skill.json` está vacío. La huella sigue siendo la de la versión `0.5.0`.

### Landing

- `TriageSection.astro:68` pasa de `Open-source triage` a `Triage`.
- `TriageSection.astro:134` ya no llama abierto al runner.
- `PricingPlans.astro:79` atribuye el MIT exclusivamente a la terminal y a la skill, no al motor.
- Busqué `open source`, `open-source` y variantes en `src/` y `public/`, y extraje el texto de **todos los HTML construidos**, excluyendo comentarios, scripts y estilos. En la salida visible sólo queda el MIT de la terminal y la skill, repetido para desktop/mobile. El comentario histórico del hero y las menciones genéricas de datos de plantilla no son afirmaciones visibles de apertura del motor.
- No señalo la píldora del pie que enlaza a `supcoflow/triage`: está expresamente excluida por decisión del dueño.
- El diff sólo modifica textos: no cambia clases, elementos, estilos, imágenes, rutas ni lógica. **No hice comparación visual en navegador**; la afirmación de que no hay rediseño se basa en el diff exacto, no en capturas.

## Validaciones y evidencia reproducible

Laboratorio:
`/Users/germanflores/.treehouse/landing-2aa734/2/landing/.review-lote-a`.

Creé cada copia con `git -C <ruta-de-origen> archive <commit> | tar -x -C <carpeta-del-laboratorio>`. Copié dependencias existentes al laboratorio, sin enlazarlas a los worktrees de origen, y comparé las versiones instaladas con cada lockfile. No ejecuté tests ni builds dentro de las ramas revisadas.

Entorno: **Node v24.12.0; npm 11.6.2**.

| Repo | Comando dentro de su copia | Resultado |
|---|---|---|
| skills | `npm test` | **1 archivo, 284 tests aprobados**, salida 0 |
| skills | `npm run huella` | `version: 0.5.0`; huella `b818a8a9a4aa6a03ac3d05210d220f6eb325131f8a5ee0aeaaa728807e5477df` |
| cli | `TMPDIR=/tmp/lote-a-rev1 npm test` | **38 archivos, 1001 tests aprobados**, salida 0 |
| cli | `npm run typecheck` | `tsc --noEmit`, salida 0 |
| cli | `npm run build` | `tsc -p tsconfig.json && chmod +x dist/cli.js`, salida 0 |
| cli | `npm pack --dry-run --ignore-scripts --json` | Incluye LICENSE, salida 0; sin publicación |
| landing | `npm run build` | **7 páginas construidas**, salida 0 |
| landing | `npm run astro -- check` | **178 archivos, 0 errores, 0 warnings, 2 hints**, salida 0 |
| tres repos | `git diff --check <base> <commit>` | Sin problemas de espacios, salida 0 |

Los dos hints de Astro son de código no modificado: `src/components/HeroScene.astro:429` (`CASES` sin usar) y `scripts/build-audience-marks.mjs:35` (`clamp01` sin usar). Skills no tiene script de typecheck/build; landing no tiene suite `npm test`. No atribuyo controles inexistentes.

**Detalle importante del entorno de landing:** el `node_modules` del worktree revisado estaba atrasado respecto de su lockfile (por ejemplo Astro 7.1.6 frente a 7.4.7). La primera compilación pasó, pero no la tomé como validación final. Reemplacé las dependencias de la copia de laboratorio por las del laboratorio principal, cuyas versiones coinciden con el lockfile, y repetí build y `astro check`: ambos pasaron. La comparación final de versiones instaladas contra lockfile no detectó ninguna diferencia. No es un hallazgo del cambio ni hubo que tocar la rama.

Comandos de revisión Git (usando las rutas absolutas SKILLS, CLI y LANDING definidas arriba):

```sh
git -C "$SKILLS" diff 2b089e8^ 2b089e8
git -C "$SKILLS" diff --exit-code 2b089e8^ 2b089e8 -- skills/supcoflow/SKILL.md skills/supcoflow/referencias test/vectores/huella-de-la-skill.json
git -C "$SKILLS" ls-tree -r --name-only 2b089e8 skills
git -C "$CLI" show --format=fuller 963cbd1
git -C "$LANDING" diff d354e24 b50bd49
git -C "$LANDING" grep -n -i -E 'open[ -]?source|source.available' b50bd49 -- src public
```

Para verificar S1 descargué únicamente el tarball del instalador con `npm pack skills@1.7.4 --ignore-scripts --json`, con caché dentro del laboratorio, y leí su función de copia. **No ejecuté el instalador ni cambié instalaciones personales de agentes.** Para L1 usé `html.parser.HTMLParser` sobre `dist/**/*.html`, descartando `script` y `style`, y examiné también las etiquetas de descripción. La salida relevante final fue:

```text
features/index.html: ...let us host it for $15 flat...
pricing/index.html: ...The terminal and the skill are open source (MIT)...
pricing/index.html: ...$0 /During the beta...
pricing/index.html: ...Is the $15 plan metered by usage?...
pricing/index.html META (3 etiquetas): ...let Supcoflow host it for a flat $15...
```

Al terminar, los tres worktrees revisados conservaron sus HEAD originales y `git status --porcelain` vacío. `/tmp/lote-a-rev1` fue eliminada. No hubo push, publicación, despliegue, login, cambios de producción ni escrituras en las ramas.

## Recomendación final y decisiones

1. **CLI:** integrar; sincronizar el dato del lockfile como ajuste menor.
2. **Skills:** agregar la copia de LICENSE en la carpeta entregada y su comprobación, sin tocar la huella; después integrar si pasa la validación.
3. **Landing:** alinear FAQ, metadatos y teaser con la beta gratis; después integrar si pasa la validación.

Estos arreglos son trabajo para entregar, no dudas para el dueño. **No surgieron nuevas decisiones del dueño pendientes en esta revisión.** Las preguntas legales del informe anterior quedan fuera de este lote y no las reabro. La integración y cualquier publicación siguen a cargo de firstmate conforme a los permisos que ya tenga; esta revisión no publica ni concede nuevos permisos.
