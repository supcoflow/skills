# supcoflow-skills

La skill `supcoflow` para agentes de codificación (Claude Code y compatibles). Deja instalado, con un solo
comando, el chat de soporte de Supcoflow en el proyecto de la persona: el agente lee el código, pregunta lo
justo y maneja la terminal `supcoflow`.

## Instalar

```
npx skills add supcoflow/skills
```

El comando es el mismo para cualquier asistente. Qué pasa depende de quién lo corre (comprobado con el instalador
`skills` 1.7.4):

- In your own terminal, check the agents it selects: Claude Code isn't ticked the first time.
- If it first asks about Eve and you use another agent, answer no to get the list.
- If your coding agent runs it, it installs for that agent without asking, and it replaces an earlier install of this
  skill.

Para comandos más cortos, la terminal se puede instalar aparte: `npm i -g supcoflow@0.11.0`. La skill no la instala por
su cuenta.

## Usar

```
/supcoflow go
```

## Versiones

- La skill es la `0.6.5` (`metadata.version` en `skills/supcoflow/SKILL.md`). La `0.6.5` corrige qué se le dice a la persona cuando la guía no salió: en la rama principal, que su commit tiene que llegar a GitHub (lo sube ella o abre un PR desde una rama); en otra rama, que la mergee. La `0.6.4` publica la guía sólo con `supcoflow guide publish --from-github` en la rama principal (o con el paso de CI del proyecto), también la primera: nunca sin `--from-github`; si la guía todavía no llegó a esa rama en GitHub, la instalación frena antes de `chat on` con «Not finished» y dice qué falta para que llegue. La oferta del primer borrador de `.supcoflow/knowledge/` va después del paso 10 (no es un paso numerado), también al final de «Connect the repo», y sólo cuando la carpeta no tiene ningún `.md`. La `0.6.3` cierra la publicación desde otra rama: nunca, ni con un sí (la guía sale al mergear y el PR es la revisión); mira `supcoflow guide versions --json`, y si no pudo publicar la primera guía frena antes de `chat on`; el diff y el commit del punto 9 son los de `.supcoflow/knowledge/` cuando la carpeta existe; y `guide stale` suma `cobertura_quitada` y `cambio_cosmetico`. La `0.6.1` suma la fila `/supcoflow guide` (`referencias/guia-en-carpeta.md`): el agente de código escribe o actualiza la guía como documentos en `.supcoflow/knowledge/` (uno por área, con cabecera `title`, `summary` y `sources`, y las cuatro etiquetas), corre `supcoflow guide check` y `supcoflow guide stale`, muestra el diff y propone el commit; **nunca publica** y nunca escribe un índice a mano. Si el repo sólo tiene `guide.md`/`guia.md`, lo parte en la carpeta sin cambiar el contenido (y dice que la carpeta manda). Al terminar la instalación ofrece (una vez) armar el primer borrador de `.supcoflow/knowledge/` leyendo el código, o migrar la guía recién escrita, como commit para revisar y sin publicar. Cierra el camino viejo de «Update the guide»: para actualizar, `guide publish --from-github` en la rama principal o el paso de CI del proyecto. Ofrece, sólo con permiso, una línea para el `AGENTS.md`/`CLAUDE.md`. **Fija la terminal `0.11.0`, que todavía no está en npm**: hasta que esté, los comandos fijados de la skill no la encuentran. Antes, la `0.5.0` suma el paso nuevo de la cuenta de IA del
  cliente (`referencias/cuentas-de-ia.md`): después de `supcoflow config` lee `supcoflow agents show --json` y dice, agente
  por agente (el chat y el triage agent), si la cuenta está `lista`, `rechazada`, `sin_saldo` o `falta`. **La clave nunca
  pasa por el asistente**: si falta o está caída, le dice a la persona que la ponga ella, en la pestaña Agents o en su
  propia terminal con `supcoflow agents set-key`, y que después de arreglarla en su proveedor el asistente la vuelve a mirar
  con `supcoflow agents check`. Si el motor exige la cuenta (lo ve en `supcoflow diagnose`: `ia_del_chat`, `ia_del_triaje`),
  no ofrece prender el chat ni la prueba si el agente no está listo (listo = cuenta `lista` y modelo aprobado; si la cuenta está y falta aprobar el modelo, lo dice así y dice dónde se aprueba); si el motor todavía no la exige (desde el
  2026-11-04 la exige en producción), avisa y sigue como siempre. El diagnóstico pasa de «N of 7» a «N of 8» cuando el motor suma la
  cuenta del chat. Elegir el modelo del chat (`supcoflow agents configure`) es sólo si la persona lo pide. Los pasos del
  recorrido completo pasan de nueve a diez. Mantiene el camino de la 0.4.0 «construir el chat con los componentes de la
  app» (`referencias/interfaz-propia.md`), por defecto en Next.js (App Router); el widget queda de respaldo. La privacidad
  de la etapa 1B, que el plan 1A tenía reservada para la 0.3.1 y después para la 0.3.2, queda para una versión posterior a
  la `0.6.5`. El texto que recibe la persona (`SKILL.md` y `referencias/`) está en inglés y atado a esa versión por una
  huella: cambiar el texto sin subir la versión deja un test en rojo (`npm run huella` la imprime).
