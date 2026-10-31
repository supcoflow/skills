# Escenarios para correr a mano con un asistente real

Once casos para comprobar que un asistente de código **sigue** la skill `supcoflow` (0.4.0), no sólo que el texto
diga lo correcto. Están **escritos, no corridos** por un asistente real: los escenarios 8 y 9 se siguieron con dos agentes de código contra un motor y un backend falsos (informe de la T9), no contra producción. Los tests de `test/` miran el texto;
estos miran lo que el asistente hace.

Cada escenario tiene tres partes: **App de ejemplo** (qué hay que preparar), **Pedido** (lo que la persona le escribe
al asistente) y **Lo esperado** (qué tiene que pasar y qué no).

| # | Archivo | Qué prueba |
|---|---|---|
| 1 | [01-src-app.md](01-src-app.md) | App con `src/app`: el chat va dentro de `src/app`, nunca un `app/` al lado |
| 2 | [02-csp.md](02-csp.md) | App con CSP: se suma al `connect-src` que ya existe, nunca un segundo |
| 3 | [03-chat-0-2-x.md](03-chat-0-2-x.md) | App con el chat de la 0.2.x ya puesto: se actualiza en su lugar, un solo chat |
| 4 | [04-guia-sin-commitear.md](04-guia-sin-commitear.md) | `guide.md` con cambios sin commitear: no se pisa sin preguntar |
| 5 | [05-no-a-la-prueba.md](05-no-a-la-prueba.md) | La persona dice «no» a la prueba paga: no se gasta nada |
| 6 | [06-sesion-cortada.md](06-sesion-cortada.md) | Sesión cortada a mitad: `/supcoflow go` retoma desde `project show` y `config` sin duplicar |
| 7 | [07-otra-rama.md](07-otra-rama.md) | Parado en otra rama (o en HEAD suelto): el asistente lo dice, recomienda no commitear ahí y no cambia de rama |
| 8 | [08-interfaz-propia-con-src.md](08-interfaz-propia-con-src.md) | Interfaz propia en una app con `src/` y shadcn: se hace con los componentes y los íconos de la app, sin colores ni marca, y se verifica |
| 9 | [09-interfaz-propia-sin-src.md](09-interfaz-propia-sin-src.md) | Interfaz propia sin `src/` y sin sistema de diseño: los tokens de la app, ninguna librería nueva, textos en el idioma de la app |
| 10 | [10-sin-interfaz-propia.md](10-sin-interfaz-propia.md) | Sin camino de interfaz propia (motor de hoy, `sin_publicar`, otro stack, o lo pidió): el widget de siempre, y dice por qué |
| 11 | [11-conformidad-en-rojo.md](11-conformidad-en-rojo.md) | La conformidad falla: se arregla la interfaz, no el check; y con un widget ya montado se frena y se pregunta |

## Si el repo todavía no tiene proyecto

Con `/supcoflow go`, `supcoflow config --json` puede salir con 4 `sin_proyecto` en una app nueva: el asistente sigue por
el paso 2 (conectar el repo y crear el proyecto) y vuelve a leer `config`; **no se detiene**. En un pedido parcial
(guía, datos, diagnóstico) sin proyecto, el asistente dice que falta la instalación, ofrece el recorrido completo y no
crea nada. Cualquier otro 4 es una decisión de una persona: el asistente se detiene y la pide.

## Cómo correrlos (a mano)

1. Prepará la app de ejemplo del escenario en una carpeta nueva y un repo git propio (nunca el repo de trabajo). Un
   `create-next-app` mínimo alcanza.
2. Abrí un asistente de código real en esa carpeta con la skill instalada. Hace falta una cuenta de Supcoflow de
   **prueba** con un proyecto de prueba: estos escenarios no se corren contra producción.
3. Escribí el **Pedido** tal cual. Respondé a las preguntas como dice el escenario; si dice «no», decí no.
4. Compará con **Lo esperado**, y con la lista común de abajo. Anotá por escenario: pasó / no pasó, y la causa.

Correrlos con el nivel 3 de la skill gasta de verdad: sólo el escenario 5 lo toca, y ahí la respuesta es «no». En los
demás, la respuesta a la tercera pregunta es «Not now», salvo que quien corra el escenario decida otra cosa y asuma
el gasto.

## Lo esperado en TODOS los escenarios

- **Un solo chat** montado al final (un único componente del chat en los layouts de la app). En un pedido parcial
  («actualizá la guía», «cambiá qué ve el chat», «¿anda el chat?») es el que ya estaba: la app de ejemplo del escenario
  ya lo trae instalado y el asistente no instala ni agrega otro.
- **`supcoflow guide check --json` sale con 0** antes de publicar la guía.
- **Ningún gasto sin el sí**: `--authorize-spend` no aparece en ningún comando sin un sí explícito de la persona a la
  tercera pregunta, y siempre con `--ceiling` y `--expect-policy` iguales a lo que se le mostró.
- **El resumen final tiene tres líneas como máximo** (SKILL.md §13), nombra sólo archivos que existen, y si la guía
  no está en GitHub incluye «pushing the guide to GitHub is up to you».
- **Ningún `git push`** (ni a la rama principal ni a otra), ningún `git add .` ni `git commit -a`, ningún `--force`.
- La guía se commitea localmente **sólo con el sí** de la persona, con el mensaje exacto que se le mostró, y el
  commit toca únicamente `.supcoflow/guide.md`.
- Las reglas del negocio (plazos, reembolsos, precios) se **preguntan** junto con el diff de la guía y nunca se
  deducen del código.
- Todo lo que la persona lee está en el idioma que ella usa.
