# Respuesta a la revisión 2 de la skill 0.5.0 (cuenta de IA del cliente)

Informe tal cual: `2026-11-02-skill-0-5-cuenta-ia-revision-2.md` (integrar; 0 P1, 0 P2, 3 P3 de texto). Es la última vuelta. Sólo se arreglaron esos tres P3, sin otros cambios; la versión sigue siendo la 0.5.0 (sin publicar) y la huella se rehízo con `--sin-subir-version`.

| Hallazgo | Qué se hizo |
|---|---|
| P3-A frases de `prueba.md` que hablan sólo de «la cuenta» del triage agent | Resuelto. El nivel 3 punto 1 dice «the agent is not ready» y remite a la sección 3 de `cuentas-de-ia.md`; `falta_ia_del_triaje` (4) dice «the triage agent isn't ready (its account, or its model not approved)… say its message and follow section 3»; el nivel 1 dice que un punto de cuenta que falla se maneja como dice la sección 3. |
| P3-B dos frases de SKILL.md «lo arregla la persona» frente a las excepciones de la referencia | Resuelto. La fila «Does the chat work?» del mapa y el paso 10 dicen «handle it as section 3 of `referencias/cuentas-de-ia.md` says». |
| P3-C con la política `guardar` se calla que falta el modelo del triage agent | Resuelto. En la sección 3: con `politica` en `guardar` el `ok` de `ia_del_triaje` no dice si el agente está listo; se dice su `mensaje` en una línea si nombra algo que falta. |

Tests nuevos para cada uno (284 en verde). Preguntas al dueño: ninguna.
