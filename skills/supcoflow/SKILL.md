---
name: supcoflow
description: Installs and configures the Supcoflow support chat in an app with the `supcoflow` terminal, built with the app's own components, icons and styles (Next.js tested) or as the packaged widget. Use when the person asks for "/supcoflow go", to add a support or help chat to their app, says their users get stuck, asks why the support chat isn't showing, says "chat de soporte", or wants to change the chat, its guide or its data. Do not use for other chat vendors.
metadata:
  version: "0.4.0"
---

# Supcoflow go

Talk to the person in the language they use.

## 1. What it is for

Leave the Supcoflow chat working in this app: it shows up where users get stuck, it knows what the app is about (the
guide) and what they report ends up where the person chose. In a Next.js app the chat is built with the app's own
components, icons and styles (point 10): Supcoflow brings the engine, the rules and the tests, never a design.

## 2. How to talk to Supcoflow

- Always through the terminal and with `--json`. First `supcoflow describe --json`: if it says `"version":"0.9.0"`,
  use plain `supcoflow` in everything that follows. Only if it is not installed, fails, or is another version (an old
  0.7.0 has no `describe`), run every command pinned: `npx -y supcoflow@0.9.0 describe --json`. Never `@latest` and
  never another version.
- One terminal command per call, as is: no `;`, `&&` or pipes, and no added `echo $?`. You read the exit code from the
  command's own result (if your tool shows no code for a success, a result without an error is 0; never add `echo $?`).
- Never invent a command or a flag: read them from `describe --json` at the start. Below, `supcoflow` means the pinned
  terminal.
