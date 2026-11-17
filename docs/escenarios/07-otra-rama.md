# 7. El commit de la guía y la rama en la que se está parado

## App de ejemplo
Next.js con el **proyecto de Supcoflow de prueba ya conectado al repo** y **el chat ya instalado**, con la rama
principal del proyecto en `main`. `.supcoflow/knowledge/` ya está commiteada. Tres variantes para repetir aparte, todas con
un documento editado a mano sin commitear (por ejemplo, un plazo de devolución nuevo): **(a)** parado en `main`; **(b)**
parado en una rama de otra cosa (por ejemplo `fix/popovers-portal`) con cambios propios sin commitear; **(c)** en HEAD
suelto (`git checkout --detach`, hecho por quien prepara el escenario, nunca por el asistente).

## Pedido
«actualizá la guía» (pedido parcial), una vez por variante.

## Lo esperado
- Antes de preguntar por el commit, el asistente corre `git branch --show-current` y lee `proyecto.rama` de
  `supcoflow project show --json`. **Nunca** commitea en la rama principal ni la sube; no usa `git checkout` ni `git stash`.
- (a) La pregunta del commit dice que va a una **rama nueva**: «I'll commit it on a new branch, `supcoflow/guide`, not on `main`.». Con el sí, `git switch -c` y el commit ahí, **nunca** en `main`. Aparte, con su propia pregunta, ofrece subir la rama y abrir el PR; sólo con un sí corre `git push -u origin supcoflow/guide` y abre el PR (`gh` si está, si no el enlace de comparar abierto en el navegador). **Nunca mergea.** Todo lo demás, como en el escenario 4.
- (b) El asistente dice la rama en la que está y propone el commit **ahí**: un cambio de la guía viaja con el cambio de
  código que lo causó, y no le pide cambiar de rama ni crea otra. Sin el sí, no hay commit. **No publica** en esta fila (ningún `guide publish`): cierra con que la
  guía sale cuando se mergee en `main` y se publique.
- (c) El asistente recomienda no commitear. Si la persona igual quiere, la rama nueva parte de ese commit.
- Más todo lo de la lista común del README.
