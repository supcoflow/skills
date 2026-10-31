# Test the installation

Three levels, from less to more. You go up a level only if the person asks or accepts; none is mandatory to consider
the chat installed.

| Level | What it tests | Spends |
|---|---|---|
| 1 | That Supcoflow sees everything ready (`supcoflow diagnose --json`) | No |
| 2 | That the chat really works in a browser, on the running app | The chat's AI (little; not measured here) |
| 3 | That a problem gets all the way to an issue in the repo (`supcoflow test`) | Yes: one investigation, up to a ceiling |

## Level 1: the diagnosis

`supcoflow diagnose --json`: free and writes nothing. It exits 0 if everything is ready and 4 if something has to be
fixed. The terminal prints "Checked sign-in, repo, GitHub App, allowed sites, chat, guide and interface: N of 7, at no cost."
and, apart, whether it is ready for a test (`listo`). The seventh point, the interface, is advice: it is marked `aviso` and lowers the count without stopping a test. It also checks `maquina`: whether this machine can save the test request (nothing is written to find out). Each point on the list it brings is something to fix or know: **do not
keep a list of points in your head**, read the ones that come (there may be new points) and tell the person each one
in your own words. If it is something the skill already knows how to solve (a site not added, the chat off), propose it
and, with their yes, solve it; the rest you tell them and do not touch.

## Level 2: the chat in a browser

First, **warn the person**: testing the chat is talking to the chat's AI, and that has a small cost that Supcoflow pays
with its own key and does not go through the person's cap; it creates no issue and spends no investigation. With their
yes, go on.

You need the app running (the person starts it, or you ask for the command) and a browser you can drive (Playwright, a
browser from your environment). If you have none, say so and skip the level: do not simulate it.