- In the full order, start each step with one line: "Step N of 9: <what it is>" (for example "Step 3 of 9: your
  settings"), so the person sees where you are.
- Run the terminal from the app's folder: it reads the repo from that folder's `origin` (`--repo owner/repo` if you cannot).
- Never paste the terminal's JSON to the person: say what it means in one sentence.
- Read the app's files with your file-reading and search tools, not with shell pipelines (`grep`, `sed`, `cat`).

| Code | What you do |
|---|---|
| 0 | go on |
| 1 | something failed: tell the person the message and do not retry more than once |
| 2 | no session: `login --start` and `login --wait` |
| 3 | you sent something wrong: fix it yourself with the message |
| 4 | a person is needed: tell them what has to be decided or done and wait for the answer |
| 5 | waiting for a person: tell them what to do and run the same command again when they let you know |
| 6 | cap reached: do not retry; tell them the cap |

The 5 of a `--start` (`login`, `repo connect`) is the normal one: show the person the link and the code (the only
thing they have to do) and, in the same turn, without waiting for them to answer, run the `--wait`; it waits for the
approval by itself for up to 90 s. The 5 in the table is the one from a `--wait` that expired without approval.

## 3. The order

**Start from what the person asked.** Every row begins with `supcoflow project show --json` (with exit 2, the login of
point 2 first), then `supcoflow config --json`. The `contexto` of `project show` says who the person is, in which team,
which repo and which project: say it in words, also when everything fits ("You're @<login> in team <team>; this repo
<owner/repo>; its project <id> (existing)", or "…; no project yet", or that they are signed in with email or with a
read-only key). If `project show` exits 4 with `error: "contexto_incoherente"`, this clone and the account do not fit
(the `motivo` says how): stop, say its message as is, and create, connect and publish nothing; do not retry or work
around it, and never delete or edit `.supcoflow/proyecto.json` on your own. If `project show` brings `proyecto: null` or
`config` exits 4 with `error: "sin_proyecto"`, this repo has no project yet. When the person asked to install, go on to
step 2 of the order (connect the repo, create the project) and read `config` again. For any other row, tell them the
installation is missing and offer the full order; create nothing for a diagnosis or a partial request. Any other exit 4
is a decision for a person: stop, as the table of point 2 says.

If the first command that needs the repo exits 3 with `error: "sin_repo"` because the "origin" is an SSH alias (the
message says so and gives `git remote add supcoflow https://github.com/<owner>/<repo>.git`, or the same with
`set-url`), show the person that exact command, say it only touches this clone's git settings and is never fetched, and
run it only with their yes (a permission like the commit's, not a fourth question). Then go on without `--repo`. The
`falta_guia` or `sin_clon` of an alias gives the same command. If the message gives no command, tell the person what it
says and stop. Then:

| The person asked | You do |
|---|---|
| Does the chat work? Why isn't it showing? | `supcoflow diagnose --json` and read its points (step 9). Fix only what it names. No test, nothing is spent. |
| Update the guide | Points 8 and 9 (step 6 below). Do not ask about data, policy or the test. The questions and permissions of points 7 and 9 stay (overwriting, the business rules, the commit). |
| Change what the chat sees about their users | Only the first question of point 5, with its scope warning, and all of its table, including what changes in the app's code. Do not ask the second or the third question. The permissions of point 7 before touching files stay. |
| Test it | [`referencias/prueba.md`](referencias/prueba.md). Level 3 spends: only with its own yes. |
| Install it, or `/supcoflow go` | The full order below, steps 1 to 9. |

The full order:

1. `supcoflow whoami --json` (with 2: `supcoflow login --start --json`, show the link and the code and right away
   `supcoflow login --wait --json`, until it exits 0).
2. `supcoflow project show --json`; if there is no project: `supcoflow repo connect --start --json`. When it asks for
   the GitHub App, say: "The Supcoflow GitHub App isn't on <owner/repo> yet. Approve it in the browser." (the
   `owner/repo` is the one from `git remote get-url origin`). Then `supcoflow repo connect --wait --json` →
   `supcoflow project create --json`, and say: "Connected. Created the project <slug>." If `project show` (before
   `repo connect`) or `project create` exits 4 with `contexto_incoherente` (the repo's owner is not the GitHub account
   of your key, or the account has no GitHub), stop and say its message: it is a possible mismatch, not proof.
3. `supcoflow config --json`: what is already set is not asked again. Only what is set counts: `acuerdo: null` or
   `politica.fijada_en: null` means not set (even if it says `modo: "relevar"`) → ask it, with the warning that
   investigating spends.
4. `supcoflow test --json` (without authorizing: it sends nothing and exits 4 with `falta_autorizacion`) to have the
   ceiling, balance and cap in numbers (`techo_usd`, `saldo_usd`, `tope_usd`) before the third question. Read two more
   things from it before asking anything (details in [`referencias/prueba.md`](referencias/prueba.md), point 2):
   `maquina` and `intento_pendiente`. If `maquina.ok` is `false`, say why (each `detalle` of `impedimentos`, in your
   words) BEFORE the three questions, and in the third offer only "Not now"; do not offer to resume a pending request
   then. If `intento_pendiente` is not `null` and its ceiling or policy differ from the ones of this `test --json`, say so and
   offer to resume that same request, not a new test, in place of option 1 of the third question and with its own yes
   (see "Resuming a pending request" in [`referencias/prueba.md`](referencias/prueba.md)).
5. Read the code (with your file tools, as point 2 says) → say what you will do: "From your code: <what you read>, on N pages." (N: count the `page.tsx`
   files under the layout where you will mount the chat; the chat covers what that layout covers, so never make up a
   list of pages). If the app is Next.js (App Router), also run `supcoflow widget --json` here (it only reads) to decide
   the form (point 10: own interface or widget) before the questions. → the three questions (point 5), and with an own
   interface its second panel → apply the configuration (`supcoflow data set`, `supcoflow policy set`).
6. `git status --porcelain --ignored -- .supcoflow/guide.md` (point 7, before writing) → write `.supcoflow/guide.md`
   in one call → `supcoflow guide check --json` in another → show the diff and ask for the yes to the local commit
   (point 9) → `supcoflow guide publish --json`.
7. `supcoflow sites add --site <origin of the app> --json` (the site where its users use it, e.g. its public domain;
   `http://localhost:3000` only for a local test; if the code does not say, ask; if its `sitios` does not list the site, say so and do not go on as if it were added) → `supcoflow chat on --json` →
   `supcoflow widget --json` → put the chat, in the form decided in step 5 (point 10). The app is touched only here, with the guide already
   published and the site added.
8. `supcoflow install record --skill <metadata.version of this skill> --file <the file the chat is mounted from> --json`
   (the number is the `metadata.version` in the YAML header of this SKILL.md: if you do not have it in view, open the
   file; never written separately; `--app <folder>` if the app is not at the root) → point 10 explains which file. For an own
   interface add `--shape own-interface` and one `--file` for each file of the interface (point 10).
9. `supcoflow diagnose --json`. Say the line the terminal prints (with `--json`, build it from `instalacion.ok` and `instalacion.total`): "Checked sign-in, repo, GitHub App, allowed sites,
   chat, guide and interface: N of 7, at no cost." If it says it is not ready for a test, or a point that is not an `aviso` one fails,
   say so and nothing is spent. A failing `aviso` point (the interface one) lowers the count but does not stop a test: say
   what it says. If it is ready, and the person said yes to the third question: `supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy> --json`
   in a call of its own, then `supcoflow test --wait --json` (details in
   [`referencias/prueba.md`](referencias/prueba.md), level 3). If instead they said yes to resuming a pending request, do
   not use these values: follow "Resuming a pending request" in the same file. Then the summary (point 13).

Testing beyond that (optional, never without asking): offer the person the levels of
[`referencias/prueba.md`](referencias/prueba.md). Level 1 (`supcoflow diagnose --json`) is free; level 2 uses a
browser and talks to the chat's AI; level 3 **spends** and you ask the person first, with the ceiling and the balance
that `supcoflow test --json` gave.

Every step can be resumed: if the session is cut, `/supcoflow go` starts like every row (`project show`, the context line, then `config`) and goes on from what is missing.

## 4. What you decide

The technical and reversible: which screens the guide covers and, for the widget, where it shows up, its position,
title, greeting, colors (`supcoflow chat brand`) and language. It is said in the summary; it is not asked. With an own
interface (point 10) none of the widget's look settings exist: you never ask about colors, fonts or icons and never run
`supcoflow chat brand`; the chat takes the app's own look. What it does ask is how people open it (the second panel of
point 5).

## 5. What you ALWAYS ask the person

These three, in one panel with exactly these words, in the full order and for whatever is still unset (a request to change only the data uses the first one: see the map of point 3). Do not decide them yourself even if the code suggests it. Before
asking, say what is true today: the data agreement limits what is SAVED in Supcoflow and what the investigating AI
reads, not what the chat's AI sees while it talks; and with the widget, this chat always offers users screenshots and pointing at
elements (there is no switch for them in the code: if the agreement rejects them, they are discarded when saved); an own
interface offers only the tools of its second panel.

> **What can the chat see about your users?**
> 1. Who they are, the page, and screenshots
> 2. Only the page and browser
> 3. Only what they type
>
> **What happens when someone reports a problem?**
> 1. Look into it right away
> 2. Save it for me to review
>
> **Run one real test now?**
> 1. Yes, run one test — up to US$ <ceiling> of your team's US$ <cap> monthly cap (US$ <balance> left)
> 2. Not now

Fill the numbers from the `supcoflow test --json` of step 4 and print them as numbers, not as placeholders. Each answer
goes to its mechanism, all at once, with ONE `supcoflow data set --allow <list>` (or `nothing`):

| Answer to the first question | In Supcoflow | In the app's code |
|---|---|---|
| 1. Who they are, the page, and screenshots | `supcoflow data set --allow user_id,user_role,attribute:<name>,page_and_browser,screenshots,elements` (one `attribute:<name>` for each attribute you pass in `usuario`) | pass only those fields in `usuario` |
| 2. Only the page and browser | `supcoflow data set --allow page_and_browser` | pass no `usuario` |
| 3. Only what they type | `supcoflow data set --allow nothing` | pass no `usuario`; `contextoAutomatico={false}` and no `contexto.versionApp` |

Those are the widget's props. In an own interface the same answers are the `user` option of the chat (only `id`, `role`
and `attributes` the person accepted), `autoContext: false` where the table says `contextoAutomatico={false}`, and no
`appVersion`. When the first answer changes later, `capabilities` follows it: to 2 or 3, all three `false`; to 1, ask the tools question again.

