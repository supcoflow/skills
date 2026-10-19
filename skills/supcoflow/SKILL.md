---
name: supcoflow
description: Instala y configura el chat de soporte de Supcoflow en una app (Next.js probado) con la terminal `supcoflow`. Usala cuando la persona pida "/supcoflow go", instalar el chat de Supcoflow, o configurar su chat, su guía o sus datos.
metadata:
  version: "0.1.1"
---

# Supcoflow go

Hablale a la persona en el idioma en que ella te habla.

## 1. Para qué

Dejar el chat de Supcoflow funcionando en esta app: que aparezca donde los usuarios se traban, que sepa de qué
trata la app (la guía) y que lo que reporten termine donde la persona eligió.

## 2. Cómo se habla con Supcoflow

- Siempre por la terminal y con `--json`. Primero `supcoflow describir --json`: si dice `"version":"0.6.0"`, usá
  `supcoflow` a secas en todo lo que sigue. Sólo si no está instalada o es otra versión, corré cada comando fijado:
  `npx -y supcoflow@0.6.0 describir --json`. Nunca `@latest` ni otra versión.
- Un comando de la terminal por llamada, tal cual: sin `;`, `&&` ni pipes, y sin agregar `echo $?`. El código de
  salida lo leés del resultado del propio comando.
- Nunca inventes un comando ni un flag: leelos de `describir --json` al empezar. Abajo, `supcoflow` quiere decir
  la terminal fijada.

| Código | Qué hacés |
|---|---|
| 0 | sigue |
| 1 | algo falló: contáselo a la persona con el mensaje y no reintentes más de una vez |
| 2 | falta sesión: `login --start` y `login --wait` |
| 3 | mandaste algo mal: corregilo vos con el mensaje |
| 4 | hace falta una persona: contale qué hay que decidir o hacer y esperá su respuesta |
| 5 | esperando a una persona: decile qué tiene que hacer y volvé a correr el mismo comando cuando te avise |
| 6 | tope alcanzado: no reintentes; contale el tope. |

El 5 de un `--start` (`login`, `repo conectar`) es lo normal: mostrale a la persona el enlace y el código (lo único
que tiene que hacer) y, en el mismo turno, sin esperar que te conteste, corré el `--wait`; él solo espera la
aprobación hasta 90 s. El 5 de la tabla es el del `--wait` que venció sin aprobación.

## 3. El orden

1. `supcoflow quien-soy --json` (con 2: `supcoflow login --start --json`, mostrás el enlace y el código y enseguida
   `supcoflow login --wait --json`, hasta que salga 0).
2. `supcoflow proyecto ver --json`; si no hay proyecto: `supcoflow repo conectar --start --json` →
   `supcoflow repo conectar --wait --json` → `supcoflow proyecto crear --json`.
3. `supcoflow configuracion --json`: lo que ya está fijado no se vuelve a preguntar. Sólo cuenta lo fijado:
   `acuerdo: null` o `politica.fijada_en: null` es sin fijar (aunque diga `modo: "relevar"`) → preguntalo, con el
   aviso de que relevar gasta.
4. Leer el código → propuesta → preguntas (punto 5) → aplicar la configuración (`supcoflow datos fijar`,
   `supcoflow politica fijar`).
5. Escribir `.supcoflow/guia.md` → `supcoflow guia revisar --json` → pedir el sí para el commit local →
   `supcoflow guia publicar --json`.
6. `supcoflow sitios agregar --sitio <origen de la app> --json` (el sitio donde la usan sus usuarios, p. ej. su
   dominio público; `http://localhost:3000` sólo para una prueba local; si el código no lo dice, preguntalo) →
   `supcoflow chat prender --json` → `supcoflow widget --json` → poner el componente.
7. `supcoflow instalacion anotar --skill <metadata.version de esta skill> --json` (el número es el `metadata.version`
   del encabezado YAML de este SKILL.md: si no lo tenés a la vista, abrí el archivo; nunca escrito aparte;
   `--app <carpeta>` si la app no está en la raíz) → resumen.

Cada paso se puede retomar: si la sesión se corta, `/supcoflow go` empieza por `configuracion` y sigue desde lo que falta.

## 4. Lo que decidís vos

Lo técnico reversible: dónde aparece el chat, posición, título, saludo, colores (`supcoflow chat marca`), idioma,
qué pantallas cubre la guía. Se dice en el resumen; no se pregunta.

## 5. Lo que le preguntás SIEMPRE a la persona

Estas tres, no lo decidas vos aunque el código lo sugiera:

- **Qué datos de sus usuarios ve el chat** (id, rol, atributos, página y navegador, capturas, elementos señalados,
  mail). Antes de preguntar, explicale el alcance real: el acuerdo frena lo que se GUARDA en Supcoflow y lo que lee la
  IA que releva, no lo que ve la IA del chat mientras conversa; y este chat les ofrece siempre a los usuarios las
  capturas y el señalar elementos (no se apagan en el código: si los rechaza, se descartan al guardar).
  Cada respuesta va a su mecanismo, todos a la vez, con UN `supcoflow datos fijar --permitir <lista>` (o `nada`):

  | Dato | En Supcoflow (`--permitir`) | En el código de la app |
  |---|---|---|
  | id, rol, atributos | `usuario_id`, `usuario_rol`, `atributo:<nombre>` | sólo esos campos en `usuario` |
  | página y navegador | `pagina_y_navegador` | si lo rechaza: `contextoAutomatico={false}` y sin `contexto.versionApp` |
  | capturas, elementos, mail | `capturas`, `elementos`, `email` | — (no hay opción en el chat 2.2.1; se dice) |

