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

Para comandos más cortos, la terminal se puede instalar aparte: `npm i -g supcoflow@0.8.1`. La skill no la instala por
su cuenta.

## Usar

```
/supcoflow go
```

## Versiones

- La skill es la `0.3.1` (`metadata.version` en `skills/supcoflow/SKILL.md`). La privacidad de la etapa 1B, que el plan
  1A tenía reservada para la 0.3.1, pasa a la `0.3.2`. El texto que recibe la persona
  (`SKILL.md` y `referencias/`) está en inglés y atado a esa versión por una huella: cambiar el texto sin subir la
  versión deja un test en rojo (`npm run huella` la imprime).
- Fija la terminal en `npx -y supcoflow@0.8.0`. Hasta que esa versión se publique, y el motor y el backend del chat
  de la etapa 1, la skill no funciona en producción. La 0.2.1 sigue fijada a la terminal 0.7.0 y la 0.3.0 a la 0.8.0.
- Los vectores de `test/vectores/` vienen de otros repos y se re-sincronizan a mano cuando cambian allá:
  `describe-0.8.0.json` (la salida de `supcoflow describe --json` de la terminal 0.8.0), `guia-de-ejemplo.md` (la
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
- No hace `git push`.
- No tiene camino para quien no usa un asistente de código.

## Licencia

Pendiente. La de la terminal es hoy `UNLICENSED`; es una decisión abierta del dueño.