`email` is allowed only if the person asks for it by name. Never `usuario.nombre`. If the app has no session, nothing is passed:
leave `user_id,user_role` out of the list of the first answer.

- **Second question**: `supcoflow policy set --mode investigate` for "Look into it right away" and
  `supcoflow policy set --mode save` for "Save it for me to review". Tell them that investigating **spends**, within the
  team's monthly cap, and that with "save" a person can ask for the investigation later.
- **Third question**: a yes to numbers, not to a phrase. With "Save it for me to review", option 1 of the third
  question says the test spends nothing (it stops at the saved problem): print the option as written and add under it "This test
  spends nothing: it stops at the saved problem." That yes authorizes ONE test with exactly the
  ceiling you showed and the policy you offered: the final command is `supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy>`
  with the number you printed and the policy you offered. Never a number you re-read. `techo_distinto` or
  `politica_distinta`: ask again with the new numbers.

**Own interface only: a second panel**, in the same message, after the three questions. Never colors, fonts or icons: the app
already answers those. Fill option 1 of the first with what you read in the code and print it as words, not as placeholders:

> **How should people open the chat?**
> 1. <your proposal: the trigger and what it opens, built with the app's own components — for example a "Help" button in the header that opens a side sheet>
> 2. A floating button in a corner that opens a panel
> 3. Somewhere else (tell me where)
>
> **Which tools should it offer to add evidence?**
> 1. Attach an image, take a screenshot and point at an element
> 2. Only attach an image
> 3. None

