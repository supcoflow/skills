# The AI accounts

Two agents work for the app, and each one runs on an AI account that the person owns, with a key made at their AI
provider: the **chat** (`chat`) and the **triage agent** (`triaje` in the JSON, `triage` in commands). The key of an
account is write-only: it is set once, it is never shown again, and it can only be replaced or removed. **It never
passes through you.** Never ask for the key in the chat, never accept one that is pasted there, never put a key in a
command, a file or an environment variable, and never run `supcoflow agents set-key` or `supcoflow agents remove`
yourself: the person does it, in the Agents tab or in their own terminal. This is not a fourth question of point 5 of
SKILL.md, and nothing here changes the three that are asked.

An agent is **ready** only with its account in `lista` AND its configuration (the model) approved, and the engine only
asks for that once it requires the accounts. Read section 3 first (is it required, and is it ready?); sections 2 and 4
say who does what.

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
is configured", "approved" or "ready" because of it. Any other `estado` is one you do not know: say so and point to the
project's Agents tab. Say the state of each agent in one line, in your words, never the JSON. If `agents show` exits 4 or
another code, say it in one line and go on as if you did not know whether the engine requires the accounts (section 3):
a step that only reads stops nobody, and `chat on` and the test say it themselves with `falta_ia_del_*`.

## 2. Setting or fixing a key is the person's

Tell them, in their language, who does what. Only when section 3 says the engine requires the account, or when the person
asks how: if the engine does not require it, say only the one line of section 3 and give the steps below if they ask.

- `falta`: "The <chat | triage agent> has no AI account yet. Add it in the project's Agents tab, or open your own terminal in
  the app's folder and type `supcoflow agents set-key --agent chat` (or `--agent triage`): it asks for the key without
  showing it. Only a team Owner can." Give the command in the same form you are using (plain `supcoflow`, or
  `npx -y supcoflow@0.10.1` if you are running it pinned), because their terminal may have an older one without `agents`
  (do not tell them to run it through this chat, and do not depend on a shell escape inside your own tool: it may have no
  interactive terminal, and then the command exits 4 `sin_terminal` and asks for nothing).
