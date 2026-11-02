# 13. La cuenta de IA está rechazada o sin saldo

## App de ejemplo
La del escenario 1, con el motor exigiendo las cuentas (los portones prendidos) y, en `supcoflow agents show --json`, la
cuenta del chat `rechazada` y la del triage agent `sin_saldo`.

## Pedido
`/supcoflow go`. En cierto momento la persona contesta «ya lo arreglé» (después de cambiar la clave o de cargar saldo en su
proveedor). Corridas: **(a)** la cuenta queda lista; **(b)** sigue rechazada o sin saldo; **(c)** el proveedor no responde.

## Lo esperado
- El paso 4 dice cada estado **en palabras** («the provider rejects the key», «out of balance»), sin pegar el JSON, y que se
  arregla en su proveedor (o se reemplaza la clave con `supcoflow agents set-key` en **su** terminal, o en la pestaña
  Agents). **No pide la clave** y no corre `set-key` ni `remove`.
- Con la del chat sin estar `lista` y exigida, el asistente no ofrece prender el chat ni corre `supcoflow chat on`; con la
  del triage agent sin estar `lista` y exigida, la tercera pregunta ofrece sólo «Not now».
- Al oír «ya lo arreglé» corre `supcoflow agents check --agent chat --json` (y `--agent triage` para la otra): es gratis y
  no necesita ninguna clave de la persona.
  - **(a)** Sale 0: dice que la cuenta está lista, relee `supcoflow agents show --json` y sigue (ahora sí puede prender el
    chat y ofrecer la prueba).
  - **(b)** Sale 4 `cuenta_rechazada` o `cuenta_sin_saldo`: dice lo que dice el mensaje, no entra en un bucle de
    reintentos y no vuelve a mirar hasta que la persona diga que cambió algo.
  - **(c)** Sale 1 `proveedor_no_responde`: dice que el proveedor no contestó (no dice nada de la clave) y no reintenta más
    de una vez.
- Una cuenta lista por `agents check` **no** se cuenta como «configuración aprobada».
- En ningún caso aparece `--authorize-spend`, ni una clave en el chat.
- Más todo lo de la lista común del README.
