# Poner el chat en Next.js

Camino probado: Next.js 16.4.2 (App Router, Turbopack), React 19.3.0 y `@supcoflow/chat` 2.2.1. Probado sólo al compilar (`next build`); no se corrió `next start` ni se abrió en un navegador.
**Pages Router: no probado; avisale a la persona** y no improvises.

## Por qué se usa el archivo envoltorio

En el App Router todo es componente de servidor salvo que el archivo diga `"use client"`. El paquete
`@supcoflow/chat` NO trae esa directiva (`dist/index.js` no la tiene) (la causa del fallo de abajo no está demostrada). Medido (R7, mismo
proyecto, mismo layout):

- Importando `ChatDeIntake` directo en `app/layout.tsx`, `next build` FALLA (salida 1) al prerenderizar `/` con
  `TypeError: (0 , r.useRef) is not a function`.
- Con el envoltorio que devuelve `supcoflow widget --json` (`nextjs.contenido`, que empieza con `"use client"`),
  `next build` termina bien (salida 0).

Síntoma medido, causa no probada; lo que sí se sabe: el paquete no trae `"use client"` y el envoltorio lo arregla. Por eso: no importes `ChatDeIntake` directo en un layout o en un componente de servidor; usá el envoltorio, tal
cual viene, sin reescribir los ids (`tenantId`, `projectId`, `backendUrl`). Va en `nextjs.archivo_sugerido`
(`app/_supcoflow/chat-de-soporte.tsx`) y se usa como `nextjs.uso` (`<ChatDeSoporte />`).

## Dónde ponerlo

- En `app/layout.tsx` (dentro de `<body>`) si el chat va en toda la app.
- Si la parte con sesión tiene su propio layout (p. ej. `app/(app)/layout.tsx`), ahí: es donde se traban los
  usuarios y donde se conoce quién es.

```tsx
import { ChatDeSoporte } from "./_supcoflow/chat-de-soporte";
// dentro del <body>, tras los hijos:
<ChatDeSoporte usuario={{ id: usuario.id, rol: usuario.rol }} />
```

(Ajustá la ruta del import a la del layout. `{ id, rol }` es sólo un ejemplo: pasá únicamente los campos que la persona aceptó.)

## El usuario, del lado del servidor

El layout es un componente de servidor: leé ahí la sesión de la app (la forma que ya use) y pasá sólo valores
serializables por props. El tipo de `usuario` del chat es `{ id, nombre, rol, atributos }`, pero la skill pasa
**únicamente los campos que la persona aceptó** compartir (la tabla del punto 5 de SKILL.md) y **nunca `nombre`**.
Sin sesión (parte pública), no pases `usuario`. No pases objetos de base de datos, funciones ni clases.

## La CSP

Sólo si la app ya tiene una, en `next.config.*` (`headers()`) o en el middleware/proxy. Seguí el punto 10 de
SKILL.md: agregá el origen del chat a la directiva `connect-src` que ya existe, conservando todo lo que tiene;
nunca escribas una segunda `connect-src`. Si la app no tiene CSP, no agregues ninguna.

## El origen del sitio

`supcoflow sitios agregar --sitio <origen>` lleva el origen (esquema y host, sin ruta) desde donde los usuarios
usan la app: su dominio público. `http://localhost:3000` sólo para una prueba local. Si el código no lo dice,
preguntáselo a la persona.
