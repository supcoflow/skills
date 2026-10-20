# Probar la instalación

Tres niveles, de menos a más. Se sube de nivel sólo si la persona lo pide o acepta; ninguno es obligatorio para
dar el chat por instalado.

| Nivel | Qué prueba | Gasta |
|---|---|---|
| 1 | Que el motor vea todo listo (`supcoflow diagnosticar --json`) | No |
| 2 | Que el chat ande de verdad en un navegador, sobre la app corriendo | La IA del chat (poco; no se mide acá) |
| 3 | Que un problema llegue hasta un issue en el repo (`supcoflow probar`) | Sí: un relevamiento, hasta un techo |

## Nivel 1: el diagnóstico

`supcoflow diagnosticar --json`: gratis y sin escribir nada. Sale 0 si está todo listo y 4 si algo hay que
arreglar. Cada punto de la lista que trae es una cosa que arreglar o saber: **no tengas una lista de puntos en la
cabeza**, leé los que vengan (puede haber puntos nuevos) y contale a la persona cada uno con sus palabras. Si es
algo que la skill ya sabe resolver (un sitio sin agregar, el chat apagado), proponelo y, con su sí, resolvelo; lo
demás se lo decís y no lo tocás.

## Nivel 2: el chat en un navegador

Antes, **avisale a la persona**: probar el chat es conversar con la IA del chat, y eso tiene un costo chico que
paga Supcoflow con su propia clave y no pasa por el tope de la persona; no crea ningún issue ni gasta un
relevamiento. Con su sí, seguí.

Necesitás la app corriendo (la persona la levanta, o le pedís el comando) y un navegador que puedas manejar
(Playwright, un navegador de tu entorno). Si no tenés ninguno, decilo y salteá el nivel: no lo simules.

El sitio desde el que abrís la app tiene que estar en `sitios` (`supcoflow sitios agregar --sitio
http://localhost:3000` para una prueba local, con la persona de acuerdo). Después, mirando lo que de verdad pasa
en la página, comprobá y contá cada una por separado:

1. **Monta**: el chat aparece donde lo pusiste. No supongas selectores: buscalo en la página que corre.
2. **Pasa las protecciones**: abrí el chat y mandá un saludo; tiene que contestar. Si no contesta, mirá la consola
   del navegador y la red: una política CSP que bloquea la conexión (`connect-src`), o un sitio que el motor no
   admite (el origen que abriste no está en `sitios`) son las dos causas que ya conocemos. Si no sabés cuál es,
   decilo así; no la adivines.
3. **Toma el usuario**: con una sesión iniciada en la app, el chat tiene que saber quién es en los campos que la
   persona autorizó (`usuario` del punto 5 de la skill) y nada de los que rechazó. Si la app no tiene sesión que
   puedas iniciar, decí que esto no lo pudiste probar.
4. **Sobrevive a navegar**: pasá a otra pantalla de la app sin recargar a mano; el chat sigue ahí y la
   conversación se mantiene.
5. **Sube una captura**: adjuntá una captura desde el propio chat. Contá si se subió o qué error dio.

Qué decirle a la persona: una línea por punto (anduvo, no anduvo, no pude probarlo), con la causa si la sabés.
**Nunca digas «anduvo» de lo que no viste andar.** Si algo falla por el código de la app, mostrá el arreglo y
preguntá antes de tocar archivos (punto 7 de la skill). No mandes reportes de verdad por el chat para probar: un
problema escrito en el chat puede arrancar un relevamiento que gasta.

## Nivel 3: un problema que llega a un issue (gasta)

Esta prueba **gasta dinero real**: un relevamiento, hasta el techo que dice el motor. Es la única cosa de la
skill que gasta y **nunca agregás `--autorizo-gasto` por tu cuenta**.

1. `supcoflow diagnosticar --json`. Si sale 4, arreglá o contale primero; no pidas dinero para una prueba que no
   puede llegar.
2. `supcoflow probar --json` (sin autorización: no manda nada). Sale 4 con `falta_autorizacion` y trae el techo, el
   saldo del mes, el tope y lo comprometido. Con una prueba abierta sale 4 `prueba_en_curso` con su id: seguila
   con el punto 5, no pidas otra.
3. **Preguntale a la persona**, citando los números tal como los dio `probar`: «Esta prueba gasta un relevamiento,
   hasta US$ <techo>. Te quedan US$ <saldo> este mes. Si el problema entra, se abre un issue de prueba, rotulado
   como tal, en tu repo, y queda abierto (yo no lo cierro). ¿La hago?». Si la política es `guardar`, decile que la
   prueba llega sólo hasta guardar el problema y no gasta. Una respuesta que no sea un sí claro es un no.
4. Sólo con el sí, en una llamada aparte: `supcoflow probar --autorizo-gasto --json`. Sale 5 con el `prueba_id`.
   Para usar un texto propio, `--mensaje "…"`; sin él va uno fijo del motor.
   - Sale 6 (`tope_mensual`): no reintentes; contale el tope y lo comprometido. Subirlo no es cosa tuya.
   - Sale 4 `techo_distinto`, `chat_deshabilitado` o `requiere_api_key`: contale el mensaje. No reintentes con otra
     autorización: si cambió el techo, volvé al punto 2 y preguntá de nuevo con el número nuevo.
   - Sale 1 con `intento_pendiente`: la respuesta no llegó y el pedido quedó guardado. Repetí
     `supcoflow probar --autorizo-gasto --json` **sin `--mensaje`** (retoma la misma prueba, no pide otra). Era el
     mismo sí de la persona.
5. `supcoflow probar --wait --json` (o con `--prueba <id>`): espera hasta 90 s por llamada.
   - 5: sigue corriendo; en el mismo turno, volvé a correr el mismo comando. No le pidas nada a la persona.
   - 0: llegó al desenlace. Con un issue, pasale el enlace. Con la política `guardar` es el caso guardado, no un
     issue: decíselo así.
   - 4: hace falta que la persona mire la prueba en la consola; pasale el enlace a la bandeja y el motivo que
     trae. **Un `arranque_incierto` no se relanza desde la terminal** (ni con otro `probar`): se relanza sólo
     desde la bandeja de la consola; decíselo.
6. **El cobro, como venga**: `leido` con el monto; `pendiente` o `perdido` se dicen como tales («todavía no se
   conoce el gasto real; como mucho, el techo»). Nunca lo cuentes como 0. Si quedó `pendiente`, la prueba terminó
   igual: más tarde, `supcoflow probar --wait --prueba <id> --json` lo vuelve a mirar.

Qué le contás al final: si hubo issue o caso guardado, el enlace, y el cobro tal como vino. El issue de la
prueba queda abierto en el repo: es de la persona cerrarlo. El resultado dice que la instalación llega hasta el
issue; no dice que el issue sea correcto.
