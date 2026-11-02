# Revisión 2 (última): skill `supcoflow` 0.5.0, el paso de la cuenta de IA del cliente

Revisor: Claude Opus 5.5. Lo pidió el dueño en lugar de GPT porque GPT no tenía cupo. Es la vuelta 2 de 2, la última.
Rama revisada: `fm/skill-paso-cuenta-ia` @ `5120a9e` del repo `skills`. Su padre es `2d352f2`, el commit de la vuelta 1.
El `main` local `f2f9781` sigue siendo ancestro de la rama, así que se integra en avance rápido limpio.
La traje con `git fetch` desde el worktree del trabajador a mi copia descartable. No escribí nada en la rama.
La revisé contra `data/skill-paso-cuenta-ia/revision-pedido.md` (sección «Vuelta 2») y contra mi informe de la vuelta 1
(`data/skill-paso-cuenta-ia-rev1/report.md`).
Para saber qué hacen de verdad la terminal y el motor usé `firstmate/projects/cli` (main `4d6ba1e`) y
`firstmate/projects/supcoflow` (main `0c89706c`), los dos sólo para leer.
**Nota sobre las rutas:** el pedido cita `/Users/germanflores/projects/Supcoflow/...`. Usé las de `firstmate/projects/`,
que son enlaces a las mismas carpetas (lo comprobé en la vuelta 1).

## Resumen en castellano simple

- **Veredicto: integrar.** El problema importante de la vuelta 1 (P2-1) quedó bien arreglado. Para la skill, ahora un
  agente está listo cuando tiene la cuenta **y además** el modelo aprobado. Si la clave está puesta y falta aprobar el
  modelo, ya no dice «falta la cuenta»: dice que falta el modelo y dónde se aprueba.
- **Los siete P3 de la vuelta 1 quedaron resueltos.** Seis se arreglaron. El P3-6 se dejó como estaba, que era lo que yo
  recomendaba.
- **La clave sigue sin pasar nunca por el asistente.** Los arreglos no abrieron ningún camino nuevo.
- **Hoy, con los portones apagados, la skill sigue sin frenar a nadie.** Ahora corre `diagnose` una vez de más en el
  paso 4. Ese comando sólo lee: no escribe nada ni en la app ni en el motor. Si sale 4 «no listo», la skill lo toma como
  informe y sigue. Si sale con cualquier otro código, avisa en una línea y sigue igual.
- **Los tests pasan**: 282 de 282. La huella coincide con el vector y no queda ninguna referencia rota a los pasos.
- **Encontré tres detalles chicos nuevos (P3).** Ninguno frena la integración:
  - en `prueba.md` quedó una frase vieja que habla sólo de «la cuenta»;
  - en SKILL.md dos frases dicen «lo arregla la persona» y la referencia tiene excepciones;
  - con la política «guardar», la skill puede callar que falta el modelo del triage agent.

  Se pueden arreglar antes de integrar sin pedir otra vuelta, porque son cambios de texto. También pueden quedar para la
  próxima versión.
- **No hay preguntas para el dueño.**
- Recordatorio que ya está en el README: la 0.5.0 no se publica hasta que la terminal 0.10.0 esté en npm.

## Qué hice (evidencia)

| Comprobación | Comando o lectura | Resultado |
|---|---|---|
| Traer la rama | `git fetch <worktree del trabajador> fm/skill-paso-cuenta-ia:rev/paso`; `git checkout --detach 5120a9e` | `5120a9e` |
| Avance rápido | `git merge-base --is-ancestor main rev/paso` | sí |
| Tests | `npm test` | `Tests 282 passed (282)` |
| Huella | `node scripts/huella.mjs` frente a `test/vectores/huella-de-la-skill.json` | las dos dan `0.5.0` / `b6ea11f6…2d06`; el árbol queda limpio |
| Espacios sobrantes | `git diff --check f2f9781 5120a9e` | sin errores |
| Typecheck | el repo no tiene TypeScript propio ni un script de typecheck (`package.json`: `test` y `huella`) | no aplica |
| Informe de la vuelta 1 commiteado tal cual | `diff` de `rev1/report.md` contra `docs/revisiones/2026-11-02-skill-0-5-cuenta-ia-revision-1.md` | idénticos |
| Respuesta del trabajador | `docs/revisiones/2026-11-02-skill-0-5-cuenta-ia-respuesta-1.md` | contesta cada hallazgo |
| Referencias a pasos | grep de `step N`, `Step N of`, `steps 1 to` en `skills/` | todas apuntan bien |
| Frases viejas | grep de `account is missing`, `agents show --agent chat` | no queda ninguna en la skill, los escenarios ni el README |
| Motor | `src/agentes/listo-para-arrancar.ts:36-41`, `src/diagnostico/diagnosticar.ts:159-171, 200-209, 300-317`, `src/pruebas/crear.ts:224-232`, `app/api/proyectos/[projectId]/diagnostico/route.ts` (sólo `GET`) | ver abajo |
| Terminal | `src/comandos/probar.ts:107-113, 158-210` (`diagnosticar`, `revisarLaMaquina`), `src/api.ts:523-525` (`leerDiagnostico`, `GET`), `src/comandos/agentes.ts:190-233` (`agentesVer`) y `:366` | ver abajo |