- Fija la terminal en `npx -y supcoflow@0.11.0`. La `0.6.1` la mueve de la `0.10.3` a la `0.11.0`. La `0.5.2` cambió esa fijación respecto de la `0.5.0` (de la `0.10.0` a la `0.10.2`). La `0.5.3` actualiza `referencias/nextjs.md` con el ensayo
  de la interfaz propia (`@supcoflow/chat` 2.4.0, Next.js 16.4.6, React 19.3.0) y suma a `referencias/interfaz-propia.md` seis avisos que dejó:
  la charla anterior sigue a la vista al empezar otra, lo adjuntado no se lista al recargar, el `lang` real o `locale` explícito y los textos del
  esqueleto traducidos, `type` y no `fill` en el navegador, el `ERR_ABORTED` de `POST /api/chat/sesion` que no es un error, y que lo que la persona
  escribe va en el reporte. La `0.5.4` no cambia la terminal fijada: suma al mapa del punto 3 las filas «Connect the repo», «Change what happens with a report», «Turn the chat on» y «Check an AI account» (esta última separada de «Put or fix…»), saca de la tercera pregunta el tope mensual y el saldo del equipo (la prueba sólo muestra el techo) y borra «el motor todavía no la exige» de `cuentas-de-ia.md` y del resumen. La `0.5.5` dice en el mapa que un pedido que coincide con una fila más chica corre sólo esa fila aunque diga `/supcoflow go`, deja que «Connect the repo» siga al paso 2 cuando el repo no tiene proyecto y saca el saldo que quedaba en el nivel 3 de la prueba. La `0.5.6` sólo mueve la terminal fijada de la `0.10.2` a la `0.10.3`, que ya no imprime el saldo mensual en `supcoflow test` ni en `diagnose`. La `0.5.0` se publicó el 2026-11-04, después de la terminal `0.10.0` en npm
  (sin esa versión en npm, el `npx -y supcoflow@0.10.0` de la skill no encuentra la terminal).
  Tampoco funciona en producción antes de que el motor describa la interfaz propia en `/widget` y esté publicado el paquete
  `@supcoflow/chat` con el núcleo, el hook de React y la conformidad: sin `interfaz_propia`, o con `estado: sin_publicar`, usa
  el widget, como la 0.3.1. La 0.4.0 sigue fijada a la terminal 0.9.0, la 0.2.1 a la 0.7.0, la 0.3.0 a la 0.8.0 y la 0.3.1 a la 0.8.1.
- Los vectores de `test/vectores/` vienen de otros repos y se re-sincronizan a mano cuando cambian allá:
  `describe-0.11.0.json` (la salida de `supcoflow describe --json` de la terminal 0.11.0, construida del PR https://github.com/supcoflow/cli/pull/16; todavía no publicada en npm), `motivos-de-la-carpeta.json` (los motivos de la carpeta, de ese mismo PR), `guia-de-ejemplo.md` (la
  guía de ejemplo del motor, byte a byte), `motivos-del-motor.json` (`src/guia/vectores/motivos.json` del motor,
  byte a byte) y `motivos-de-la-guia.json` (esos mismos `motivo`, más el `queHacer` propio de la skill). No se
  escriben a mano: el motor es la fuente de la guía y los `motivo`; la terminal construida, la de `describe`.

## Probar

```
npm install
npm test
```

## Lo que esta versión NO hace

- No gasta por su cuenta: la prueba paga (`test`, nivel 3) sólo se pide con el sí de la persona a los números
  que dio el motor (el techo), y viaja con ese techo y esa política (`--ceiling`, `--expect-policy`).
- No relanza desde la terminal un relevamiento de arranque incierto: eso es de la consola.
- No pide, no recibe y no repite la clave de IA de la persona (la pone ella, sin pasar por el asistente), y no corre `agents set-key` ni `agents remove`.
- No hace `git push`.
- No tiene camino para quien no usa un asistente de código.

## License

MIT. See [LICENSE](LICENSE).

**Name and logo.** The code is MIT-licensed. The name "Supcoflow" and its logo are not part of the license: you can fork and change the code, but a modified version must not be called Supcoflow or look like it comes from Supcoflow. Saying your project "works with Supcoflow" is fine.
