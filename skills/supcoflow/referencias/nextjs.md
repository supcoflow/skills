# Put the chat in Next.js

Tested path: Next.js 16.4.2 (App Router, Turbopack), React 19.3.0 and `@supcoflow/chat` 2.2.1. Tested only at build time
(`next build`); `next start` was not run and it was not opened in a browser. The wrapper is the same in the version
that `supcoflow widget --json` gives (2.3.0); the first real run of the 0.3.0 skill is what confirms it.
**Pages Router: not tested; tell the person** and do not improvise.

## Why the wrapper file is used

In the App Router everything is a server component unless the file says `"use client"`. The `@supcoflow/chat`
package does NOT carry that directive (`dist/index.js` does not have it). Measured (R7, same project, same layout):

- Importing `ChatDeIntake` directly in `app/layout.tsx`, `next build` FAILS (exit 1) when prerendering `/` with
  `TypeError: (0 , r.useRef) is not a function`.
- With the wrapper that `supcoflow widget --json` returns (`nextjs.contenido`, which starts with `"use client"`),
  `next build` ends well (exit 0).

Measured symptom, cause not proven; what is known: the package does not carry `"use client"` and the wrapper fixes it.
So: do not import `ChatDeIntake` directly in a layout or a server component; use the wrapper, as it comes, without
rewriting the ids (`tenantId`, `projectId`, `backendUrl`). It goes in `nextjs.archivo_sugerido`
(`app/_supcoflow/support-chat.tsx`) and is used as `nextjs.uso`. The path is relative to the app's folder (with
`--app apps/web`, to `apps/web`). If the app uses `src/app`, it goes in `src/app/_supcoflow/support-chat.tsx`: never
create an `app/` next to `src/app` (Next would ignore `src/app` and every route would give 404).

**If the chat is already installed** (the 0.2.x skill put it in `app/_supcoflow/chat-de-soporte.tsx`): do not create the
new file next to it. Follow the order of point 10 of SKILL.md (`.supcoflow/instalacion.json`, then what the layout
imports, then `nextjs.archivos_anteriores`) and update that file in place; two chats would mean two bubbles.

## Where to put it

- In `app/layout.tsx` (inside `<body>`) if the chat goes in the whole app.
- If the part with a session has its own layout (e.g. `app/(app)/layout.tsx`), there: it is where users get stuck and
  where who they are is known.

```tsx
import { ChatDeSoporte } from "./_supcoflow/support-chat";
// inside the <body>, after the children:
<ChatDeSoporte usuario={{ id: user.id, rol: user.role }} />
```

(Adjust the import path to the layout's. The component is still called `ChatDeSoporte` even though the new file is
`support-chat.tsx`, so the import an older layout already has keeps working; `nextjs.uso` and `nextjs.contenido` are the reference; `{ id, rol }` is just an example: pass only the fields the person accepted.)

## The user, from the server side

The layout is a server component: read the app's session there (the way it already does) and pass only serializable
values through props. The chat's `usuario` type is `{ id, nombre, rol, atributos }`, but the skill passes **only the
fields the person accepted** to share (the table of point 5 of SKILL.md) and **never `nombre`**. Without a session
(public part), do not pass `usuario`. Do not pass database objects, functions or classes.

## The CSP

Only if the app already has one, in `next.config.*` (`headers()`) or in the middleware/proxy. Follow point 10 of
SKILL.md: add the chat's origin to the `connect-src` directive that already exists, keeping everything it has; never
write a second `connect-src`. If the app has no CSP, do not add any.

## The site's origin

`supcoflow sites add --site <origin>` carries the origin (scheme and host, no path) from where users use the app: its
public domain. `http://localhost:3000` only for a local test. If the code does not say, ask the person.
