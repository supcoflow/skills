# The AI accounts

Two agents work for the app, and each one runs on an AI account that the person owns, with a key made at their AI
provider: the **chat** (`chat`) and the **triage agent** (`triaje` in the JSON, `triage` in commands). The key of an
account is write-only: it is set once, it is never shown again, and it can only be replaced or removed. **It never
passes through you.** Never ask for the key in the chat, never accept one that is pasted there, never put a key in a
command, a file or an environment variable, and never run `supcoflow agents set-key` or `supcoflow agents remove`
yourself: the person does it, in the Agents tab or in their own terminal. This is not a fourth question of point 5 of
SKILL.md, and nothing here changes the three that are asked.

## 1. Read them (step 4 of the order)

`supcoflow agents show --json` right after `config`. It only reads and exits 0 even when an account is missing: that is
not an error. In `agentes[]` each item has an `agente` (`chat` or `triaje`) and an `estado`:

| `estado` | What it means |
|---|---|
| `lista` | The account is there and the provider accepts the key |
| `rechazada` | The provider rejects the key |
| `sin_saldo` | The account is out of balance, or the key reached its own cap |
| `falta` | There is no account yet |

`cuenta_lista` says only that the ACCOUNT is ready, not that the agent's configuration is approved: never say "the chat
is configured" or "approved" because of it. Any other `estado` is one you do not know: say so and point to the project's
Agents tab. Say the state of each agent in one line, in your words, never the JSON. Any exit other than 0 follows the table of
point 2 of SKILL.md.

## 2. Setting or fixing a key is the person's

Tell them, in their language, who does what:

- `falta`: "The <chat | triage agent> has no AI account yet. Add it in the project's Agents tab, or open your own terminal in
  the app's folder and type `supcoflow agents set-key --agent chat` (or `--agent triage`): it asks for the key without
  showing it. Only a team Owner can." (do not tell them to run it through this chat, and do not depend on a shell escape
  inside your own tool: it may have no interactive terminal, and then the command exits 4 `sin_terminal` and asks for
  nothing).
- `rechazada` or `sin_saldo`: fix it at the AI provider (a new key, balance, the key's own cap), or replace the key the
  same way as above. Then, when they tell you it is done, look again with `supcoflow agents check --agent chat --json` (or
  `--agent triage`): it asks the provider again, costs nothing and needs no key from you. Exit 0: it is ready. It exits 4
  `cuenta_rechazada` or `cuenta_sin_saldo`: it is still not ready; say what its message says and do not loop. It exits 4
  `sin_cuenta`: there is no account, so it is `falta`. It exits 1 `proveedor_no_responde`: the provider did not answer,
  which says nothing about the key; do not retry more than once.
- After they put a missing one, run `supcoflow agents show --json` again.
- If they paste a key into the chat anyway: do not use it and do not repeat it; tell them to treat it as exposed (delete
  it at the provider and create a new one) and to put the new one the way above.

## 3. Does the engine require it?

`agents show` says whether an account is there, not whether the engine insists on it. Today the engine may not require
accounts yet: while it does not, `chat on` and the test work without the account, and stopping the installation for it
would break something that works. The terminal tells you: `supcoflow diagnose --json` lists `ia_del_chat` (in
`instalacion.puntos`) and `ia_del_triaje` (in `prueba.puntos`) only when the engine requires the accounts. So, when an
account is not `lista`, run `supcoflow diagnose --json` once, there and then (it is free and writes nothing; its exit 4
`no_listo` here is the report, not a stop: read the points). Run it only when an account is not `lista`. For each agent
whose account is not `lista`:

- Not required: its point is not in the list, and the terminal lets you go on: warn and go on. Say it as it is: "The
  triage agent has no AI account yet. The engine does not ask for it today, so I go on." `chat on` and the test work
  without the account; do not say it will be required later, you do not know it.
- Required and the chat's account is not `lista`: do not propose turning the chat on, do not run `supcoflow chat on`,
  and do not touch the app (without the account the chat cannot answer and disappears from the site). Everything that does not depend on the account
  (the questions, the guide, the allowed site) can be done. At step 8 read `supcoflow agents show --agent chat --json`
  again: if it is `lista` by then, go on; if not, stop there with "Not finished". If `chat on` exits 4 with
  `falta_ia_del_chat`, it is this same case. The next `/supcoflow go` resumes from what is missing.
- Required and the triage agent's account is not `lista`: do not offer the test. Say it BEFORE the three questions and
  offer only "Not now" in the third. If a test is attempted anyway and exits 4 `falta_ia_del_triaje`, tell them and do not
  retry; the presence of the point decides, not its `ok`: with the `save` policy it can come as `ok` (the test would not
  investigate) even though the account is not ready, and you still do not offer the test then.

## 4. The chat's model (only if the person asks)

Only if the person asks to choose the chat's model. Never offer it on your own, and it is not one of the three
questions. `supcoflow agents configure --agent chat --option <agile|standard|plus> --data-retention <allow|deny> --json`.
Ask what you need: which option, and whether the provider may keep their data (`allow`: any provider; `deny`: only
providers that do not keep data); both flags are required: the terminal cannot read what is set, so it guesses nothing.
With the person's answers, for example `--option standard --data-retention allow`. It exits 0 with the saved version, or
with `sin_cambios` when it was already like that. Exit 3 `opcion_sin_medicion`: that option has not passed the measurement
yet, ask for another. Exit 3 `sin_guardado_de_datos_no_disponible`: that option cannot promise that the provider keeps no
data, so `allow` or another option. Exit 4 `requiere_dueno`: only a team Owner can; say so. The message caps of the chat
(per project and per user) are changed only in the Agents tab, and the triage agent's model is approved only in the
Agents tab (`--agent triage` exits 4 `no_desde_la_terminal`): tell the person to do it there, never from here. A ready
account is not a chosen model.

## 5. In the diagnosis (step 10 of the order)

Read `instalacion.ok` and `instalacion.total` from `supcoflow diagnose --json`: seven, or eight when `ia_del_chat` is
there; never write a fixed number. A failing `ia_del_chat` or `ia_del_triaje` is something for the person to fix, as in
point 2 above (run `supcoflow agents show --json` to say which state that account is in): do not try to fix it yourself,
and with a failing `ia_del_triaje` no test is offered ([`prueba.md`](prueba.md), level 3).