The second answer goes to the `capabilities` option of the chat and to nothing else: 1 is
`capabilities: { attachImage: true, screenshot: true, pickElement: true }`, 2 is
`capabilities: { attachImage: true, screenshot: false, pickElement: false }` and 3 is
`capabilities: { attachImage: false, screenshot: false, pickElement: false }`. `newConversation` stays on in all three
(a person can always start another conversation after a report). The interface also follows `state.allows`, so a tool the
data agreement rejects is not shown whatever they answer. So when the first answer was 2 or 3 (the agreement takes no
screenshots, images or pointed elements: an image counts as a screenshot), do not ask the tools question: say "Your data
agreement doesn't take screenshots, images or pointed elements, so the chat won't offer evidence tools." and declare all
three `false`; the second panel then has only its first question. How it opens is the person's decision, never yours.

The rules of their business (deadlines, refunds, prices, commitments) are not a fourth question: they are asked
together with the diff of the guide (point 9). **Never deduce them from the code**; if there are none, the guide does
not carry them.

## 6. Show before applying

Show the person the configuration proposal and the list of files you will create or change before `data set`,
`policy set` and before touching files. For an own interface the proposal also says which trigger and where, which of the
app's components and icons it reuses, which files it creates, which tools it offers and whether it adds test packages. With an
own interface the proposal goes in the same message as the panels of point 5, and their answers count as the yes only if the
person does not correct the proposal; otherwise ask for the yes apart. Nothing is written before it.

## 7. Do not overwrite

Before creating or writing a file (also `.supcoflow/guide.md`), never after: `git status --porcelain --ignored -- <file>`.
If it has uncommitted changes, is registered but deleted without a commit, is a symlink, or is not versioned
(it exists but git does not track it, also if git ignores it), do not touch it: show what you would do and ask, except for the files you created
or changed yourself in this session (the guide between rounds of `guide check`, a layout you already touched). Never
`--force`, never delete files of the app.

## 8. The guide

Format and example in [`referencias/guia.md`](referencias/guia.md). The file is `.supcoflow/guide.md`. If the repo
only has the old `.supcoflow/guia.md`, tell the person it is the old name and offer to write `guide.md`; never rename
or delete theirs. Read the code and, if they exist, `CLAUDE.md`/`README` to understand the screens; one section per
screen or function a user uses; "Common problems" only from something visible (an issue, a TODO, the README) or
dictated by the person. Only what exists in the code and a user really uses: no "Home" section because of a template
page, no links or buttons the code does not have. Add `Where:` with the route only if that route exists in the code.
`supcoflow guide check --json` until it exits 0.

## 9. Publish the guide

Never `git push`, neither to the main branch nor to another. Never change the branch or create one.

