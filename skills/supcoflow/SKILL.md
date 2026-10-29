---
name: supcoflow
description: Installs and configures the Supcoflow support chat in an app (Next.js tested) with the `supcoflow` terminal. Use when the person asks for "/supcoflow go", to add a support or help chat to their app, says their users get stuck, asks why the support chat isn't showing, says "chat de soporte", or wants to change the chat, its guide or its data. Do not use for other chat vendors or for building a chat from scratch.
metadata:
  version: "0.3.1"
---

# Supcoflow go

Talk to the person in the language they use.

## 1. What it is for

Leave the Supcoflow chat working in this app: it shows up where users get stuck, it knows what the app is about (the
guide) and what they report ends up where the person chose.

## 2. How to talk to Supcoflow

- Always through the terminal and with `--json`. First `supcoflow describe --json`: if it says `"version":"0.8.0"`,
  use plain `supcoflow` in everything that follows. Only if it is not installed, fails, or is another version (an old
  0.7.0 has no `describe`), run every command pinned: `npx -y supcoflow@0.8.0 describe --json`. Never `@latest` and
  never another version.
- One terminal command per call, as is: no `;`, `&&` or pipes, and no added `echo $?`. You read the exit code from the
  command's own result.
- Never invent a command or a flag: read them from `describe --json` at the start. Below, `supcoflow` means the pinned
  terminal.
- In the full order, start each step with one line: "Step N of 9: <what it is>" (for example "Step 3 of 9: your
  settings"), so the person sees where you are.
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

**Start from what the person asked.** Every row begins with `supcoflow config --json` (with exit 2, the login of
point 2 first). If it exits 4 with `error: "sin_proyecto"`, this repo has no project yet. When the person asked to
install, go on to step 2 of the order (connect the repo, create the project) and read `config` again. For any other row,
tell them the installation is missing and offer the full order; create nothing for a diagnosis or a partial request.
Any other exit 4 is a decision for a person: stop, as the table of point 2 says. Then:

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
   `supcoflow project create --json`, and say: "Connected. Created the project <slug>."
3. `supcoflow config --json`: what is already set is not asked again. Only what is set counts: `acuerdo: null` or
   `politica.fijada_en: null` means not set (even if it says `modo: "relevar"`) → ask it, with the warning that
   investigating spends.
4. `supcoflow test --json` (without authorizing: it sends nothing and exits 4 with `falta_autorizacion`) to have the
   ceiling, balance and cap in numbers (`techo_usd`, `saldo_usd`, `tope_usd`) before the third question.
5. Read the code (with your file tools, as point 2 says) → say what you will do: "From your code: <what you read>, on N pages." (N: count the `page.tsx`
   files under the layout where you will mount the chat; the chat covers what that layout covers, so never make up a
   list of pages) → the three questions (point 5) → apply the configuration (`supcoflow data set`,
   `supcoflow policy set`).
6. `git status --porcelain --ignored -- .supcoflow/guide.md` (point 7, before writing) → write `.supcoflow/guide.md`
   in one call → `supcoflow guide check --json` in another → show the diff and ask for the yes to the local commit
   (point 9) → `supcoflow guide publish --json`.
7. `supcoflow sites add --site <origin of the app> --json` (the site where its users use it, e.g. its public domain;
   `http://localhost:3000` only for a local test; if the code does not say, ask) → `supcoflow chat on --json` →
   `supcoflow widget --json` → put the component (point 10). The app is touched only here, with the guide already
   published and the site added.
8. `supcoflow install record --skill <metadata.version of this skill> --file <the file the chat is mounted from> --json`
   (the number is the `metadata.version` in the YAML header of this SKILL.md: if you do not have it in view, open the
   file; never written separately; `--app <folder>` if the app is not at the root) → point 10 explains which file.
9. `supcoflow diagnose --json`. Say the line the terminal prints: "Checked sign-in, repo, GitHub App, allowed sites,
   chat and guide: N of 6, at no cost." If it is not 6 of 6, or it says it is not ready for a test, say so and nothing
   is spent. If it is, and the person said yes to the third question: `supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy> --json`
   in a call of its own, then `supcoflow test --wait --json` (details in
   [`referencias/prueba.md`](referencias/prueba.md), level 3). Then the summary (point 13).

Testing beyond that (optional, never without asking): offer the person the levels of
[`referencias/prueba.md`](referencias/prueba.md). Level 1 (`supcoflow diagnose --json`) is free; level 2 uses a
browser and talks to the chat's AI; level 3 **spends** and you ask the person first, with the ceiling and the balance
that `supcoflow test --json` gave.

Every step can be resumed: if the session is cut, `/supcoflow go` starts with `config` and goes on from what is missing.

## 4. What you decide

The technical and reversible: where the chat shows up, position, title, greeting, colors (`supcoflow chat brand`),
language, which screens the guide covers. It is said in the summary; it is not asked.

## 5. What you ALWAYS ask the person

These three, in one panel with exactly these words, in the full order and for whatever is still unset (a request to change only the data uses the first one: see the map of point 3). Do not decide them yourself even if the code suggests it. Before
asking, say what is true today: the data agreement limits what is SAVED in Supcoflow and what the investigating AI
reads, not what the chat's AI sees while it talks; and this chat always offers users screenshots and pointing at
elements (there is no switch for them in the code: if the agreement rejects them, they are discarded when saved).

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

`email` is allowed only if the person asks for it by name. Never `usuario.nombre`.

- **Second question**: `supcoflow policy set --mode investigate` for "Look into it right away" and
  `supcoflow policy set --mode save` for "Save it for me to review". Tell them that investigating **spends**, within the
  team's monthly cap, and that with "save" a person can ask for the investigation later.
- **Third question**: a yes to numbers, not to a phrase. With "Save it for me to review", option 1 of the third
  question says the test spends nothing (it stops at the saved problem). That yes authorizes ONE test with exactly the
  ceiling you showed and the policy you offered: the final command is `supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy>`
  with the number you printed and the policy you offered. Never a number you re-read. `techo_distinto` or
  `politica_distinta`: ask again with the new numbers.

The rules of their business (deadlines, refunds, prices, commitments) are not a fourth question: they are asked
together with the diff of the guide (point 9). **Never deduce them from the code**; if there are none, the guide does
not carry them.

## 6. Show before applying

Show the person the configuration proposal and the list of files you will create or change before `data set`,
`policy set` and before touching files.

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

The step lines of point 2 are not part of the summary: they do not count in those three lines and never go in them.
Name only files that exist (if in doubt, look first). The person corrects.
