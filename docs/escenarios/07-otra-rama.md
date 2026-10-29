# 7. El commit de la guía y la rama en la que se está parado

## App de ejemplo
Next.js con el **proyecto de Supcoflow de prueba ya conectado al repo** y **el chat ya instalado**, con la rama
principal del proyecto en `main`. `.supcoflow/guide.md` ya está commiteada. Tres variantes para repetir aparte, todas con
la guía editada a mano sin commitear (por ejemplo, un plazo de devolución nuevo): **(a)** parado en `main`; **(b)** parado
en una rama de otra cosa (por ejemplo `fix/popovers-portal`) con cambios propios sin commitear; **(c)** en HEAD suelto
(`git checkout --detach`, hecho por quien prepara el escenario, nunca por el asistente).

## Pedido
«actualizá la guía» (pedido parcial), una vez por variante.

## Lo esperado
- Antes de preguntar por el commit, el asistente corre `git branch --show-current` y lee `proyecto.rama` de
  `supcoflow project show --json`. **Nunca** cambia de rama ni crea una (ningún `git checkout`, `git switch` ni
  `git branch <nombre>`).
- (a) La pregunta del commit **nombra la rama**: «I'll leave it in a local commit on `main`…». Todo lo demás, como en el
  escenario 4.
- (b) El asistente dice que está en `fix/popovers-portal`, no en `main`, y **recomienda no commitear ahí**. Dentro de la
  misma pregunta (no una nueva) ofrece las dos opciones: commitear igual en esa rama, o no commitear ahora (la guía se
  publica igual y se commitea en `main` cuando la persona quiera). Sin el sí, no hay commit.
- (c) El asistente recomienda no commitear y no habla de «una rama». Si la persona igual quiere, le dice que el commit
  no queda en ninguna rama.
- Si no hubo commit, la línea 3 del resumen suma «commit `.supcoflow/guide.md` on `main` when you want» y sigue en tres
  líneas.
- Más todo lo de la lista común del README.
