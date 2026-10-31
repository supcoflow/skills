# Respuesta a la revisión de la skill 0.4.0 (T9), vuelta 1

Informe tal cual: `2026-10-31-t9-skill-0-4-revision-1.md` (aprobado con cambios menores, 0 P1, 0 P2, 9 P3). Sin vuelta 2, como pidió Firstmate.

| Hallazgo | Qué se hizo |
|---|---|
| P3-1 la versión final no la siguió un agente | Resuelto: ronda 3 con un agente sobre la app con `src/` y el acuerdo «Only the page and browser» (sin pregunta de herramientas, `capabilities` en `false`, 27/0/4 en la conformidad). El informe de la prueba dice qué capturas son de la ronda 2 y qué quedó sin re-ensayar. |
| P3-2 defectos que no lo son; captura repetida | Resuelto: quitados los dos «defectos» (`/__fake/state` sí devuelve `requests`; `diagnose --json` sin la línea es lo esperado), la frase del clic cita `requests`, y `app2-movil.png` se borró. |
| P3-3 volver más tarde | Resuelto en `interfaz-propia.md` («Coming back later»: instalar mostrando antes, `checks.ts` nuevo sin editar, conformidad, registrar otra vez) y en SKILL.md punto 10: con `archivo_no_versionado` o `cambios_sin_commit` se le dice a la persona que commitee o descarte `instalacion.json`; no se borra ni se commitea. |
| P3-4 el «sí» a la propuesta | Resuelto en SKILL.md punto 6: la propuesta va en el mismo mensaje que los paneles y sus respuestas valen como sí si la persona no la corrige; si no, se pide aparte. Nada se escribe antes. |
| P3-5 «elementos pelados» | Resuelto: el componente de la app que hace eso; si no hay, un elemento simple con los estilos y tokens de la app, nunca el del esqueleto sin estilo. |
| P3-6 qué archivos van en `--file` | Resuelto: una sola lista, igual en SKILL.md y en la referencia (interfaz, disparador si es otro, y el que la monta; nunca las pruebas). |
| P3-7 cambiar el acuerdo más tarde | Resuelto: `capabilities` sigue a la primera respuesta (a 2 o 3, las tres en `false`; a 1, se vuelve a preguntar). |
| P3-8 huecos de conformidad y servidor falso | Resuelto con tres frases: jest necesita vitest sólo para esto (con el sí), un panel oculto sólo por clase parece abierto, y un CSP con `connect-src` bloquea el servidor falso (sólo en desarrollo). |
| P3-9 procedimiento para las apps del dueño | Resuelto: el paso 4 dice qué contestar cuando la skill frena por el `.tgz` local y el paso 6 revisa también `package-lock.json`. |

Además, de la ronda 3: la línea literal de «gasto cero» en la tercera pregunta con «Save», «el segundo panel queda con una pregunta» y `vitest.config.mts`. Sin resolver (menores, de redacción, anotados en el informe de la prueba): la numeración «punto N» / «step N», un ejemplo concreto de versión de vitest en un conflicto de pares y que el resumen de tres líneas es corto.

Preguntas al dueño: ninguna.
