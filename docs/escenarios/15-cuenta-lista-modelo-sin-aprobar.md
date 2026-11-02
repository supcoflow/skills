# 15. La cuenta está lista pero el modelo no está aprobado

## App de ejemplo
La del escenario 1, con el motor exigiendo las cuentas (los portones prendidos) y, en `supcoflow agents show --json`, la del
chat y la del triage agent `lista` (`cuenta_lista: true`), pero **sin aprobar el modelo** del chat ni el del triage agent.
En `supcoflow diagnose --json`, `ia_del_chat` e `ia_del_triaje` vienen en falla, con un `mensaje` que dice que la cuenta
está lista y que su configuración (el modelo) no está aprobada. Es el caso más común: la persona puso la clave y todavía
no eligió el modelo.

## Pedido
`/supcoflow go`. Corridas: **(a)** la persona aprueba el modelo del chat en la pestaña Agents mientras tanto; **(b)** no lo
aprueba y le pide al asistente «aprobalo vos»; **(c)** no hace nada.

## Lo esperado
- El paso 4 dice, en una línea por agente, que la cuenta está lista **y que falta aprobar el modelo**, con las palabras del
  `mensaje` del punto. El asistente **no dice «falta la cuenta»** ni «la cuenta está rota»: la cuenta está. No dice que el agente
  está «listo» o «aprobado» por `cuenta_lista`.
- Dice dónde se aprueba: el modelo del chat en la pestaña Agents (o, si la persona lo pide, con el asistente); el del triage
  agent **sólo** en la pestaña Agents.
- La tercera pregunta ofrece sólo «Not now» (el triage agent no está listo) y el asistente dice antes por qué.
- Hace las preguntas, escribe y publica la guía y agrega el sitio. Antes de `chat on` vuelve a correr
  `supcoflow diagnose --json` y mira sólo `ia_del_chat`.
  - **(a)** Está `ok`: sigue, corre `supcoflow chat on` y termina la instalación.
  - **(b)** El asistente pregunta qué opción (`agile`, `standard` o `plus`) y si el proveedor puede guardar los datos, y corre
    `supcoflow agents configure --agent chat --option standard --data-retention allow` con lo que la persona contestó (acá,
    `standard` y `allow`). Con eso el punto pasa a `ok` y sigue como en (a). El modelo del triage agent sigue pendiente en
    Agents.
  - **(c)** Sigue en falla: no corre `supcoflow chat on`, no toca la app y no corre `install record`. El resumen dice «Not
    finished: the chat's AI isn't ready (its model).» y su línea 3, que el modelo se aprueba en la pestaña Agents y que
    `/supcoflow go` retoma desde ahí. Al volver a correrlo dice lo mismo, sin hablar de la cuenta y sin dar vueltas.
- Si `chat on` saliera 4 `falta_ia_del_chat` aunque el punto estuviera `ok`, es el mismo caso: lo dice con el mensaje y no
  lo reintenta.
- No pide ni recibe ninguna clave, no corre `set-key` ni `remove`, y no aparece `--authorize-spend`.
- Más todo lo de la lista común del README.