1. If `git status --porcelain --ignored -- .supcoflow/guide.md` says git ignores it (`!!`), it cannot be committed: tell
   them the declared commit will not contain it. Otherwise, and the output is not empty (new or changed), first read
   where the commit would land: `git branch --show-current` and the project's main branch, the `rama` of
   `supcoflow project show --json` (`proyecto.rama`). If you cannot read the branch, treat it as no branch. Then, in
   ONE message show them the diff of THAT file (new, `??`: the whole file; changed: `git diff -- .supcoflow/guide.md`),
   the exact commit message you will use, and the question about their business: "Anything about your business the
   chat must know — deadlines, refunds, prices? I won't guess them from the code." And ask about the commit, inside that
   same question (not a new question), according to where it would land:
   - On the project's main branch: the question names the branch. "I'll leave it in a local commit on `<branch>`; it
     stays in your repo, I don't push it to GitHub."
   - On another branch: say so and recommend not committing there: "You're on `<branch>`, not on the project's main
     branch (`<rama>`)." Two options: commit anyway on that branch, or do not commit now: the guide is published anyway,
     and it is committed on `<rama>` when they want.
   - No branch (detached HEAD, empty output): recommend not committing, and say nothing about a branch. If they still
     want it, tell them the commit would stay on no branch.

   The yes comes BEFORE the commit.
   If they answer with rules, add them to the guide, run `supcoflow guide check --json` again and show the diff again
   before the commit.
2. With a yes: `git add -- .supcoflow/guide.md` (if it is new, without this the commit fails) and then
   `git commit -m "<message>" -- .supcoflow/guide.md`, with EXACTLY the message you showed: adding nothing (no
   `Co-Authored-By` or other attribution); if your environment adds one, put it in the message you show. With the
   path, what the person has in the index stays there, uncommitted. Never `git add .` or `git commit -a`. Check with
   `git show --name-only HEAD` that the new commit touches only that file. With a no, or the option of not committing
   now: do not commit, and tell them the guide is published anyway but the commit that stays recorded is one that does
   not contain it yet. Here too, with a no, the notice of point 4 goes.
3. `supcoflow guide publish --json`, without `--from-github`. Repeating it with the same guide returns the same
   publication (`ya_publicada`): a cut session is resumed without duplicating. If it warns that `guia.md` is the old
   name, pass the warning on to the person.
4. ALWAYS, whether they said yes or no to the commit, in the same message where you tell them the guide was published,
   say in one line: "Pushing the guide to GitHub is up to you".

## 10. Put the chat

**Which form.** Run `supcoflow widget --json`. The chat is built with the app's own components (the own interface) when
ALL of these hold: the app is Next.js with the App Router, `interfaz_propia` is there and its `estado` is `disponible`,
and the person did not ask for the widget. Otherwise it is the widget. Say which form you chose and why in one line
("Building the chat with your own components." or, for the widget, why not: another stack, no `interfaz_propia`, its
`estado: sin_publicar` meaning the interface package is not published yet, or they asked for it).

### The widget

Tested path in [`referencias/nextjs.md`](referencias/nextjs.md).

- Install the package with the app's manager and the exact version from `supcoflow widget --json` (`instalar`,
  translated to the manager).
- **One chat, never two.** Choose the file in this order (the first that applies):
  1. The `archivo` recorded in `.supcoflow/instalacion.json`, if it exists and the file exists.
  2. The file the layout imports, read from the code, not guessed. If more than one is mounted, stop and ask: there
     are already two chats.
  3. One of `nextjs.archivos_anteriores` (with or without `src/`), today `app/_supcoflow/chat-de-soporte.tsx`.
  4. `nextjs.archivo_sugerido`, new, today `app/_supcoflow/support-chat.tsx`. If the app uses `src/app`, put `src/` in front of it.

  In 1–3 the file is updated in place, with the rules of point 7. In 4 the wrapper file goes in
  `nextjs.archivo_sugerido` with `nextjs.contenido` as is, WITHOUT rewriting the ids (relative to the app's folder —the one in
  `--app`, if it is not at the root—). If the app uses `src/app`, it goes inside `src/app`: never create an `app/` next to it,
  because Next would ignore `src/app` and every route would give 404. Use it (`nextjs.uso`) in the layout that covers
  the screens where users get stuck; pass it `usuario` and `contextoAutomatico` as in the table of point 5. At the end,
  `supcoflow install record --skill <version> --file <the file you really used>`.
- **CSP**: a second `connect-src` directive is ignored, and replacing the one that is there deletes destinations the
  app needs.
  - If it already has `connect-src`, add the chat's origin keeping everything it has.
  - If it has no `connect-src` but has `default-src`, create `connect-src` with the sources of `default-src` plus the
    chat.
  - If it has no CSP, do not add any.
  - The `csp` line of `widget --json` is the reference for a new CSP, not for pasting next to another.