## Comprobación de la vuelta 1, hallazgo por hallazgo

| Hallazgo de la vuelta 1 | Estado | Dónde lo comprobé |
|---|---|---|
| **P2-1**: listo = cuenta **y** modelo aprobado | **Resuelto** | Detalle en la sección siguiente. |
| P3-1: no invitar a poner una clave que hoy no se usa | Resuelto | `cuentas-de-ia.md:12-13`: primero la §3 y después la §2. `:35-36`: los pasos para ponerla se dan sólo si la exige o si la persona pregunta. `:66-69`: «do not explain how to put it unless they ask». Escenario 12 (b). |
| P3-2: un paso que sólo lee no frena | Resuelto | `cuentas-de-ia.md:29-31` (`agents show`) y `:61-64` (`diagnose`): el 4 `no_listo` es el informe; cualquier otra salida se dice en una línea y se sigue «sin saber si la exige». También dice que se use sólo para los dos puntos y que no se cuente el resto (SKILL.md `:97-98`). |
| P3-3: el comando, en la misma forma que usa la skill | Resuelto | `cuentas-de-ia.md:40-41` (`supcoflow` o `npx -y supcoflow@0.10.0`); escenario 12. |
| P3-4: no decir «missing» de una cuenta rechazada o sin saldo | Resuelto | SKILL.md `:381`: «Not finished: the chat's AI isn't ready (<the account \| its model>).» Un test impide «AI account is missing». |
| P3-5: otro 4 de `agents check` y «We couldn't check» | Resuelto | `cuentas-de-ia.md:48` (otro 4: decir su mensaje) y `:78-79` (no es de la persona; se puede volver a probar en un rato). Ver el P3-B nuevo: dos frases de SKILL.md no se ajustaron. |
| P3-6: triage exigido, sin cuenta y con `save` | Sin cambio, justificado | Era la opción por defecto que recomendé. `cuentas-de-ia.md:91-93` explica por qué. |
| P3-7: «Today» en `prueba.md` | Resuelto | `prueba.md:24-27`: «While `ia_del_chat` is not among the points…; when it is…». Un test impide «Today». |

### El P2-1 en detalle

**Cómo decide el motor.** El motor considera listo un agente cuando tiene la cuenta **y** la configuración aprobada
(`agenteListoParaArrancar`, `listo-para-arrancar.ts:36-41`). En la lista de lo que falta, la cuenta va primero y la
configuración después. Si falta el modelo, el punto falla con el mensaje «…is ready, but its configuration (the model) is
not approved yet: approve it in the Agents tab» (`diagnosticar.ts:167-168`).

**Cómo lo sigue ahora la skill:**

- **Paso 4** (SKILL.md `:91-100`): corre `agents show` y después **siempre** un `diagnose`, sólo para leer `ia_del_chat` e
  `ia_del_triaje`. Dice que un punto que falla quiere decir «no listo», aunque la cuenta diga `lista`.
- **§3 de la referencia** (`cuentas-de-ia.md:55-79`) separa los tres casos:
  - **No exigida.** Avisa y sigue.
  - **Exigida y lista.** No dice nada.
  - **Exigida y no lista.** Dice el motivo con lo que dice la cuenta y con el `mensaje` del punto, y nunca dice «falta la
    cuenta» si la cuenta está `lista`. El modelo del chat se aprueba en la pestaña Agents, o con `agents configure` si la
    persona se lo pide al asistente; el del triage agent, sólo en Agents. Lo dice una vez y no insiste.
- **Paso 5** (`:107-109`): con el triage agent exigido y no listo, la tercera pregunta ofrece sólo «Not now».
- **Paso 8** (`:120-122`): ya no vuelve a mirar `agents show`. Vuelve a correr `diagnose` y mira sólo `ia_del_chat`. Si
  sigue fallando, dice qué falta (la cuenta o el modelo, según lo que diga el punto) y termina con «Not finished».