The site you open the app from has to be in the allowed sites (`supcoflow sites add --site http://localhost:3000` for a
local test, with the person's agreement). Then, looking at what really happens on the page, check and report each one
separately:

1. **It mounts**: the chat shows up where you put it (the widget's bubble, or the trigger of the own interface). Do not assume selectors: find it on the page that runs.
2. **It passes the protections**: open the chat and send a greeting; it has to answer. If it does not answer, look at
   the browser console and the network: a CSP policy that blocks the connection (`connect-src`), or a site Supcoflow
   does not admit (the origin you opened is not in the allowed sites) are the two causes we already know. If you do not
   know which it is, say so; do not guess.
3. **It takes the user**: with a session started in the app, the chat has to know who they are in the fields the person
   authorized (`usuario` of point 5 of the skill) and nothing of the ones they refused. If the app has no session you
   can start, say you could not test this.
4. **It survives navigating**: go to another screen of the app without reloading by hand; the chat is still there and
   the conversation is kept.
5. **It uploads a screenshot**: only if the person allowed screenshots (and, with an own interface, only if it offers them: it shows only the tools it offers); attach one from the chat itself. Count whether
   it uploaded or what error it gave. If they did not allow them, attach none to test. The chat's screenshot button can
   still show up, and that is not a failure of this stage: the agreement acts when the report is SAVED and on the AI
   that investigates, not on what the chat's AI sees while it talks. Do not report it as a privacy failure and do not
   change the widget to hide it.

What to tell the person: one line per point (worked, did not work, could not test it), with the cause if you know it.
**Never say "it worked" about what you did not see work.** If something fails because of the app's code, show the fix
and ask before touching files (point 7 of the skill). Do not send real reports through the chat to test: a problem
written in the chat can start an investigation that spends.

## Level 3: a problem that gets to an issue (spends)

This test **spends real money**: one investigation, up to the ceiling that Supcoflow says. It is the only thing in the
skill that spends and you **never add `--authorize-spend` on your own**.

1. `supcoflow diagnose --json`. If it exits 4, or it is not ready for a test, or a point that is not an `aviso` one fails, fix it or tell them
   first; do not ask for money for a test that cannot get there. A failing `aviso` point (the interface one) lowers the count but does not stop the test: tell them what it says.
2. `supcoflow test --json` (without authorization: it sends nothing). It always exits 4 with `falta_autorizacion` and
   brings the ceiling, the month's balance, the cap, what is committed, the `politica` and `prueba_abierta`. If
   `prueba_abierta` brings an id, there is already a test without an outcome: do not ask for money; follow it with
   point 5 and `--test-id <id>`.
   It also brings, checked before any yes and without writing anything: `maquina` { ok, impedimentos } and
   `intento_pendiente` { techo_usd, politica } or `null`.
   - If `maquina.ok` is `false`, do not ask for money: tell them each `detalle` first, in your words, and offer only "Not
     now". `maquina.ok: true` means no obstacle was found, not a promise that saving will work: the terminal checks
     again right before sending.
   - If `intento_pendiente` is not `null`, there is a request waiting for confirmation from before. `maquina.ok: false`
     goes first: while it is `false`, do not offer to resume it. Otherwise, when its ceiling or its policy differ from the
     ones of this `test --json`, or it has `politica: null`, do not ask for a new test: a new test cannot start while a
     request is pending. Follow **Resuming a pending request** below instead. If the person does not want to resume it,
     offer only "Not now". With the same ceiling and policy as now, the yes of point 3 covers it and point 4 resumes it.
3. **Ask the person**, quoting the numbers as `test` gave them: "This test spends one investigation, up to US$
   <ceiling>. You have US$ <balance> left this month. If the problem gets in, a test issue, marked as such, opens in
   your repo and stays open (I don't close it). Shall I run it?". If the `politica` of that same `test --json` is
   `guardar`, tell them the test goes only as far as saving the problem and spends nothing. An answer that is not a
   clear yes is a no.
4. Only with the yes, in a call of its own:
   `supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy> --json`, where `<ceiling>` is
   exactly the number you showed and `<policy>` is `investigate` or `save` as you offered it (`relevar` is
   `investigate`, `guardar` is `save`). Never a number or a policy you re-read. It exits 5 with the `prueba_id`: go
   straight to point 5 (`--wait`), without asking anything else. To use your own text, `--message "…"`; without it a
   fixed one from Supcoflow goes. If it does not exit 5, look at the `error` field, not only the code:
   - `intento_pendiente` (exits 1 or 4, and `--wait` gives it too): there is an unconfirmed request saved. If the yes
     you just got was to the numbers of that same pending request (its ceiling and policy, the ones this error or the
     `intento_pendiente` of `test --json` shows), repeat
     `supcoflow test --authorize-spend --ceiling <its ceiling> --expect-policy <its policy> --json` **without
     `--message`** (it resumes the same test, it does not ask for another; it is the same yes, to the numbers of that same
     pending request) and then `--wait`. If it has other numbers or `politica: null`, the yes you have does not cover it: go to **Resuming a
     pending request** and ask again; do not repeat the command with the numbers you offered (it gives the same error).
   - `prueba_en_curso` (4): there is already one open; follow it with `supcoflow test --wait --test-id <id>` (the id comes
     in the answer).
   - `tope_mensual` (6): do not retry; tell them the cap and what is committed. Raising it is not yours to do.
   - `techo_distinto` or `politica_distinta` (4): the ceiling or the policy changed; go back to point 2 and ask again
     with the new numbers (the new values come in the `--json`). The old yes does not carry over.
   - `chat_deshabilitado` or `requiere_api_key` (4): tell them the message; do not retry.
   - exit 3 (invalid input): you sent something wrong; fix it with the message. Exit 2: no session (`login --start`
     and `login --wait`). `idempotency_key_reusada` (1): it should not happen; tell them and, if the person wants,
     start again from point 2 (another test asks for another yes).
   - Any other exit 1: tell them with the message; do not retry more than once.
5. `supcoflow test --wait --json` (or with `--test-id <id>`): it waits up to 90 s per call.
   - 5: still running; in the same turn, run the same command again. Ask the person nothing, but say one line per round: how many minutes it has been running (each round waits up to 90 s).
   - 0: it reached the outcome. With an issue, pass them the link. With the `guardar` policy it is the saved case, not
     an issue: tell them so.
   - 4 (with another `error`, not `intento_pendiente`): the person has to look at the test in the console; pass them
     the link to the inbox and the reason it brings. **An `arranque_incierto` is not relaunched from the terminal**
     (not even with another `test`): it is relaunched only from the console inbox; tell them.
6. **The charge, as it comes**: `leido` with the amount; `pendiente` or `perdido` are said as such ("the real spend
   is not known yet; at most, the ceiling"). Never count it as 0. If it stayed `pendiente`, the test finished anyway:
   later, `supcoflow test --wait --test-id <id> --json` looks at it again.

What you tell them at the end: if there was an issue or a saved case, the link, and the charge as it came. The test
issue stays open in the repo: closing it is the person's. The result says the installation reaches the issue; it does
not say the issue is correct.

### Resuming a pending request

Instead of points 3 and 4, when point 2 sent you here. It recovers a request that was saved on this machine and never
got an answer: it is not a new test, and it has its own yes.

1. Say: "There's a test request from before, waiting for confirmation: up to US$ <its ceiling>, policy
   <investigate|save>. Shall I recover that same one? No new test is started." (`relevar` is `investigate`, `guardar` is
   `save`.) Show only its ceiling and its policy, never its message or its key. A yes to point 3 (a new test, with any
   numbers) is not a yes to this: ask this one. An answer that is not a clear yes is a no.
2. With the yes, in a call of its own, run the recovery command:
   `supcoflow test --authorize-spend --ceiling <its ceiling> --expect-policy <its policy> --json`, with its own ceiling
   and policy, not the ones of this `test --json` and not the ones you offered, and without `--message`. The `message` of
   this `test --json` gives the same command after "to recover that same request, repeat". Only with exit 5 and a
   `prueba_id`, go to point 5; otherwise handle the result as in point 4: `techo_distinto` or `politica_distinta`: go
   back to point 2 and ask again with the new numbers, before any new test.
3. A pending request with `politica: null` (saved by the old 0.7.0 terminal) has no policy to put in that command: its
   policy was never fixed, so recovering it may spend up to its ceiling, whatever the current policy says. Say it: "This
   old request has no fixed policy: recovering it may spend up to US$ <its ceiling>, even if the project is on save
   now." Never tell them it is free, even if the current policy is `guardar`. Ask for a yes to exactly that. A yes to a
   test that spends nothing is not that yes: if they only authorize a test that spends nothing, stop: do not recover it.
   With the yes, run exactly the command that the `message` of this `test --json` gives after "to recover that same
   request, repeat" (it carries no `--expect-policy`), adding `--json` and nothing else. Do not add a policy to it: that
   would be another request. Only with exit 5 and a `prueba_id`, go to point 5; otherwise handle the result as in
   point 4.