- `rechazada` or `sin_saldo`: fix it at the AI provider (a new key, balance, the key's own cap), or replace the key the
  same way as above. Then, when they tell you it is done, look again with `supcoflow agents check --agent chat --json` (or
  `--agent triage`): it asks the provider again, costs nothing and needs no key from you. Exit 0: it is ready. It exits 4
  `cuenta_rechazada` or `cuenta_sin_saldo`: it is still not ready; say what its message says and do not loop. It exits 4
  `sin_cuenta`: there is no account, so it is `falta`. Any other 4 (for example `cuenta_no_lista`): say its message. It
  exits 1 `proveedor_no_responde`: the provider did not answer, which says nothing about the key; do not retry more than
  once.
- After they put a missing one, run `supcoflow agents show --json` again.
- If they paste a key into the chat anyway: do not use it and do not repeat it; tell them to treat it as exposed (delete
  it at the provider and create a new one) and to put the new one the way above.

## 3. Is it required, and is it ready?

`agents show` says whether an account is there, not whether the engine insists on it, and not whether the agent is ready.
Today the engine may not require accounts yet: while it does not, `chat on` and the test work without the account, and
stopping the installation for it would break something that works. The terminal tells you: `supcoflow diagnose --json`
lists `ia_del_chat` (in `instalacion.puntos`) and `ia_del_triaje` (in `prueba.puntos`) only when the engine requires the
accounts. Run it once at step 4, whatever `agents show` said, and use it only for those two points: do not tell the person
the rest of the diagnosis now, and do not fix the rest yet (it is free and writes nothing; its exit 4 `no_listo` here is
the report, not a stop). If it exits with anything else, say it in one line and go on as if you did not know whether the
engine requires the accounts. Then, for each agent:

- Its point is not in the list: not required. The terminal lets you go on: warn and go on, only if its account is not
  `lista`. Say it as it is: "The triage agent has no AI account yet. The engine does not ask for it today, so I go on."
  `chat on` and the test work without the account; do not say it will be required later, you do not know it, and do not
  explain how to put it unless they ask.
- Its point is there and is `ok`, and its account is `lista`: required and ready. Nothing to say, except for the triage agent
  when `politica` in `diagnose` is `guardar`: there `ok` does not say whether the agent is ready, so say its `mensaje` in
  one line if it names something missing (for example its model not approved).
- Its point is there and fails, or its account is not `lista`: required and not ready. Say why in one line, from the
  account (section 1) and from the `mensaje` of the point, which is the engine's own reason. Do not say "the account is
  missing" if the account is `lista`.
  - The account is `falta`, `rechazada` or `sin_saldo`: section 2.
  - The account is `lista` and the point says its model is not approved: the model is approved in the project's Agents
    tab. For the chat, if the person asks you to do it, section 4 (`agents configure`). For the triage agent only in the
    Agents tab (the owner decided it). Say it once; do not loop on it.
  - The point says the engine could not check the account (for example "We couldn't check"): that is not the person's to
    fix. Say the message and that it can be tried again in a while.

What each one stops, when it is required and not ready:

- The chat: do not propose turning the chat on, do not run `supcoflow chat on`, and do not touch the app (without it the
  chat cannot answer and disappears from the site). Everything that does not depend on it (the questions, the guide, the
  allowed site) can be done. At step 8 run `supcoflow diagnose --json` again and look only at `ia_del_chat`: if it is `ok`
  by then, go on; if not, stop there with "Not finished: the chat's AI isn't ready (<the account | its model>)." If
  `chat on` exits 4 with `falta_ia_del_chat`, it is this same case, whatever `agents show` said. The next `/supcoflow go`
  resumes from what is missing, and now says the right thing.
- The triage agent: do not offer the test. Say it BEFORE the three questions and offer only "Not now" in the third. If a
  test is attempted anyway and exits 4 `falta_ia_del_triaje`, tell them and do not retry. The presence of the point decides
  whether it is required; its `ok` decides whether it is ready, except that with the `save` policy it can come as `ok`
  (the test would not investigate) even though the agent is not ready: you still do not offer the test when its account is
  not `lista`, and step 10 reads the point again once the policy is set.

## 4. The chat's model (only if the person asks)

Only if the person asks to choose the chat's model, or asks you to approve it when section 3 says it is the missing
piece. Never offer it on your own, and it is not one of the three questions.
`supcoflow agents configure --agent chat --option <agile|standard|plus> --data-retention <allow|deny> --json`.
Ask what you need: which option, and whether the provider may keep their data (`allow`: any provider; `deny`: only
providers that do not keep data); both flags are required: the terminal cannot read what is set, so it guesses nothing.
With the person's answers, for example `--option standard --data-retention allow`. It saves and approves it in one step.
It exits 0 with the saved version, or with `sin_cambios` when it was already like that. Exit 3 `opcion_sin_medicion`: that
option has not passed the measurement yet, ask for another. Exit 3 `sin_guardado_de_datos_no_disponible`: that option
cannot promise that the provider keeps no data, so `allow` or another option. Exit 4 `requiere_dueno`: only a team Owner
can; say so. The message caps of the chat (per project and per user) are changed only in the Agents tab, and the triage
agent's model is approved only in the Agents tab (`--agent triage` exits 4 `no_desde_la_terminal`): tell the person to do
it there, never from here. A ready account is not a chosen model.

## 5. In the diagnosis (step 10 of the order)

Read `instalacion.ok` and `instalacion.total` from `supcoflow diagnose --json`: seven, or eight when `ia_del_chat` is
there; never write a fixed number. A failing `ia_del_chat` or `ia_del_triaje` is said with its `mensaje` and handled as in
section 3 (run `supcoflow agents show --json` to say which state the account is in): do not try to fix it yourself, and
with a failing `ia_del_triaje` no test is offered ([`prueba.md`](prueba.md), level 3).