- **§13** (`:381`): la línea 1 dice «isn't ready (<the account | its model>)» y la línea 3 dice dónde se arregla cada cosa.
- **Escenarios:** el 14 ahora pide los modelos aprobados. El 15 es nuevo: la cuenta está lista y falta el modelo, con tres
  corridas (lo aprueba la persona, se lo pide al asistente, no hace nada).

**Lo recorrí con los portones prendidos**, en el caso que fallaba en la vuelta 1: las dos cuentas `lista` y ningún modelo
aprobado.

1. En el paso 4 los dos puntos fallan con el mensaje del modelo. La skill dice «la cuenta está, falta aprobar el modelo» y
   dónde se aprueba.
2. En el paso 5 ofrece sólo «Not now». Esto vale si la política no es `save`; el caso con `save` está en la pregunta 3.
3. En el paso 8 corre `diagnose` otra vez y el punto sigue fallando. Termina con «Not finished: the chat's AI isn't ready
   (its model).»
4. El próximo `/supcoflow go` vuelve a decir lo mismo, que es correcto. Ya no hay un diagnóstico equivocado ni un callejón:
   la persona sabe qué tiene que hacer.

## Respuesta a las preguntas de la vuelta 2

**1. ¿Queda algún camino en que, con la cuenta `lista` y el modelo sin aprobar, la skill diga «falta la cuenta» o repita el
mismo callejón en cada `/supcoflow go`?**

En el recorrido principal, no: los pasos 4, 5, 8 y 10, §3, §5 y §13 dicen lo correcto. Cada `/supcoflow go` vuelve a decir
lo que falta hasta que la persona lo apruebe. Eso no es un bucle, porque el mensaje es el correcto y dice dónde se arregla.

Queda un solo resto en un camino poco probable: `prueba.md:105` (ver P3-A).

Hay un caso que conviene conocer, aunque no es un error. Si faltan la cuenta **y** el modelo, el motor nombra primero la
cuenta (`listo-para-arrancar.ts:38-39`), así que en el paso 4 la skill dice sólo «falta la cuenta». Si la persona la pone
durante la instalación, en el paso 8 el punto pasa a decir «falta el modelo», y la skill termina con «Not finished (its
model)». Hace falta un segundo `/supcoflow go` después de aprobarlo.

La skill no puede saberlo antes, porque `agents show` no dice nada del modelo (`agentes.ts:206-212`). Además, el
`set-key` de la terminal ya avisa «Next: choose the chat's model…» (`agentes.ts:366`). No lo cuento como hallazgo.

**2. Con los portones apagados, ¿el `diagnose` que ahora corre siempre en el paso 4 puede frenar o ensuciar algo?**

No. Lo comprobé en el código:

- **No escribe nada.** La terminal hace un `GET` al motor (`api.ts:523-525`) y la ruta del motor sólo tiene `GET`
  (`diagnostico/route.ts:24`). Del lado local, lee el `origin`, el `instalacion.json` y revisa la máquina con
  `revisarLaMaquina` (`probar.ts:107-113, 158-177`). Esa revisión ya la hacía el `test --json` del paso 5, y no escribe
  nada.
- **Salidas.** Sale 0 si todo está listo y 4 `no_listo` si no (`probar.ts:207-209`). La skill dice que ese 4 es el informe
  y no un alto (SKILL.md `:98`; `cuentas-de-ia.md:62-63`). Cualquier otra salida se dice en una línea y se sigue como «no se
  sabe si la exige» (`:63-64`). En ese caso el paso 5 ofrece la prueba como siempre, `chat on` corre, y el paso 10 vuelve
  a mirar antes de gastar.
- **Con los portones apagados no aparece ninguno de los dos puntos** (`diagnosticar.ts:63-68, 200-209, 302-317`). Entonces
  vale el caso «no exigida»: avisa en una línea, sólo si la cuenta no está `lista`, sin explicar cómo ponerla, y sigue. El
  chat se prende, la prueba se ofrece y el paso 10 dice «N of 7».
- **El riesgo de ensuciar la conversación** es que el asistente cuente o «arregle» los otros puntos del `diagnose` (la guía,
  el chat apagado…) antes de tiempo. El texto lo prohíbe en SKILL.md `:97-98` y en `cuentas-de-ia.md:61-62`.

