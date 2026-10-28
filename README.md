# supcoflow-skills

La skill `supcoflow` para agentes de codificación (Claude Code y compatibles). Deja instalado, con un solo
comando, el chat de soporte de Supcoflow en el proyecto de la persona: el agente lee el código, pregunta lo
justo y maneja la terminal `supcoflow`.

## Instalar

```
npx skills add supcoflow/skills
```

El repo de GitHub `supcoflow/skills` **todavía no existe**: la publicación está pendiente. Mientras tanto, se
puede copiar la carpeta `skills/supcoflow/` de este repo a `.claude/skills/supcoflow/` del proyecto.

## Usar

```
/supcoflow go
```

## Versiones

- La skill es la `0.3.0` (`metadata.version` en `skills/supcoflow/SKILL.md`). El texto que recibe la persona
  (`SKILL.md` y `referencias/`) está en inglés y atado a esa versión por una huella: cambiar el texto sin subir la
  versión deja un test en rojo (`npm run huella` la imprime).
- Fija la terminal en `npx -y supcoflow@0.8.0`. Hasta que esa versión se publique, y el motor y el backend del chat
  de la etapa 1, la skill no funciona en producción. La 0.2.1 sigue fijada a la terminal 0.7.0.
- Los vectores de `test/vectores/` vienen de otros repos y se re-sincronizan a mano cuando cambian allá:
  `describe-0.8.0.json` (la salida de `supcoflow describe --json` de la terminal 0.8.0), `guia-de-ejemplo.md` (la
  guía de ejemplo del motor, byte a byte) y `motivos-de-la-guia.json` (los `motivo` de `guide check`, del test del
  motor).

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
