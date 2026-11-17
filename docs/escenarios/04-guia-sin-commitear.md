# 4. La guía sin commitear: `guide.md` editada a mano y el pedido «actualizá la guía»

## App de ejemplo
Next.js con el **proyecto de Supcoflow de prueba ya conectado al repo** y **el chat ya instalado** (un solo componente
montado en el layout, commiteado). Tiene `.supcoflow/guide.md` ya commiteada y luego **editada a mano sin commitear**
(por ejemplo, la persona agregó una línea sobre un plazo de devolución), sin carpeta `.supcoflow/knowledge/`. Además, un
archivo ajeno en el índice de git (`git add` de algún `README.md` modificado, sin commitear). Variantes para repetir
aparte: (a) la guía está en `.gitignore`; (b) sólo existe la guía con el nombre viejo `.supcoflow/guia.md`.

## Pedido
Corré el escenario dos veces: **(i)** «actualizá la guía» (pedido parcial: el asistente conserva el chat que ya está,
no instala nada) y **(ii)** `/supcoflow go` (recorrido completo).

## Lo esperado
- En (i) el asistente empieza por `supcoflow project show --json`, dice la línea de contexto y luego `supcoflow config --json`, y sigue la fila `/supcoflow guide`
  (`referencias/guia-en-carpeta.md`): **no hace** las preguntas de datos, política ni prueba. Las consultas (no pisar, reglas
  del negocio, el sí al commit) **sí** se hacen. El chat queda como estaba.
- Antes de escribir corre `git status --porcelain --ignored -- .supcoflow`, ve el cambio sin commitear de `guide.md` y
  **no pisa nada**: muestra lo que haría (partir la guía en la carpeta, sin cambiar el contenido) y pregunta.
- Con el sí, parte la guía en `.supcoflow/knowledge/<área>.md` con cabecera `title`/`summary`/`sources`; el número de
  `secciones` de `supcoflow guide check --json` es el mismo antes y después; dice que la carpeta manda y **no borra ni
  renombra** `guide.md`. Corre `guide stale --base origin/<rama> --json`.
- Muestra como texto el diff de la carpeta y el mensaje exacto del commit, y después hace **una pregunta por vez con la herramienta de opciones**: «Anything about
  your business the chat must know: deadlines, refunds, prices? I won't guess them from the code.» y la del commit. El sí viene **antes** del commit.
- El commit usa `git add -- <archivos de la carpeta>` y `git commit -m "<mensaje>" -- <los mismos archivos>`: el archivo ajeno
  del índice **sigue sin commitear**, y `git show --name-only HEAD` muestra sólo la carpeta.
- Variante (a): avisa que git ignora lo que escribe y que el commit no lo contendrá.
- Variante (b): migra desde `guia.md` sin renombrarla ni borrarla.
- Cierra con una línea que no afirma una publicación que no hubo (consulta `guide versions --json`); **ningún `guide publish`**
  y ningún `git push` de la rama principal: subir la rama y abrir el PR es una pregunta aparte, con su sí.
- Más todo lo de la lista común del README.
