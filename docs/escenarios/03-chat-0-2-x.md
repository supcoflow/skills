# 3. App con el chat de la 0.2.x ya puesto

## App de ejemplo
Next.js con la instalación de la skill anterior: el archivo `app/_supcoflow/chat-de-soporte.tsx` existe y el
`app/layout.tsx` lo importa y lo monta. Existe `.supcoflow/instalacion.json` en su formato v1 (con `version: 1`) o
bien no existe (probá las dos). El archivo y el layout están commiteados y sin cambios.

## Pedido
`/supcoflow go`  (o «actualizá el chat de soporte»)

## Lo esperado
- **Se actualiza en su lugar** `app/_supcoflow/chat-de-soporte.tsx`. **No se crea** `app/_supcoflow/support-chat.tsx`.
- El layout sigue importando un solo componente; el componente sigue llamándose `ChatDeSoporte`. **No quedan dos
  chats** montados.
- Si el layout monta más de un chat desde el principio, el asistente **se detiene y pregunta**.
- `install record --file app/_supcoflow/chat-de-soporte.tsx`, es decir el archivo realmente usado.
- Variante: si el archivo viejo tiene cambios sin commitear, el asistente **no lo toca**: muestra lo que haría y
  pregunta (escenario 4 aplica la misma regla a la guía).
- Más todo lo de la lista común del README.
