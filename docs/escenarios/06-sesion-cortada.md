# 6. Sesión cortada a mitad

## App de ejemplo
Next.js simple. Se corre `/supcoflow go` y se **corta la sesión** del asistente (cerrar la ventana) en tres momentos,
cada uno es una repetición del escenario: (a) después de `supcoflow repo connect` y `project create`, antes de la
guía; (b) después de `supcoflow guide publish`, antes de poner el componente en la app; (c) después de poner el
componente y de `install record`, antes del resumen. Después se abre una sesión nueva en la misma carpeta.

## Pedido
En la sesión nueva: `/supcoflow go`

## Lo esperado
- La sesión nueva empieza por `supcoflow config --json` y **sigue desde lo que falta**: no repite preguntas ya
  contestadas (lo fijado en `config` no se pregunta de nuevo; `acuerdo: null` o `politica.fijada_en: null` sí).
- No se crea un segundo proyecto ni se repite `repo connect` si el proyecto ya existe.
- (b): `supcoflow guide publish` repetido devuelve `ya_publicada` y **no duplica** la publicación; el asistente lo
  cuenta como éxito.
- (c): el asistente detecta que el chat ya está puesto (`.supcoflow/instalacion.json` y el layout), lo **actualiza
  en su lugar** y **no monta un segundo chat**.
- Ningún comando gasta: si en la sesión cortada había un sí a la prueba, **no** se reutiliza.
- Más todo lo de la lista común del README.
