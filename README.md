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

Para comandos más cortos, la terminal se puede instalar aparte: `npm i -g supcoflow@0.10.2`. La skill no la instala por
su cuenta.

## Usar

```
/supcoflow go
```

## Versiones

- La skill es la `0.5.4` (`metadata.version` en `skills/supcoflow/SKILL.md`). Suma el paso nuevo de la cuenta de IA del
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
  la `0.5.4`. El texto que recibe la persona (`SKILL.md` y `referencias/`) está en inglés y atado a esa versión por una
  huella: cambiar el texto sin subir la versión deja un test en rojo (`npm run huella` la imprime).
- Fija la terminal en `npx -y supcoflow@0.10.2`. La `0.5.2` cambió esa fijación respecto de la `0.5.0` (de la `0.10.0` a la `0.10.2`). La `0.5.3` actualiza `referencias/nextjs.md` con el ensayo
  de la interfaz propia (`@supcoflow/chat` 2.4.0, Next.js 16.4.6, React 19.3.0) y suma a `referencias/interfaz-propia.md` seis avisos que dejó:
  la charla anterior sigue a la vista al empezar otra, lo adjuntado no se lista al recargar, el `lang` real o `locale` explícito y los textos del
  esqueleto traducidos, `type` y no `fill` en el navegador, el `ERR_ABORTED` de `POST /api/chat/sesion` que no es un error, y que lo que la persona
  escribe va en el reporte. La `0.5.4` no cambia la terminal fijada: suma al mapa del punto 3 las filas «Connect the repo», «Change what happens with a report», «Turn the chat on» y «Check an AI account» (esta última separada de «Put or fix…»), saca de la tercera pregunta el tope mensual y el saldo del equipo (la prueba sólo muestra el techo) y borra «el motor todavía no la exige» de `cuentas-de-ia.md` y del resumen. La `0.5.0` se publicó el 2026-11-04, después de la terminal `0.10.0` en npm
  (sin esa versión en npm, el `npx -y supcoflow@0.10.0` de la skill no encuentra la terminal).
  Tampoco funciona en producción antes de que el motor describa la interfaz propia en `/widget` y esté publicado el paquete
  `@supcoflow/chat` con el núcleo, el hook de React y la conformidad: sin `interfaz_propia`, o con `estado: sin_publicar`, usa
  el widget, como la 0.3.1. La 0.4.0 sigue fijada a la terminal 0.9.0, la 0.2.1 a la 0.7.0, la 0.3.0 a la 0.8.0 y la 0.3.1 a la 0.8.1.
- Los vectores de `test/vectores/` vienen de otros repos y se re-sincronizan a mano cuando cambian allá:
  `describe-0.10.2.json` (la salida de `supcoflow describe --json` de la terminal 0.10.2, construida desde el código fuente de la terminal en el commit 616ca631 con la versión 0.10.2; hay que volver a comprobarla contra la publicada antes de unir), `guia-de-ejemplo.md` (la
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
  que dio el motor (techo y saldo), y viaja con ese techo y esa política (`--ceiling`, `--expect-policy`).
- No relanza desde la terminal un relevamiento de arranque incierto: eso es de la consola.
- No pide, no recibe y no repite la clave de IA de la persona (la pone ella, sin pasar por el asistente), y no corre `agents set-key` ni `agents remove`.
- No hace `git push`.
- No tiene camino para quien no usa un asistente de código.

## License

MIT. See [LICENSE](LICENSE).

**Name and logo.** The code is MIT-licensed. The name "Supcoflow" and its logo are not part of the license: you can fork and change the code, but a modified version must not be called Supcoflow or look like it comes from Supcoflow. Saying your project "works with Supcoflow" is fine.
