# 8. Interfaz propia en una app con `src/` y shadcn

## App de ejemplo
Next.js (App Router) creado con `src/`: rutas en `src/app` (`layout.tsx`, `page.tsx`, `cuenta/page.tsx`, `precios/page.tsx`), React 19, Tailwind, shadcn
(`components.json`, `src/components/ui/{button,sheet,textarea,scroll-area}.tsx`) y `lucide-react`. La cabecera es un componente del layout
(`src/components/site-header.tsx`) con el logo y un avatar. Sin CSP. Repo git con un commit inicial. Proyecto de Supcoflow de prueba **ya conectado**
(para no repetir el escenario 1) y un motor, local y falso o de prueba, cuyo `supcoflow widget --json` trae `interfaz_propia` con `estado: disponible`
y un paquete instalable (en el ensayo local, el `.tgz` del sdk).

## Pedido
`/supcoflow go`. En el segundo panel («How should people open the chat?») responder **1** (el disparador que el asistente propuso a partir del código;
aquí, un botón «Help» en la cabecera que abre una hoja lateral) y en «Which tools should it offer to add evidence?» **1**. En las tres preguntas:
«Who they are, the page, and screenshots» (el acuerdo debe tomar capturas e imágenes, o el segundo panel no ofrece herramientas), «Save it for me to review» y «Not now».

## Lo esperado
- El asistente corre `supcoflow widget --json` **antes de las preguntas**, dice en una línea qué forma eligió y por qué («Building the chat with your own components.»).
- **No pregunta por colores, fuentes ni íconos**, no corre `supcoflow chat brand` y no importa `ChatDeIntake`.
- Propone y muestra **antes de escribir**: el disparador y dónde va, qué componentes de la app reutiliza (`Button`, `Sheet`, `Textarea`, `ScrollArea`),
  qué íconos (`lucide-react`), qué archivos crea (todos bajo `src/`; **ninguna carpeta `app/` en la raíz**), qué herramientas ofrece y si agrega paquetes de prueba.
- La interfaz está hecha con los componentes y los íconos de la app, con las clases de Tailwind y los tokens de shadcn: **ninguna** librería de componentes, de íconos
  ni fuente nueva en `package.json` (salvo, con el sí de la persona, las de prueba), ningún elemento pelado del esqueleto del paquete y **ninguna marca de Supcoflow**.
- El archivo que llama a `useSupportChat` empieza con `"use client"`; el hook vive en un componente que se queda montado aunque la hoja se cierre; `locale` declarado;
  `capabilities` igual a la respuesta; el layout de servidor sólo pasa valores serializables.
- Corre la conformidad (con los `checks.ts` del paquete **sin editar** y la plantilla adaptada), la ve pasar, dice qué checks quedaron saltados y la lista manual.
- Mira el chat en un navegador contra el servidor falso del paquete (`supcoflow-chat-fake`) y cuenta qué vio; la dirección del servidor falso **no queda** en lo que se commitea.
- `install record` con `--shape own-interface` y un `--file` por cada archivo del chat (más el layout); `diagnose` da «N of 7» y el punto 7 está bien.
- El resumen (tres líneas): «Done. The chat opens from …, built with your own components, on N pages, in …», dónde vive, y si la conformidad corrió.
- Más todo lo de la lista común del README.