- **Qué pasa con cada problema**: guardarlo, o relevarlo y abrir un issue (`supcoflow politica fijar --modo guardar`
  o `--modo relevar`). Decile que relevar **gasta**, dentro del tope mensual del equipo, y que con «guardar» una
  persona puede pedir el relevamiento después.
- **Si hay reglas de su negocio** (plazos, reintegros, precios, compromisos) que el chat tenga que saber. **Nunca
  las deduzcas del código**; si no hay, la guía no las lleva.

## 6. Mostrar antes de aplicar

Mostrale la propuesta de configuración y la lista de archivos que vas a crear o cambiar antes de `datos fijar`,
`politica fijar` y de tocar archivos.

## 7. No pisar

Antes de tocar un archivo: `git status --porcelain --ignored -- <archivo>`. Si tiene cambios sin commit, está
borrado sin commit, o existe sin estar versionado (también si git lo ignora), no lo toques: mostrá lo que harías y
preguntá, salvo los archivos que creaste o cambiaste vos en esta sesión (la guía entre rondas de `guia revisar`, un
layout que ya tocaste). Nunca `--force`, nunca borrar archivos de la app.

## 8. La guía

Formato y ejemplo en [`referencias/guia.md`](referencias/guia.md). Leé el código y, si existe, el `CLAUDE.md`/`README`
para entender las pantallas; una sección por pantalla o función que un usuario usa; «Problemas comunes» sólo de algo
visible (un issue, un TODO, el README) o dictado por la persona. `supcoflow guia revisar --json` hasta que salga 0.

## 9. Publicar la guía

Nunca `git push`, ni a la rama principal ni a otra.

1. Si `git status --porcelain --ignored -- .supcoflow/guia.md` dice que git la ignora (`!!`), no se puede commitear:
   decile que el commit declarado no la va a contener. Si no, y la salida no está vacía (nueva o cambiada), mostrale el diff de ESE archivo y el mensaje de
   commit propuesto, y preguntale si lo deja en un commit local («queda guardado en tu repo; no lo subo a GitHub»).
   El sí va ANTES del commit.
2. Con un sí: `git add -- .supcoflow/guia.md` (si es nuevo, sin esto el commit falla) y después
   `git commit -m "<mensaje>" -- .supcoflow/guia.md`: con la ruta, lo que la persona tenga en el índice queda ahí, sin
   commitear. Nunca `git add .` ni `git commit -a`. Verificá con `git show --name-only HEAD` que el commit nuevo toca
   sólo ese archivo. Con un no: no commitees, y decile que la guía se publica igual pero el commit que queda anotado
   es uno que todavía no la contiene.
3. `supcoflow guia publicar --json`, sin `--desde-github`. Repetirlo con la misma guía devuelve la misma publicación
   (`ya_publicada`): una sesión cortada se retoma sin duplicar.
4. Avisale en una línea que subir la guía a GitHub queda en sus manos.

## 10. Poner el chat

Camino probado en [`referencias/nextjs.md`](referencias/nextjs.md).

- Instalá el paquete con el gestor de la app y la versión exacta de `supcoflow widget --json` (`instalar`, traducido
  al gestor).
- El archivo envoltorio con `nextjs.contenido` tal cual, SIN reescribir los ids, en `nextjs.archivo_sugerido` (la ruta
  sugerida, relativa a la carpeta de la app —la de `--app`, si no está en la raíz—; podés elegir otra si la app lo
  pide). Si la app usa `src/app`, va dentro de `src/app`: nunca crees un `app/` al lado, porque Next ignoraría
  `src/app` y todas las rutas darían 404. Usalo (`nextjs.uso`) en el layout
  que cubre las pantallas donde se traban los usuarios; pasale `usuario` y `contextoAutomatico` según la tabla del
  punto 5.
- **CSP**: una segunda directiva `connect-src` se ignora, y reemplazar la que hay borra destinos que la app necesita.
  - Si ya tiene `connect-src`, agregale el origen del chat conservando todo lo que tiene.
  - Si no tiene `connect-src` pero sí `default-src`, creá `connect-src` con las fuentes de `default-src` más el chat.
  - Si no tiene CSP, no agregues ninguna.
  - La línea `csp` de `widget --json` es la referencia para una CSP nueva, no para pegar al lado de otra.
- La línea de `<script>` no es para Next.js.

## 11. Lo que no hacés

Gastar (no hay en esta versión ningún comando de prueba que gaste: si la persona pide probar, decile que eso viene
después), subir el tope, borrar el proyecto, encender la fábrica, dar acceso a personas (la API los rechaza por
clave: son de la consola). Nunca muestres ni copies una clave `scf_`.

## 12. Sin red

Si un comando sale 1 con un error de red, decíselo en una línea («desde acá no llego a Supcoflow; corré esto en tu
terminal») con el comando exacto, y no reintentes.

## 13. El resumen final

Dos o tres líneas: qué quedó configurado, dónde quedó el chat y qué falta si falta algo. La persona corrige.
