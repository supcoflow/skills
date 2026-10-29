# 4. `guide.md` con cambios sin commitear

## App de ejemplo
Next.js con `.supcoflow/guide.md` ya commiteada y luego **editada a mano sin commitear** (por ejemplo, la persona
agregó una línea sobre un plazo de devolución). Además, un archivo ajeno en el índice de git (`git add` de algún
`README.md` modificado, sin commitear). Variantes para repetir aparte: (a) la guía está en `.gitignore`; (b) sólo
existe la guía con el nombre viejo `.supcoflow/guia.md`.

## Pedido
`/supcoflow go`  (o «actualizá la guía»)

## Lo esperado
- Antes de escribir, el asistente corre `git status --porcelain --ignored -- .supcoflow/guide.md`, ve el cambio y
  **no pisa el archivo**: muestra lo que haría y pregunta.
- Con el sí, escribe la guía en una llamada y corre `supcoflow guide check --json` en otra, hasta que salga con 0.
- Muestra **en UN solo mensaje** el diff de ese archivo, el mensaje exacto del commit y la pregunta «Anything about
  your business the chat must know — deadlines, refunds, prices? I won't guess them from the code.». El sí viene
  **antes** del commit.
- El commit usa `git add -- .supcoflow/guide.md` y `git commit -m "<mensaje>" -- .supcoflow/guide.md`: el archivo ajeno
  del índice **sigue sin commitear**, y `git show --name-only HEAD` muestra sólo la guía.
- Variante (a): avisa que git ignora la guía y que el commit declarado no la contendrá.
- Variante (b): avisa que `guia.md` es el nombre viejo y ofrece escribir `guide.md`; **no la renombra ni la borra**.
- Siempre, en el mensaje donde dice que la guía se publicó: «Pushing the guide to GitHub is up to you». **Ningún `git push`.**
- Más todo lo de la lista común del README.
