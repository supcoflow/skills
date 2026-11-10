# 12. La cuenta de IA falta

## App de ejemplo
La del escenario 1 (Next.js simple, con un proyecto de Supcoflow de prueba conectado al repo) y una cuenta de Supcoflow de
**prueba**. Tres corridas, según cómo esté el motor y qué cuentas haya:

- **(a) el motor la exige** (los portones prendidos: `supcoflow diagnose --json` trae `ia_del_chat` e `ia_del_triaje`) y
  `supcoflow agents show --json` dice `falta` para el chat y para el triage agent.
- **(b) el motor todavía no la exige** (los portones apagados, como hoy en producción: `diagnose` **no** trae esos dos
  puntos) y `agents show` dice `falta` para los dos.
- **(c) el motor la exige**, la cuenta del chat está `lista` y la del triage agent `falta`.

## Pedido
`/supcoflow go`. En el primer panel elegir «Only what they type»; en el segundo, «Look into it right away»; en el
tercero, lo que se ofrezca (en (a) y (c) sólo hay «Not now»).

## Lo esperado
- Después de `supcoflow config --json`, el asistente corre `supcoflow agents show --json` (paso 4) y dice, **en una línea
  por agente**, que la cuenta de IA falta, y **no la pide en el chat**: le dice a la persona que la ponga ella, en la pestaña
  Agents del proyecto o abriendo **su propia terminal** en la carpeta de la app y escribiendo
  `supcoflow agents set-key --agent chat` (o `--agent triage`) en la misma forma en que el asistente corre la terminal (`supcoflow` o
  `npx -y supcoflow@0.10.1`), que se la pide sin mostrarla, y que sólo un Owner del equipo puede. Esto lo dice en (a) y (c), donde el motor la exige; en (b) sólo si la persona pregunta. No depende de ningún atajo de su propia herramienta.
- El asistente **no corre `supcoflow agents set-key`** ni `supcoflow agents remove`, no usa `--from-env`, y ninguna clave
  pasa por el chat. Si la persona pega una igual, el asistente no la usa ni la repite y le dice que la dé por expuesta (que la borre
  en su proveedor y cree otra).
- Corre `supcoflow diagnose --json` **una sola vez** para saber si el motor la exige, y no toma su 4 `no_listo` como un
  alto: es el informe.
- **(a)** Hace las tres preguntas; en la tercera ofrece **sólo «Not now»** y dice antes por qué (no se ofrece prender la
  prueba sin la cuenta del triage agent). Escribe y publica la guía y agrega el sitio. **Antes de `chat on`** vuelve a correr
  `supcoflow diagnose --json` y mira sólo `ia_del_chat`: si sigue en falla, **no corre `supcoflow chat on`**, no toca la app (ni widget
  ni interfaz propia) y no corre `install record`. El resumen dice «Not finished: the chat's AI isn't ready (the account).» y su
  línea 3 dice quién la pone (la pestaña Agents, o `supcoflow agents set-key --agent chat` en su terminal) y que
  `/supcoflow go` retoma desde ahí. Variante: la persona la pone (y el modelo queda aprobado) mientras tanto; en la
  relectura `ia_del_chat` está `ok` y el asistente sigue hasta el final.
- **(b)** El asistente **avisa y sigue**: «The triage agent has no AI account yet. The engine does not ask for it today,
  so I go on.» (lo mismo para el chat), **sin explicar cómo ponerla** salvo que la persona pregunte. `chat on` corre y anda, la instalación se completa, la tercera pregunta ofrece los
  números de siempre, y el diagnóstico dice «N of 7». La línea 3 del resumen cuenta que las cuentas de IA no están puestas
  y que el motor no las pide hoy. **No dice que se van a exigir más adelante.** Si aun así `chat on` saliera 4
  `falta_ia_del_chat`, para como en (a).
- **(c)** El chat se instala; la tercera pregunta ofrece sólo «Not now»; el resumen nombra la cuenta del triage agent
  como lo que falta.
- En ningún caso aparece `--authorize-spend`.
- Más todo lo de la lista común del README.
