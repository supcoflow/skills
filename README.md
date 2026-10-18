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

- La skill es la `0.1.0` (`metadata.version` en `skills/supcoflow/SKILL.md`). El texto que recibe la persona
  (`SKILL.md` y `referencias/`) y esa versión están atados por una huella: cambiar el texto sin subir la versión
  deja un test en rojo (`npm run huella` la imprime).
- Fija la terminal en `npx -y supcoflow@0.6.0`. Hasta que esa versión se publique, la skill no funciona en
  producción.

## Probar

```
npm install
npm test
```

## Lo que esta versión NO hace

- No hay pruebas pagas (`probar`).
- No hace `git push`.
- No tiene camino para quien no usa un asistente de código.

## Licencia

Pendiente. La de la terminal es hoy `UNLICENSED`; es una decisión abierta del dueño.
