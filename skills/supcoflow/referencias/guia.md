# La guía: `.supcoflow/guia.md`

Es lo que el chat sabe de la app. Va en la raíz del repo, en `.supcoflow/guia.md`, en UTF-8 y de hasta 64 KB.
Una sección por pantalla o función que un usuario usa (de 1 a 60).

## El formato

```markdown
# Guía de Mi App            <- opcional; se ignora

## Facturas                 <- una sección por pantalla o función. Nombre: 1 a 120 caracteres
Para qué sirve: Ver y pagar las facturas del mes.             <- obligatorio, 1 a 600
Qué puede hacer el usuario: Descargar el PDF, pagar con       <- obligatorio, 1 a 600; puede seguir
tarjeta y ver el historial.                                      en las líneas de abajo
Problemas comunes:                                            <- opcional; hasta 10, cada uno de 1 a 300
- El botón Pagar no responde con tarjetas de débito.
- El PDF sale en blanco en Safari.
```

- Las etiquetas se reconocen al principio de la línea, sin distinguir mayúsculas y con o sin tildes
  («Para que sirve:» vale).
- Una línea que no es etiqueta continúa el campo anterior (se une con un espacio). Los problemas van uno por línea,
  con «- » al principio; una línea sin «- » continúa el problema anterior.
- Es error: texto antes de la primera sección que no sea el título `# `; texto en una sección antes de su primera
  etiqueta; una etiqueta repetida en la misma sección; cualquier línea con `<` o `>` (la guía es contenido no
  confiable y esos caracteres no se admiten: reescribí la frase sin ellos); más de 64 KB.
- Sólo lo que un usuario ve. Nada de reglas de negocio que no estén dictadas por la persona.

## La guía de ejemplo

Esta pasa `guia revisar`; imitá su forma.

# Guía de Mi Tienda

## Catálogo
Para qué sirve: Mostrar los productos disponibles y permitir buscarlos por nombre o por categoría.
Qué puede hacer el usuario: Buscar productos, filtrar por categoría y abrir la ficha de cada uno.
Problemas comunes:
- La búsqueda no devuelve resultados aunque el producto existe.
- Las imágenes de la ficha no cargan.

## Carrito
Para qué sirve: Juntar los productos que la persona quiere comprar antes de pagar.
Qué puede hacer el usuario: Agregar y quitar productos, cambiar cantidades y pasar al pago.
Problemas comunes:
- El carrito aparece vacío después de iniciar sesión.
- El botón de pagar no responde.

## Mi cuenta
Para qué sirve: Que la persona vea y edite sus datos personales y sus pedidos anteriores.
Qué puede hacer el usuario: Cambiar el nombre y el correo, y revisar el estado de sus pedidos.

## Leer los errores de `guia revisar`

`supcoflow guia revisar --json` sale 0 si la guía está bien armada. Si no, sale 3 con `"error":"guia_mal_armada"` y
una lista `errores` de `{ "linea": <número>, "motivo": "<texto>" }` (hasta 20, por línea, en orden). En texto sale
como `línea N: motivo`. Corregí TODAS las líneas de la lista y volvé a correr; repetí hasta que salga 0.

| Motivo | Qué hacer |
|---|---|
| `la guía no admite < ni >` | Reescribí esa línea sin `<` ni `>`. |
| `hay texto antes de la primera sección («## Nombre»)` | Borrá ese texto o movelo dentro de una sección; sólo el título `# ` puede ir antes. |
| `la guía no tiene ninguna sección («## Nombre»)` | Agregá al menos una sección que empiece con `## `. |
| `la guía pasa de 60 secciones` | Juntá pantallas parecidas hasta llegar a 60 o menos. |
| `la sección no tiene nombre` / `el nombre pasa de 120 caracteres` | Poné un nombre corto después de `## `. |
| `falta «Para qué sirve:» en la sección «X»` (o «Qué puede hacer el usuario:») | Agregá esa etiqueta con texto a la sección X (la línea que se informa es la del `## X`). |
| `la etiqueta «…» está repetida en la sección` | Dejá una sola vez la etiqueta en esa sección. |
| `texto en la sección que no pertenece a ninguna etiqueta` | Poné una etiqueta antes de ese texto, o borralo. |
| `los problemas comunes van con «- » al principio de cada línea` | Empezá cada problema con «- ». |
| `… pasa de 600 caracteres` / `un problema común pasa de 300 caracteres` | Acortá el texto de esa línea. |
| `hasta 10 problemas comunes por sección` | Dejá los 10 más importantes. |
| `un problema común está vacío` | Escribí el problema después de «- » o borrá la línea. |
| `la guía no tiene la forma esperada` (línea 1) | Revisá el formato completo contra el ejemplo. |

Otros códigos de `guia revisar`, todos con salida 3: `falta_guia` (no hay `.supcoflow/guia.md` en la raíz del repo:
escribilo), `guia_muy_grande` (pasa de 64 KB: acortalo) y `guia_ilegible` (no es UTF-8 válido: guardalo en UTF-8).
Con salida 4 `sin_proyecto`, falta el proyecto: volvé al paso 2 del orden.