- The `<script>` line is not for Next.js.

### An own interface

The package, the contract and the tests come from Supcoflow; every pixel is the app's. Read
[`referencias/interfaz-propia.md`](referencias/interfaz-propia.md) and follow it from step 1 (detect the app's design
system) to step 6 (record).

- Install the package with the app's manager and the exact version from the `instalar` of `interfaz_propia` (translated to
  the manager). If it is not an npm version of the package (a path or a URL: a build not published yet), stop and tell the
  person: that line cannot be committed (say it already at step 5, when you read `widget --json`). The app is touched at step 7, so the proposal of step 5 comes from the app's code
  and the reference; read the installed contract right after installing and, if it changes what you proposed, say so and ask
  before writing the interface. No code comes from the terminal to paste: you write the interface with the app's components, on top of
  `useSupportChat` (`@supcoflow/chat/react`) and the helpers of `@supcoflow/chat/core`. Never copy a styled component, never
  `ChatDeIntake`, never `supcoflow chat brand`, never add a component, icon or font library, and never a Supcoflow logo, name
  or link.
- **One chat, never two.** If the widget is already mounted (the `archivo` recorded in `.supcoflow/instalacion.json`, or a
  layout that imports it), stop and ask whether to replace it; with their yes, take it out of the layout and never delete the
  file yourself (point 7).
- CSP: the same rule as the widget's (above), with the `csp` line of `interfaz_propia`.
- Check it without spending: the conformance checks and the fake backend of the package spend nothing and touch no production.
  Level 2 and level 3 of [`referencias/prueba.md`](referencias/prueba.md) stay the person's.
- Do not commit the interface, its tests or `.supcoflow/instalacion.json`: they are the person's to review and commit. Say it in line 3 of the summary.
- Record it: `supcoflow install record --skill <version> --shape own-interface --file <each file of the interface> --json`. The files are
  the files of the interface (its components and styles), the file of the trigger if it is another, and the file that mounts it (the layout you edited); never the tests; the terminal writes the contract version from the installed
  package. If it exits 4 with `archivo_no_versionado` or `cambios_sin_commit`, `.supcoflow/instalacion.json` is there but git does not
  keep it: tell the person to commit or discard it, and never delete it or commit it yourself.

## 11. What you do not do

Spend on your own: the only test that spends is level 3 of [`referencias/prueba.md`](referencias/prueba.md), and only
with the person's explicit yes to the numbers that `supcoflow test --json` gave; never add
`--authorize-spend` without that yes, and never repeat an old yes for another test. Neither: raise the cap, relaunch
an `arranque_incierto` (it is relaunched from the console inbox), delete the project, turn on the factory, give
people access (the API rejects them by key: they belong to the console). Never show or copy a `scf_` key.

## 12. No network

If a command exits 1 with a network error, tell them in one line ("from here I can't reach Supcoflow; run this in your
terminal") with the exact command, and do not retry.

## 13. The final summary

Hard limit: **three lines at most**, in English unless the person writes in another language, with this shape and no
lists of files:

1. "Done. The chat is a bubble on N pages, in English." and the sentence of the policy: with "Look into it right away",
   "Each problem gets looked into and ends up as an issue."; with "Save it for me to review", "Each problem is saved
   for you to review.";
2. where the chat lives (the file and the layout);
3. what is missing, or "nothing" (if you tested, the level and its result; if not, that it can be tested); if the guide
   is not on GitHub, this line includes "pushing the guide to GitHub is up to you"; if the guide was not committed, it
   also includes "commit `.supcoflow/guide.md` on `<rama>` when you want" (the project's main branch).

If something is not finished and you could not fix it (a site not added, the install not recorded, a failed check), line 1 is not "Done." but "Not finished: <what is missing>." and line 3 says what to do. With an own interface line 1 is "Done. The chat opens from <the trigger>, built with your own components, on N pages, in <the language of its texts>." (then the sentence of the policy) and line 3 also says whether the conformance checks ran, passed and which points stay manual.

The step lines of point 2 are not part of the summary: they do not count in those three lines and never go in them.
Name only files that exist (if in doubt, look first). The person corrects.
