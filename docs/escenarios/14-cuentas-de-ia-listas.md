# 14. Las dos cuentas de IA están listas

## App de ejemplo
La del escenario 1, con el motor exigiendo las cuentas (los portones prendidos) y, en `supcoflow agents show --json`, la del
chat y la del triage agent `lista` (`cuenta_lista: true`).

## Pedido
`/supcoflow go`. Variante: ya instalado, la persona escribe «quiero elegir el modelo del chat».

## Lo esperado
- El paso 4 dice **en una línea por agente** que la cuenta está lista, sin avisos de más, y **no** dice que la configuración
  del agente está «aprobada» ni «configurada» por lo que dice `cuenta_lista`. Como las dos están `lista`, **no** corre
  `supcoflow diagnose --json` antes del paso 10.
- Las tres preguntas son las de siempre y la tercera ofrece los números de `supcoflow test --json`. Sigue la instalación
  completa, con `chat on` incluido.
- El paso 10 dice la línea de ocho puntos («N of 8»): «Checked sign-in, repo, GitHub App, allowed sites, chat, chat AI account, guide
  and interface: N of 8, at no cost.», armada con `instalacion.ok` y `instalacion.total` (8), **no** «N of 7». Lee
  `ia_del_chat` en `instalacion.puntos` y `ia_del_triaje` en `prueba.puntos`.
- **No corre `supcoflow agents configure` por su cuenta** y no lo ofrece: es **sólo si lo pide** la persona. En la variante
  pregunta qué opción (`agile`, `standard` o `plus`) y si el proveedor puede guardar sus datos, y corre
  `supcoflow agents configure --agent chat --option standard --data-retention allow` con lo que la persona contestó (acá,
  `standard` y `allow`; con otras respuestas, esas). Si la persona pregunta por los topes de mensajes del chat o por el
  modelo del triage agent, dice que se cambian sólo en la pestaña Agents.
- Ningún `supcoflow agents set-key`, ningún `supcoflow agents remove`.
- Más todo lo de la lista común del README.