**3. Con la política `save`, ¿está bien ofrecer la prueba cuando la cuenta está `lista` y el modelo sin aprobar, y dejar que
el paso 10 vuelva a mirar con la política ya fijada?**

Sí, y es seguro: no se puede gastar. Con `guardar`, el motor no mira el portón y la prueba se guarda sin investigar
(`crear.ts:226-231`).

Si en el mismo panel la persona cambia a «investigar», el paso 10 vuelve a correr `diagnose` con la política nueva. El
punto `ia_del_triaje` entonces falla (`diagnosticar.ts:308-314`), y la skill dice que no está lista y no corre la prueba
(SKILL.md `:132-134`). Si se llegara a intentar igual, el motor contesta 409 `falta_ia_del_triaje` antes de escribir nada.

Hay un detalle de texto que se puede mejorar (P3-C): en ese caso la skill no le cuenta a la persona que falta el modelo
del triage agent, aunque el mensaje del punto lo dice.

## Hallazgos nuevos

### P1

Ninguno.

### P2

Ninguno.

### P3 (opcionales; no frenan la integración)

**P3-A. En `prueba.md` quedaron frases que hablan sólo de «la cuenta» del triage agent** (`prueba.md:105`; también `:64-65`
y `:17`).

- `:105` dice que `falta_ia_del_triaje` (4) significa «the triage agent has no AI account the engine accepts… tell them to
  put or fix it». Pero el motor también devuelve ese 409 cuando la cuenta está y falta aprobar el modelo (`crear.ts:229-231`
  usa el mismo portón). Es el mismo error que arregló el P2-1, en un archivo que no se tocó.
- `:64` («and the account is not ready») y `:17` («A failing AI account is the person's to fix») también hablan sólo de la
  cuenta.

El daño es bajo. A esa salida se llega muy poco, porque el `diagnose` del nivel 3 y el del paso 10 frenan antes. Además, el
enlace lleva a la §3 de `cuentas-de-ia.md`, que dice lo correcto.

Arreglo sugerido para `:105`: «the triage agent isn't ready (its account, or its model not approved): say its message and
follow section 3 of `cuentas-de-ia.md`». Para `:64`: «and the agent is not ready».

**P3-B. Dos frases de SKILL.md dicen «es de la persona arreglarlo» y la referencia tiene excepciones** (SKILL.md `:71`, fila
«Does the chat work?», y `:132-133`, paso 10).

Las dos dicen que un `ia_del_chat` / `ia_del_triaje` que falla «is the person's to fix». La referencia tiene dos
excepciones. Si el motor no pudo leer la cuenta, no es algo de la persona (`cuentas-de-ia.md:78-79`). Y el modelo del chat
lo puede aprobar el asistente si la persona se lo pide (`:75-77`).

Las dos frases enlazan a la referencia, así que el daño es bajo. Arreglo sugerido: «…is handled as
`referencias/cuentas-de-ia.md` section 3 says» en vez de «is the person's to fix».

**P3-C. Con la política `save`, la skill puede callar que falta el modelo del triage agent** (`cuentas-de-ia.md:70` y
`:89-93`).

Con `save`, el punto `ia_del_triaje` viene `ok: true` aunque el agente no esté listo. Su `mensaje`, en cambio, nombra lo
que falta y aclara que con `save` no frena (`diagnosticar.ts:308-312`). La §3 dice que si el punto está `ok` y la cuenta
`lista`, el agente está listo y no hay nada que decir.

Entonces, con la cuenta lista, el modelo sin aprobar y `save`, la persona no se entera de que falta el modelo. Si en el
panel elige «investigar», el paso 10 no corre la prueba que había aceptado, y recién ahí se entera. No se gasta nada.

Arreglo sugerido, sin comparar textos: «when `politica` in `diagnose` is `guardar`, `ok` does not say whether the triage
agent is ready: say its `mensaje` in one line if it names something missing».

## Recomendación

- **Integrar** `fm/skill-paso-cuenta-ia` @ `5120a9e` en `main`. Es avance rápido limpio.
- Los tres P3 son de texto y opcionales. Si el trabajador los arregla antes de integrar, no hace falta otra vuelta de
  revisión: alcanza con que los tests sigan en verde y que la huella se rehaga. Si no, pueden quedar para la próxima
  versión.
- **No publicar** hasta que la terminal 0.10.0 esté en npm (README, sección Versiones; lo cubre un test).
- No hay preguntas para el dueño. No se gastó nada, no se publicó nada y no se escribió nada en la rama.
