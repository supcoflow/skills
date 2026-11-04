# Revisión 1: skill `supcoflow` 0.5.0, el paso de la cuenta de IA del cliente

Revisor: Claude Opus 5.5. Lo pidió el dueño en lugar de GPT porque GPT no tenía cupo. Es la vuelta 1 de 2 como máximo.
Rama revisada: `fm/skill-paso-cuenta-ia` @ `2d352f2` del repo `skills`. Su padre es `797c386`, y el `main` local `f2f9781`
es ancestro de la rama, así que se integra en avance rápido limpio. La traje con `git fetch` desde el worktree del
trabajador a mi copia descartable. No escribí nada en la rama.
Lo revisé contra `/Users/germanflores/firstmate/data/skill-paso-cuenta-ia/revision-pedido.md` y contra el pedido del dueño
(`brief.md`, «Captain's intent»).
Para saber qué hace de verdad cada comando usé la terminal `firstmate/projects/cli` (main `4d6ba1e`) y el motor
`firstmate/projects/supcoflow` (main `0c89706c`), los dos sólo para leer.
**Nota sobre las rutas:** el pedido de revisión cita `/Users/germanflores/projects/Supcoflow/cli` y `.../Supcoflow/Supcoflow`.
Las rutas bajo `firstmate/projects/` son enlaces a esas mismas carpetas (`readlink`), así que el código es el mismo.

## Resumen en castellano simple

- **La clave de IA nunca pasa por el asistente.** Revisé todos los caminos y en ninguno el asistente pide, recibe, muestra o
  guarda la clave. Está bien resuelto.
- **Hoy, con los portones apagados, la skill no frena a nadie que hoy pueda instalar.** Avisa que falta la cuenta y sigue:
  prende el chat y ofrece la prueba como siempre.
- **Lo que dice de cada comando coincide con la terminal**: códigos de salida, campos del `--json`, estados y la línea
  «N of 7 / N of 8».
  El archivo de referencia `describe-0.10.0.json` es idéntico, byte por byte, a lo que imprime la terminal real.
- **Los pasos renumerados (de 9 a 10) quedaron bien**: no hay ninguna referencia rota.
- **Los tests pasan**: 274 de 274.
- **Hay un problema para el día en que se prendan los portones (P2).** Para el motor, un agente está listo cuando tiene la
  cuenta puesta **y además el modelo aprobado**. La skill sólo mira la cuenta. Es el caso más común de todos: la persona pone
  su clave y todavía no eligió el modelo. Ahí la skill le diría «falta la cuenta del chat» cuando la cuenta ya está, y cada
  vez que la persona vuelva a correr `/supcoflow go` chocaría contra lo mismo. Además nunca le dice que lo que falta es
  aprobar el modelo. El arreglo es de texto y es chico.
- **Veredicto: aprobado con cambios.** Recomiendo **no integrar todavía**: primero arreglar el P2, que se resuelve con unas
  pocas líneas. Los P3 son mejoras y pueden ir en la misma vuelta o después.
- **No hay preguntas para el dueño.** Las dos dudas de producto que encontré tienen una opción por defecto razonable, que
  dejo como recomendación (P3-1 y P3-6).

## Qué hice (evidencia)

| Comprobación | Comando o lectura | Resultado |
|---|---|---|
| Tests del repo | `npm ci` y `npm test` en mi copia, con la rama en `2d352f2` | `Tests 274 passed (274)` |
| Huella | `node scripts/huella.mjs` | `version 0.5.0`, huella `cae643f6…`, coincide con el vector |
| Vector de `describe` | `node --experimental-transform-types cli/src/cli.ts describe --json`, comparado con `test/vectores/describe-0.10.0.json` | `equal: true 0.10.0 0.10.0` |
| Avance rápido | `git merge-base --is-ancestor main rev/paso` | sí |
| Espacios sobrantes | `git diff --check f2f9781 rev/paso` | sin errores |
| Referencias a pasos | grep de `step N`, `Step N of`, `steps 1 to` en `skills/`, `docs/escenarios`, README | todas apuntan al paso nuevo (detalle abajo) |
| Terminal | `src/comandos/agentes.ts` (show, set-key, check, remove, configure), `configurar.ts:21-22`, `probar.ts:160-209` y `:400`, `src/diagnostico.ts`, `guia.ts:100-131`, `describir.ts` | ver la tabla de coincidencias |
| Motor | `src/cuentas-de-ia/portones.ts`, `src/agentes/listo-para-arrancar.ts`, `src/diagnostico/diagnosticar.ts:55-75, 159-171, 200-209, 302-317`, `app/api/proyectos/[projectId]/chat/route.ts:38-60`, `skill/route.ts:91-98`, `cuentas-de-ia/route.ts`, `src/pruebas/crear.ts:225-236`, `rige.ts` | ver los hallazgos |

### Coincidencias con la terminal (lo que está bien)

| Lo que dice la skill | Lo que hace la terminal | ¿Coincide? |
|---|---|---|
| `agents show` sale 0 aunque falte la cuenta; `agentes[].agente` es `chat` o `triaje`; `estado` es `lista`, `rechazada`, `sin_saldo` o `falta`; cualquier otro estado es uno que no conoce | `agentesVer`: sale `SALIDA.ok`, `ESTADOS` más `desconocido` | sí |
| `cuenta_lista` dice sólo que la cuenta está lista | `cuenta_lista: o.cuenta_lista === true`; `describe` dice lo mismo | sí |
| `set-key` sin terminal sale 4 `sin_terminal`; sólo un Owner puede (`requiere_dueno`) | `ponerLaClave`: `sin_terminal` 4; `ERRORES.requiere_dueno` 4 | sí |
| `agents check`: 0 lista; 4 `cuenta_rechazada` o `cuenta_sin_saldo`; 4 `sin_cuenta`; 1 `proveedor_no_responde` | `agentesValidar` y `errorDelMotor` | sí (falta `cuenta_no_lista`, ver P3-5) |
| `agents configure`: hacen falta las dos banderas; 3 `opcion_sin_medicion` o `sin_guardado_de_datos_no_disponible`; 4 `requiere_dueno`; `--agent triage` sale 4 `no_desde_la_terminal`; 0 o `sin_cambios` | `agentesConfigurar` | sí |
| `chat on` sale 4 `falta_ia_del_chat`; `test` sale 4 `falta_ia_del_triaje` | `configurar.ts:22` (`PIDEN_UNA_PERSONA`), `probar.ts:400` | sí |
| `diagnose`: `instalacion.ok`, `instalacion.total` (7 u 8), `ia_del_chat` en `instalacion.puntos`, `ia_del_triaje` en `prueba.puntos`; la línea dice «…chat, chat AI account, guide and interface: N of 8…» | `probar.ts:182-190`, `diagnostico.ts:17-39` (`opcional`, `lineaDeLoRevisado`), `grupoDelPunto` del motor | sí, palabra por palabra |
| Publicar la guía no depende de la cuenta | `skill/route.ts:93-94`: «Subir la guía desde el repo (`guia/publicar`) no pasa por acá porque no usa IA» | sí |
| «Requerida» = el punto **aparece** en `diagnose`, no si está `ok` | `diagnosticar.ts:63-68`: `cuentasDeIa` falta mientras el interruptor está apagado, y prendido se suman los dos puntos; con `guardar`, `ia_del_triaje` viene `ok: true` aunque no pase (`:302-315`) | sí: la lectura del trabajador es correcta (pregunta 1 del pedido) |

### Los portones apagados (pregunta 2 del pedido)

Con `LA_CUENTA_DEL_CLIENTE_RIGE = false` (`rige.ts`), `portonDelCamino` devuelve «pasa» sin leer nada. `diagnose` no trae
los puntos de la cuenta. `GET cuentas-de-ia` sí funciona: no depende del interruptor y alcanza con el permiso `consultar`.
`agents show` dice `falta` para casi todos los clientes de hoy.
Recorrí paso por paso el SKILL.md (pasos 4, 5, 8 y 10, §13) y la referencia (§3):

- En el paso 4 corre `diagnose` una vez. No aparece ningún punto de la cuenta, así que avisa y sigue (`cuentas-de-ia.md:57-59`).
- En el paso 5 la regla de «Not now» se aplica sólo si la cuenta es «required», y no lo es.
- En el paso 8 el freno se aplica sólo si la cuenta es «required», así que `chat on` corre.
- En el paso 10 aparece «N of 7».
- El resumen pone la cuenta en la línea 3.

No encontré ningún camino que, con los portones apagados, deje de instalar o de ofrecer la prueba. Hay una sola excepción
teórica: que `agents show` o el `diagnose` del paso 4 fallen (P3-2).

### Renumeración (pregunta 8 del pedido)

Revisé cada referencia contra el diff:

- SKILL.md: `:28` «Step 3 of 10», `:71` «step 10», `:72` «step 7», `:76` «steps 1 to 10», `:104` «step 4», `:117` «step 9»,
  `:119` «step 6», `:172` «step 5», `:331` «step 6 / step 8».
- `interfaz-propia.md:35` «step 8». Sus «step 2» y «step 6» (`:35`, `:184`) son pasos propios de ese archivo.
- `guia.md:95` «step 2», que sigue siendo conectar el repo.
- `cuentas-de-ia.md`: `:11` «step 4», `:62` «step 8», `:84` «step 10».

Los escenarios viejos sólo nombran el paso 2, y el README dice «de nueve a diez». **No queda ninguna referencia vieja.**

### La clave nunca pasa por el asistente (pregunta 5 del pedido)

- SKILL.md §11 (`:355-357`), la fila del mapa (`:75`), `cuentas-de-ia.md:5-9` y §2 (`:32-45`) prohíben pedir la clave,
  aceptarla pegada, ponerla en un comando, un archivo o una variable, y correr `set-key` o `remove`.
- Un test (`test/skill.test.ts:1671`) impide que se nombren `--from-env`, `--key`, `--api-key` o `--token`.
- Si la persona pega la clave igual, la skill le dice que la dé por expuesta.
- Lo único que muestran `agents show` y `check` son los últimos 4 caracteres (`cuentaPublica`).

No encontré ningún camino por el que el asistente termine manejando una clave. La recomendación de P3-3 (el comando que
tiene que escribir la persona) no toca esto.

## Hallazgos

### P1

Ninguno.

### P2-1: La skill sólo mira la cuenta, pero el motor exige cuenta **y** modelo aprobado. Con los portones prendidos, el caso más común (la clave puesta y el modelo sin aprobar) termina en un diagnóstico equivocado y en un bucle

**Qué hace el motor.** El portón deja pasar sólo si se cumplen las dos cosas: `agenteListoParaArrancar({ cuenta, configuracionAprobada })`
(`supcoflow/src/agentes/listo-para-arrancar.ts:36-41`; `portones.ts:68-77`). El motivo `sin_configuracion` significa
«cuenta lista, modelo sin aprobar». En el chat, `configuracionAprobadaDelCamino` da `false` si no hay un perfil aprobado
(`listo-para-arrancar.ts:54-69`). Con ese motivo:

- `chat on` sale 409 `falta_ia_del_chat` (`chat/route.ts:45-50, 63`);
- la prueba con política `investigate` sale 409 `falta_ia_del_triaje` (`crear.ts:229-233`);
- `diagnose` trae `ia_del_chat` / `ia_del_triaje` en falso con el mensaje «The AI account of the chat is ready, but its
  configuration (the model) is not approved yet: approve it in the Agents tab» (`diagnosticar.ts:167-168`).

La terminal lo confirma: después de un `set-key` que sale bien, dice «Next: choose the chat's model with `agents configure`…,
or in the Agents tab» (`agentes.ts`, `ponerLaClave`), y `describe` dice que `agents configure` «saves and approves it in one
step».

**Qué hace la skill.**

- Decide solamente con `agentes[].estado` de `agents show`:
  - SKILL.md `:91-95`: el paso 4 corre `diagnose` sólo «if one is not `lista`»;
  - `:116-118`: el paso 8 vuelve a leer `agents show --agent chat` y, si dice `lista`, sigue;
  - `cuentas-de-ia.md:53-55, 60-68`.
- Si `chat on` sale `falta_ia_del_chat`, «it is this same case» (`:118`; `cuentas-de-ia.md:63-64`) y el resumen es
  «Not finished: the chat's AI account is missing.» (`:377`).
- Para un `ia_del_chat` / `ia_del_triaje` que falla, manda a `agents show` «to say which state that account is in»
  (`cuentas-de-ia.md:87-88`).
- Elegir el modelo del chat queda «only if the person asks» (`:70-73`).

**Cómo falla (portones prendidos).**

1. La persona pone las dos claves (en su terminal o en Agents) y no aprueba ningún modelo.
2. Paso 4: las dos dicen `lista`, así que la skill no corre `diagnose` y no avisa nada.
3. Paso 5: ofrece la prueba con los números de siempre.
4. Paso 8: `agents show --agent chat` dice `lista`, corre `chat on`, que sale 4 `falta_ia_del_chat`. La skill dice «the
   chat's AI account is missing», que es falso: la cuenta está.
5. El arreglo de verdad (aprobar el modelo del chat en Agents o con `agents configure`) nunca se dice.
6. El próximo `/supcoflow go` repite exactamente lo mismo.
7. En el paso 10, si la política es `investigate`, `ia_del_triaje` falla. La skill manda a `agents show`, que dice `lista`,
   y el asistente queda contradiciéndose. No se gasta plata (el punto frena la prueba), pero la persona no sabe qué hacer.

Escenario 14 (`docs/escenarios/14-cuentas-de-ia-listas.md:4-15`) da por hecho que, con las dos cuentas `lista` y los
portones prendidos, «Sigue la instalación completa, con `chat on` incluido». Con el motor de hoy eso pasa **sólo** si los dos
modelos ya están aprobados.

**Arreglo sugerido** (sólo texto y tests; elegir la forma le toca al trabajador):

- Que «listo» salga del motor y no de `agents show`. En el paso 4, cuando una cuenta no está `lista`, y en el paso 8 antes de
  `chat on` (en lugar de releer `agents show`, o además), leer el **`ok` y el `mensaje`** de `ia_del_chat` en `diagnose`.
  Ese punto no tiene la excepción de `save`, así que su `ok` es fiel. Para el triage, la presencia más `agents show` sigue
  sirviendo para la cuenta, y para el modelo alcanza con decir el `mensaje` del punto cuando falla.
- En §3 y §5 de `cuentas-de-ia.md`: si la cuenta está `lista` pero el punto falla (o `chat on` / `test` salen
  `falta_ia_del_*`), decir lo que dice el mensaje. Si lo que falta es aprobar el modelo:
  - del chat: «apruébalo en la pestaña Agents, o te lo elijo con `agents configure` si me decís la opción y si el proveedor
    puede guardar datos». Esto es pedirlo la persona, no ofrecerlo de oficio, así que respeta «sólo si lo pide»;
  - del triage agent: «sólo en la pestaña Agents» (decisión del dueño).
- En §13, línea 1: «Not finished: the chat's AI isn't ready (<the account | its model>).» en vez de «account is missing».
- Escenario 14: decir que las dos cuentas están listas **y los dos modelos aprobados**, y sumar una corrida (o un escenario
  15) con la clave puesta y el modelo sin aprobar.
- Tests: que el texto nombre «the model is not approved» / `sin_configuracion`, o su equivalente, y que el paso 8 no decida
  solamente con `estado`.

Con los portones apagados esto no se ve, porque el portón siempre pasa. Por eso es P2 y no P1. Pero esta versión de la skill
existe justamente para cuando se prendan, y conviene arreglarlo antes de integrar.

### P3

**P3-1. Con los portones apagados, la skill invita a poner una clave que hoy no se usa** (`cuentas-de-ia.md:32-36` y `:57-59`;
SKILL.md `:94-95`).

Con el interruptor apagado, el chat y el triaje pagan con la clave de Supcoflow: `mensaje.ts:150` devuelve `ia: null` y
`elLanzamientoPagaElCliente()` devuelve `false`. Hoy a casi todos los clientes les falta la cuenta. Tal como está escrito,
el asistente les diría a todos «Add it in the Agents tab, or … `set-key` … Only a team Owner can.», y algunos podrían ir a
crear y cargar saldo en un proveedor para nada.

El pedido del dueño era «avisa y sigue». Recomiendo que, cuando la cuenta **no** es requerida, se diga sólo la línea de §3
(«…The engine does not ask for it today, so I go on.») y el cómo ponerla quede para cuando la persona pregunte. También
recomiendo dejar escrito el orden: primero §3 (¿la exige?) y después §2 (quién la pone).

**P3-2. Si falla un paso que sólo lee, la instalación puede quedar frenada** (`cuentas-de-ia.md:25-26`, `:53-54`).

«Any exit other than 0 follows the table of point 2» lleva:

- con un 1, a «tell the person … do not retry more than once», sin decir si se sigue o no;
- con un 4 de `agents show` (por ejemplo un 403), a «wait for the answer».

El paso 4 es informativo, y el `diagnose` del paso 4 tampoco dice qué hacer si sale 1. Recomiendo agregar: «si `agents show`
o este `diagnose` no salen 0 ni 4 `no_listo`, decilo en una línea y seguí como "no se sabe si la exige"; `chat on` y `test`
lo dicen solos con `falta_ia_del_*`». Así, ni con los portones apagados ni con un motor raro se frena a nadie por un paso
que sólo lee.

En la misma línea: el `diagnose` del paso 4 trae muchos puntos en falso (la guía, el chat apagado…). Conviene decir «usalo
sólo para los puntos de la cuenta y no le cuentes el resto ahora», para que el asistente no se ponga a «arreglar» el resto
antes de tiempo.

**P3-3. El comando que se le da a la persona para su terminal** (`cuentas-de-ia.md:32-34`; SKILL.md `:377`).

Si la terminal global no es la 0.10.0, la skill usa `npx -y supcoflow@0.10.0` (SKILL.md `:20-23`). Pero a la persona se le
dice `supcoflow agents set-key --agent chat`. En su terminal eso puede ser una versión vieja sin `agents`, o no existir.
Recomiendo: «give them the same form you are using (plain `supcoflow` or `npx -y supcoflow@0.10.0`)».

**P3-4. «missing» para una cuenta `rechazada` o `sin_saldo`** (SKILL.md `:377`; `cuentas-de-ia.md:63`).

El resumen dice «the chat's AI account is missing» también cuando la cuenta está rechazada o sin saldo. Va junto con P2-1:
mejor «isn't ready» más el motivo.

**P3-5. Casos sueltos de `agents check` y del portón.**

- `check` también puede salir 4 `cuenta_no_lista` (cualquier otro estado, `agentes.ts` `agentesValidar`). La referencia no
  lo nombra; alcanza con «otro 4: decí el mensaje».
- Con los portones prendidos, si el motor no pudo leer la cuenta (`no_se_pudo_leer`), es un 503 que se puede reintentar.
  `chat on` lo convierte en 1 `respuesta_inesperada` (`configurar.ts:30-32`) y `diagnose` lo muestra como `ia_del_*` en falso
  con «We couldn't check…». La regla de §5, «A failing `ia_del_chat` … is something for the person to fix», no aplica a ese
  caso. Recomiendo «decí el mensaje del punto» en vez de dar por hecho que es algo de la persona.

**P3-6. Triage exigido, sin cuenta y política `save`** (pregunta 4 del pedido; SKILL.md `:103-105`; `cuentas-de-ia.md:65-68`).

El motor aceptaría esa prueba, que no gasta (`crear.ts:229`: con `guardar` no mira el portón). La skill ofrece sólo «Not
now». Me parece bien como opción conservadora: la política se elige en el mismo panel y así no hay que releerla. No hace
falta cambiarlo. Si se quiere afinar más adelante, se ofrecería la prueba sólo cuando `config` ya trae `save` fijada.

**P3-7. «Today» en `prueba.md:24-27`.**

«Today Supcoflow pays it with its own key…» va a quedar viejo en cuanto se prendan los portones, aunque la frase siguiente
ya pone la condición. Mejor sin «Today»: «While `ia_del_chat` is not among the points of `diagnose`, Supcoflow pays it…;
when it is, …».

## Respuesta a cada pregunta del pedido de revisión

1. **Requerida = presencia del punto.** Es correcto y alcanza para saber si la cuenta es exigida. No hay ningún caso en que
   el punto aparezca y la cuenta no se exija, ni al revés, salvo la excepción de `save` en el triage, que la skill ya
   contempla. Pero «exigida» no es lo mismo que «lista»: ver P2-1.
2. **Portones apagados no se rompe.** Confirmado, salvo el caso teórico de P3-2.
3. **Seguir y frenar en el paso 8, no en el 4.** Me parece bien: deja que un solo `/supcoflow go` termine. Con P2-1 arreglado,
   la relectura del paso 8 tiene que mirar «listo» de verdad, no sólo `estado`.
4. **«Not now» con `save`.** Está bien así (P3-6).
5. **La clave.** No queda ningún camino por el que el asistente maneje una clave.
6. **`agents check` sin bucles.** Coincide con la terminal (P3-5 es un detalle).
7. **`agents configure` sólo a pedido, topes y modelo del triage en Agents.** Coincide con la terminal y con lo que decidió
   el dueño. Ver P2-1 para cuando lo que falta es justamente el modelo.
8. **Diez pasos.** No queda ninguna referencia vieja.
9. **Diferencias anotadas.** Las cuatro son ciertas. Para la (i), `falta_ia_del_chat` / `falta_ia_del_triaje` no figuran en
   `describe`, pero sí en el código; lo confirmé. Falta una quinta: «lista» en `agents show` no quiere decir que el portón
   pase (P2-1).
10. **No se publica hasta que la 0.10.0 esté en npm.** Está escrito en el README y lo cubre un test. Nada se tocó fuera de
   `skills`.

## Recomendación

- **Veredicto: aprobado con cambios. No integrar todavía.** El trabajador tiene que arreglar P2-1 (texto, escenario 14 y
  tests) y conviene que en la misma vuelta sume P3-1 a P3-4, que son cambios chicos de texto. P3-5 a P3-7 son opcionales.
- Después de eso alcanza con una segunda vuelta corta, mirando sólo P2-1 y lo que se haya cambiado.
- No hay preguntas para el dueño. No se gastó nada, no se publicó nada y no se escribió nada en la rama.
