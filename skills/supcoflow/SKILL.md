---
name: supcoflow
description: Installs and configures the Supcoflow support chat in an app with the `supcoflow` terminal, built with the app's own components, icons and styles (Next.js tested) or as the packaged widget. Use when the person asks for "/supcoflow go", to add a support or help chat to their app, says their users get stuck, asks why the support chat isn't showing, says "chat de soporte", asks for "/supcoflow guide" or to write or update the guide of what their users see, or wants to change the chat, its guide, its data or its AI account. Do not use for other chat vendors.
metadata:
  version: "0.7.0"
---

# Supcoflow go

Talk to the person in the language they use.

## 1. What it is for

Leave the Supcoflow chat working in this app: it shows up where users get stuck, it knows what the app is about (the
guide) and what they report ends up where the person chose. In a Next.js app the chat is built with the app's own
components, icons and styles (point 10): Supcoflow brings the engine, the rules and the tests, never a design.

## 2. How to talk to Supcoflow

- Always through the terminal and with `--json`. First `supcoflow describe --json`: if it says `"version":"0.11.0"`,
  use plain `supcoflow` in everything that follows. Only if it is not installed, fails, or is another version (an old
  0.7.0 has no `describe`), run every command pinned: `npx -y supcoflow@0.11.0 describe --json`. Never `@latest` and
  never another version.
- One terminal command per call, as is: no `;`, `&&` or pipes, and no added `echo $?`. You read the exit code from the
  command's own result (if your tool shows no code for a success, a result without an error is 0; never add `echo $?`).
- Never invent a command or a flag: read them from `describe --json` at the start. Below, `supcoflow` means the pinned
  terminal.
- In the full order, start each step with one line: "Step N of 10: <what it is>" (for example "Step 3 of 10: your
  settings"), so the person sees where you are.
- Run the terminal from the app's folder: it reads the repo from that folder's `origin` (`--repo owner/repo` if you cannot).
- Never paste the terminal's JSON to the person: say what it means in one sentence.
- **Every question to the person goes through your options tool**: `AskUserQuestion` in Claude Code, the equivalent in
  another agent, and only if there is none a short numbered list. One question at a time, never a block of mixed
  questions, each with short options (a yes or no is two options; what is free text goes through "Other"). It applies
  to everything below that asks: the confirmation of point 5, the commit, the push, the site, the business rules.
- **The browser opens by itself**: when a command (`login --start`, `repo connect --start`) reports
  `navegador_abierto: true`, the page is already open: say so ("I opened the page in your browser") with the code,
  instead of pasting the link. With `false` or no field, show the link and the code. Open the browser yourself only for
  a login, an approval, a step on GitHub (connect, install the App, open the pull request) or a step of the console,
  never for anything else.
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
`config` exits 4 with `error: "sin_proyecto"`, this repo has no project yet. When the person asked to install or to connect the repo, go on to
step 2 of the order (connect the repo, create the project) and read `config` again. For any other row, tell them the
installation is missing and offer the full order; create nothing for a diagnosis or a partial request. Any other exit 4
is a decision for a person: stop, as the table of point 2 says.

If the first command that needs the repo exits 3 with `error: "sin_repo"` because the "origin" is an SSH alias (the
message says so and gives `git remote add supcoflow https://github.com/<owner>/<repo>.git`, or the same with
`set-url`), show the person that exact command, say it only touches this clone's git settings and is never fetched, and
run it only with their yes (a permission like the commit's, not a fourth question). Then go on without `--repo`. The
`falta_guia` or `sin_clon` of an alias gives the same command. If the message gives no command, tell the person what it
says and stop. Then:

A request that matches one of the narrower rows below runs only that row, even when it also says `/supcoflow go`: the
full order is for a request to install that names nothing narrower.

| The person asked | You do |
|---|---|
| Does the chat work? Why isn't it showing? | `supcoflow diagnose --json` and read its points (step 10). Fix only what it names. No test, nothing is spent. If the point of the chat's AI account (`ia_del_chat`) fails, handle it as section 3 of [`referencias/cuentas-de-ia.md`](referencias/cuentas-de-ia.md) says. |
| `/supcoflow guide`, or update the guide | [`referencias/guia-en-carpeta.md`](referencias/guia-en-carpeta.md): the guide as documents in `.supcoflow/knowledge/`. It writes and checks them and proposes the commit; it **never publishes**. Do not ask about data, policy or the test. The permissions of point 7 and the business-rules question stay. If the repo only has the single `.supcoflow/guide.md` (or `guia.md`), that file's section 4 splits it into the folder first. |
| Publish the guide | Point 9, step 4: the first guide of a project may go from the terminal; once the project has a guide published from GitHub, only `supcoflow guide publish --from-github --json`, from the project's main branch (`proyecto.rama`) once the guide is merged there, or the project's CI step. Never `--from-github` from another branch, not even with a yes: say that the guide goes live when it is merged on `<rama>` (the pull request is the review) and propose merging. |
| Change what the chat sees about their users | Only the first question of point 5 ("Changing it"), with its scope warning, and all of its table, including what changes in the app's code. Do not ask the second question and do not show the confirmation. The permissions of point 7 before touching files stay. |
| Test it | [`referencias/prueba.md`](referencias/prueba.md). Level 3 spends: only with its own yes, asked on its own: the install never asks it. |
| Connect the repo | Steps 1 and 2 of the full order, and stop after "Connected. Created the project <slug>." (or, if the project already existed, after saying so). Nothing else: no questions, no guide, no chat, and the app's code is not touched. Offer the rest as `/supcoflow go`, and end with the one line of the first-draft offer (after step 10): with a yes, its flow; with a no, it ends there. |
| Change what happens with a report | Only the second question of point 5 ("Changing it"), with its words and its warning that investigating spends: ask it, do not decide it, then `supcoflow policy set --mode investigate --json` or `supcoflow policy set --mode save --json` and say the result in one sentence. Do not ask the first question and do not show the confirmation. |
| Turn the chat on | Steps 8 and the checks before it, and nothing else: if the chat is required and not ready, [`referencias/cuentas-de-ia.md`](referencias/cuentas-de-ia.md) section 3 says stop. If the code does not say the site where its users use the app, ask it with the sites you found as options and "Other" (`http://localhost:3000` only for a local test), `supcoflow sites add --site <site> --json`, then `supcoflow chat on --json`. If `chat on` says something is missing (a guide, the chat's AI account), say what and stop. Do not touch the app's code: if the chat is not in it yet, offer the full order. |
| Check an AI account (the chat's or the triage agent's) | `supcoflow agents check --agent <chat or triage> --json` and say in one line whether that agent's account is ready or what is still missing, as section 2 of [`referencias/cuentas-de-ia.md`](referencias/cuentas-de-ia.md) reads its exits. It spends nothing. Never ask for the key. |
| Put or fix an AI account (the chat's or the triage agent's), or choose the chat's model | [`referencias/cuentas-de-ia.md`](referencias/cuentas-de-ia.md). The key is the person's: you never ask for it and never run `supcoflow agents set-key` or `supcoflow agents remove`. |
| Install it, or `/supcoflow go` | The full order below, steps 1 to 10, then the first-draft offer after step 10. |

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
   `politica.fijada_en: null` means not set (even if it says `modo: "relevar"`) → it goes in the confirmation of
   point 5 (its defaults are the proposal; investigating, which spends, is never the default).
4. `supcoflow agents show --json` (it only reads, and exits 0 even when an account is missing): the AI account of each agent,
   `agentes[].estado` for `chat` and `triaje` (the triage agent): `lista`, `rechazada`, `sin_saldo` or `falta`. Say each one in
   a line. `cuenta_lista` says only that the ACCOUNT is ready, not that the agent's configuration (its model) is approved. Then
   `supcoflow diagnose --json` once, only to read `ia_del_chat` (in `instalacion.puntos`) and `ia_del_triaje` (in
   `prueba.puntos`): they are there only when the engine requires the accounts, and then a failing one means the agent is not
   ready (its account, or its model not approved) even if its account is `lista`. Do not tell the person the rest of that
   diagnosis now; its exit 4 `no_listo` is the report here, not a stop. Follow
   [`referencias/cuentas-de-ia.md`](referencias/cuentas-de-ia.md): the person puts or fixes what is missing, never in this
   chat.
5. **No test in the install.** Do not run `supcoflow test` here and do not offer a paid test: the install spends nothing
   (point 5). The test stays for later (the "Test it" row and the closing line of point 13), asked on its own. If the
   triage agent is required and not ready (step 4), say it in the summary as point 13 says.
6. Read the code (with your file tools, as point 2 says) → say what you will do: "From your code: <what you read>, on N pages." (N: count the `page.tsx`
   files under the layout where you will mount the chat; the chat covers what that layout covers, so never make up a
   list of pages). If the app is Next.js (App Router), also run `supcoflow widget --json` here (it only reads) to decide
   the form (point 10: own interface or widget) before the questions. → with an own
   interface, how people open the chat (point 5) → the confirmation (point 5) → apply the configuration
   (`supcoflow data set`, `supcoflow policy set`).
7. `git status --porcelain --ignored -- .supcoflow` (point 7, before writing) → write the guide's files (point 8: the
   documents of `.supcoflow/knowledge/`; a repo that only has the single `.supcoflow/guide.md` or `guia.md` keeps writing that file and never gets a new `guide.md`) → `supcoflow guide
   check --json` in another call → show the diff, ask the business rules and ask for the yes to the commit on a new
   branch (point 9) → point 9: the commit, the push and the pull request with their own yes, and the publication of
   step 4. If the project has no live guide and step 4 did not publish, stop here: skip steps 8 and 9 and end with
   "Not finished" (point 13), saying what step 4 said must happen for the guide to go live and that `/supcoflow go`
   goes on from there.
8. `supcoflow sites add --site <origin of the app> --json` (the site where its users use it, e.g. its public domain;
   `http://localhost:3000` only for a local test; if the code does not say, ask; if its `sitios` does not list the site, say so and do not go on as if it were added).
   Before `chat on`, if the chat is required and was not ready at step 4 (run `supcoflow diagnose --json` again and look only at
   `ia_del_chat`: the person may have fixed it by now), and the point still fails, do not turn the chat on or touch the app: say
   what is missing (the account, or its model, as the point says), skip step 9 and end with "Not finished" (point 13); `falta_ia_del_chat` is the same case if `chat on` exits 4 with it. Otherwise
   `supcoflow chat on --json` → `supcoflow widget --json` → put the chat, in the form decided in step 6 (point 10). The app is touched only here, with the guide already
   published and the site added.
9. `supcoflow install record --skill <metadata.version of this skill> --file <the file the chat is mounted from> --json`
   (the number is the `metadata.version` in the YAML header of this SKILL.md: if you do not have it in view, open the
   file; never written separately; `--app <folder>` if the app is not at the root) → point 10 explains which file. For an own
   interface add `--shape own-interface` and one `--file` for each file of the interface (point 10).
10. `supcoflow diagnose --json`. Say the line the terminal prints (with `--json`, build it from `instalacion.ok` and `instalacion.total`): "Checked sign-in, repo, GitHub App, allowed sites,
   chat, guide and interface: N of 7, at no cost."; when `ia_del_chat` is among `instalacion.puntos` the total is 8 and the line
   names it: "Checked sign-in, repo, GitHub App, allowed sites, chat, chat AI account, guide and interface: N of 8, at no cost."
   (never a fixed number). If `ia_del_chat` (in `instalacion.puntos`) or `ia_del_triaje` (in `prueba.puntos`) fails, handle it
   as section 3 of `referencias/cuentas-de-ia.md` says. If a point that is not an `aviso`
   one fails, say so. A failing `aviso` point (the interface one) lowers the count: say what it says. Nothing is
   tested or spent here. Then the summary (point 13).

The first-draft offer (after step 10, and at the end of the "Connect the repo" row): after the summary (point 13), offer
once, in one line, only when `.supcoflow/knowledge/` has no `.md` and the install did not stop for something other than
the guide not being live yet. After the full order that means the repo kept its old single `.supcoflow/guide.md` (or
`guia.md`, point 8): the offer to migrate it to the folder. It is never made right after this order wrote the folder (point 8: a new project gets the
folder directly). After "Connect the repo" nothing was written, so it is the offer of a first draft. "Want me to keep the
guide as documents in `.supcoflow/knowledge/`, one per area of your app, so it stays up to date with your code? I'd leave
it as a commit for you to review; nothing is published." With their yes, follow [`referencias/guia-en-carpeta.md`](referencias/guia-en-carpeta.md) section 9; its closing (section 7, step 4)
reads `guide versions --json` and, with no active guide (`vigente` null, as after "Connect the repo"), says the draft is not
published, with the same by-branch ending as the other cases. With a no, do not offer
again.

Testing beyond that (optional, never without asking): offer the person the levels of
[`referencias/prueba.md`](referencias/prueba.md). Level 1 (`supcoflow diagnose --json`) is free; level 2 uses a
browser and talks to the chat's AI; level 3 **spends** and you ask the person first, with the ceiling
that `supcoflow test --json` gave.

Every step can be resumed: if the session is cut, `/supcoflow go` starts like every row (`project show`, the context line, then `config`) and goes on from what is missing.

## 4. What you decide

The technical and reversible: which screens the guide covers and, for the widget, where it shows up, its position,
title, greeting, colors (`supcoflow chat brand`) and language. It is said in the summary; it is not asked. With an own
interface (point 10) none of the widget's look settings exist: you never ask about colors, fonts or icons and never run
`supcoflow chat brand`; the chat takes the app's own look. What it does ask is how people open it (the second panel of
point 5).

## 5. What you ask the person

In the full order and for whatever is still unset, ONE confirmation with the recommended settings, not three
questions (a request to change only the data or only the policy uses the question of its row, "Changing it" below). Do
not decide it yourself even if the code suggests it, and do not apply anything before the yes.

**The defaults** (what the confirmation proposes): the chat sees the page and the browser, and nothing about who they are
or what they have on screen; a report is saved for the person to review, not investigated; no paid test. Everything stays
changeable later. Before asking, say what is true today: the data agreement limits what is SAVED in Supcoflow and what the
investigating AI reads, not what the chat's AI sees while it talks; and with the widget, this chat always offers users
screenshots and pointing at elements (there is no switch for them in the code: if the agreement rejects them, they are
discarded when saved); an own interface offers only the tools of its second panel.

**The confirmation.** First, in a few lines of text and not as a question, what it shows: what the chat will see ("the page
they are on and their browser; not who they are, and no screenshots"), what happens with a report ("it is saved for you
to review; nobody investigates it, so it spends nothing"), that it does not spend, and that they can change any of it
later. Then ONE question with the options tool:

> **Use these settings? The chat sees the page and browser, reports are saved for you to review, and nothing is spent.**
> 1. Yes, use them (recommended)
> 2. Let me change something

With 1: `supcoflow data set --allow page_and_browser`, `supcoflow policy set --mode save` and, for the code, the second row
of the table below. When one of the two is already set (step 3), the confirmation proposes and applies only the other:
say the one already set as it is today, leave it out of the question (no "the chat sees the page and browser" when the
data is set; no "reports are saved" when the policy is set) and run only the command of the unset one; for the code, the
row of the table that matches the data as it is. Never re-propose or overwrite a setting already set; changing it is a
request of its own ("Changing it").

With 2: ask "Changing it" below, one question at a time, and only the ones the person wants to change.

**Changing it.** Each of these is a question of its own, with the options tool:

> **What can the chat see about your users?**
> 1. Who they are, the page, and screenshots
> 2. Only the page and browser
> 3. Only what they type
>
> **What happens when someone reports a problem?**
> 1. Look into it right away
> 2. Save it for me to review

Each answer goes to its mechanism, all at once, with ONE `supcoflow data set --allow <list>` (or `nothing`):

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
  `supcoflow policy set --mode save` for "Save it for me to review". Tell them that investigating **spends** (the cost is theirs, at their AI provider), and that with "save" a person can ask for the investigation later.
- **The test is not asked here.** The install never offers a paid test: a test comes later, from the "Test it" row, with
  its own yes to numbers (`supcoflow test --json` gives the ceiling), never a phrase. With "Save it for me to review"
  that test spends nothing (it stops at the saved problem).

**Own interface only: a second panel** of two questions, each asked on its own through the options tool, the first before the
confirmation and the second only after the data answer is settled. Never colors, fonts or icons: the app
already answers those. Fill option 1 of the first with what you read in the code and print it as words, not as placeholders:

> **How should people open the chat?**
> 1. <your proposal: the trigger and what it opens, built with the app's own components — for example a "Help" button in the header that opens a side sheet>
> 2. A floating button in a corner that opens a panel
> 3. Somewhere else (tell me where)

How it opens is the person's decision, never yours. So when the data answer is the default or the first answer is 2 or 3 (the agreement takes no screenshots, images or pointed
elements; an image counts as a screenshot), do not ask the tools question: say "Your data agreement doesn't take
screenshots, images or pointed elements, so the chat won't offer evidence tools." and declare all three `false`; the
second panel then has only its first question. Only when the first answer is 1:

> **Which tools should it offer to add evidence?**
> 1. Attach an image, take a screenshot and point at an element
> 2. Only attach an image
> 3. None

The second answer goes to the `capabilities` option of the chat and to nothing else: 1 is
`capabilities: { attachImage: true, screenshot: true, pickElement: true }`, 2 is
`capabilities: { attachImage: true, screenshot: false, pickElement: false }` and 3 is
`capabilities: { attachImage: false, screenshot: false, pickElement: false }`. `newConversation` stays on in all three
(a person can always start another conversation after a report). The interface also follows `state.allows`, so a tool the
data agreement rejects is not shown whatever they answer.

The rules of their business (deadlines, refunds, prices, commitments) are not part of the confirmation: they are asked
with the diff of the guide (point 9), per point 2. **Never deduce them from the code**; if there are none, the guide does
not carry them.

## 6. Show before applying

Show the person the configuration proposal and the list of files you will create or change before `data set`,
`policy set` and before touching files. For an own interface the proposal also says which trigger and where, which of the
app's components and icons it reuses, which files it creates, which tools it offers and whether it adds test packages. The
confirmation of point 5 is the yes to that proposal, so the proposal goes in the lines before it; if the person corrects
the proposal, answer the correction and ask the confirmation again. Nothing is written before it.

## 7. Do not overwrite

Before creating or writing a file (also the guide's), never after: `git status --porcelain --ignored -- <file>`.
If it has uncommitted changes, is registered but deleted without a commit, is a symlink, or is not versioned
(it exists but git does not track it, also if git ignores it), do not touch it: show what you would do and ask, except for the files you created
or changed yourself in this session (the guide between rounds of `guide check`, a layout you already touched). Never
`--force`, never delete files of the app.

## 8. The guide

The format of each section (the four labels) and the example are in [`referencias/guia.md`](referencias/guia.md); where
it is written and how is in [`referencias/guia-en-carpeta.md`](referencias/guia-en-carpeta.md). The guide is documents in
`.supcoflow/knowledge/`: when the repo has that folder with `.md`, or has neither it nor a `.supcoflow/guide.md` / `guia.md`
(a new project, as in `/supcoflow go` or the first draft after "Connect the repo"), write there directly, one document per area, each with its
header (`title`, `summary`, `sources`), the four labels, section names that tell apart across documents and no hand-written
index (sections 3 and 5 of that file), never a `guide.md` first. A repo that only has the single `.supcoflow/guide.md`
or the old `guia.md` never gets a new `guide.md`: keep that file as the guide and write it as usual (from the code, and with the business rules of point 9) until it is
migrated (if it is `guia.md`, tell the person it is the old name), and the first-draft offer is the offer to migrate it to the
folder (section 4 of that file); never rename or delete theirs. When the folder has documents, `guide.md` is ignored.
When this order has just created the folder and it was committed in point 9 step 2, after point 9 (steps 1 to 5,
publishing included) offer once the line of section 8 of that file, in a commit of its own; never amend the guide's
commit. If step 4 did not publish, make this offer before the "Not finished" stop of step 7 of the full order. Read the code and, if they exist, `CLAUDE.md`/`README` to understand the screens; one section per
screen or function a user uses; "Common problems" only from something visible (an issue, a TODO, the README) or
dictated by the person. Only what exists in the code and a user really uses: no "Home" section because of a template
page, no links or buttons the code does not have. Add `Where:` with the route only if that route exists in the code.
`supcoflow guide check --json` until it exits 0.

## 9. Commit the guide, open the pull request, publish it

Never push or commit on the project's main branch (`proyecto.rama`), never merge, never `--force`. The guide goes on a
NEW branch of its own and reaches `<rama>` only through a pull request that the person merges.

The guide's files are the documents of `.supcoflow/knowledge/` you wrote (point 8), or, in a repo that only has the
single file, that file (`.supcoflow/guide.md` or `guia.md`). `<files>` below is them.

1. If `git status --porcelain --ignored -- <files>` says git ignores one (`!!`), it cannot be committed: tell
   them the declared commit will not contain it. Otherwise, and the output is not empty (new or changed), first read
   where you are: `git branch --show-current` and the project's main branch, the `rama` of
   `supcoflow project show --json` (`proyecto.rama`). If you cannot read the branch, treat it as no branch. Then show
   them, as text, the diff of THOSE files (new, `??`: the whole file; changed: `git diff -- <files>`), the exact commit
   message and the name of the new branch (`supcoflow/guide`, or `supcoflow/guide-<n>` if it exists), and ask, one
   question at a time with the options tool:
   1. Their business: "Anything about your business the chat must know — deadlines, refunds, prices? I won't guess them
      from the code." Options: "Nothing to add" and "Yes, I'll tell you" (the rules go through "Other"). If they give rules,
      add them to the guide, run `supcoflow guide check --json` again and show the diff again before the commit.
   2. The commit, by where they are:
      - On `<rama>`: "I'll commit it on a new branch, `<new>`, not on `<rama>`." Options: commit, or not now.
      - On another branch: say "You're on `<branch>`, not on `<rama>`; a pull request from a new branch made here would
        carry this branch's commits too." Options: commit on a new branch from here, or not now.
      - No branch (detached HEAD, empty output): recommend not committing; if they still want it, the new branch starts
        from this commit.

   The yes comes BEFORE the commit.
2. With a yes: `git switch -c <new>` (the uncommitted files go with you), then `git add -- <files>` (if one is new,
   without this the commit fails) and `git commit -m "<message>" -- <files>`, with EXACTLY the message you showed: adding
   nothing (no `Co-Authored-By` or other attribution); if your environment adds one, put it in the message you show.
   With the path, what the person has in the index stays there, uncommitted. Never `git add .` or `git commit -a`. Check
   with `git show --name-only HEAD` that the new commit touches only those files. You stay on `<new>` afterwards: say so, because the app's files of step 8 will be uncommitted there for the person to review.
   With a no, or "not now": do not commit
   and do not create a branch, and tell them the guide is in no commit yet.
3. **The pull request**, only after the commit and with its own question: "Push `<new>` and open the pull request into
   `<rama>`?" Options: yes, or not now. With a yes: `git push -u origin <new>` (only that branch, never `<rama>`), then
   open the pull request: with `gh` if it is installed and signed in (`gh pr create --base <rama> --head <new>` with a
   short title and body in the person's language), otherwise the compare link
   `https://github.com/<owner>/<repo>/compare/<rama>...<new>?expand=1`, opened in the browser (`open` on macOS,
   `xdg-open` on Linux) and said as "I opened the page to create the pull request", or shown if you could not open it.
   Give the pull request's URL. Never merge it: merging is the person's. With "not now", say the branch `<new>` stays
   committed here and pushing it is up to them.
4. **Publishing the guide.** First `supcoflow guide versions --json` (it only reads): `publicaciones` says where each
   publication came from (declared by the terminal or verified in GitHub) and `vigente` which one governs.
   - **The project has no guide published from GitHub yet** (no publication is verified in GitHub): the first guide may go
     from the terminal so the chat works now. With the guide committed (step 2), ask: "Publish this first guide now, from
     here, so the chat can use it? Later ones go out when you merge." Options: yes, or not now. With a yes,
     `supcoflow guide publish --json` (the engine decides and says if it refuses: pass its message on and do not try
     another way). It publishes the commit of the new branch; if step 3 opened the pull request, say that it is still the review for
     `<rama>`; otherwise say that the branch `<new>` still has to be pushed and merged into `<rama>`.
   - **The project already has a guide published from GitHub**: only `supcoflow guide publish --from-github --json`, and
     only when `git branch --show-current` is `<rama>` (after the pull request is merged); or the project's CI step. Never
     `supcoflow guide publish --json` without `--from-github`, on any branch, not even with a yes. If `--from-github`
     exits 5 `guia_no_subida` or `guia_distinta`, GitHub's `<rama>` does not have this guide yet: say "The guide goes live
     when the pull request is merged on `<rama>`" and do not publish another way. On any other branch, or with no branch,
     do not run it.
   Exit 0 means the guide is live (also when it was already live from a cut session: say so and go on). If there is no
   guide that governs (`vigente` null) and this one did not go live, the chat has no guide: stop before `chat on` (step 7
   of the full order). If publishing warns that `guia.md` is the old name, pass the warning on to the person.
5. ALWAYS, in the same message where you say whether the guide went live, say in one line where the guide is: "The pull
   request is open: merging it is up to you", or "The branch `<new>` is committed here; pushing it and opening the pull
   request is up to you", or "The guide is in no commit yet".

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
  person: that line cannot be committed (say it already at step 6, when you read `widget --json`). The app is touched at step 8, so the proposal of step 6 comes from the app's code
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

Push `<rama>` or commit on it, merge a pull request, or force anything: the guide goes on a new branch and the person
merges. Spend on your own: the only test that spends is level 3 of [`referencias/prueba.md`](referencias/prueba.md), and only
with the person's explicit yes to the numbers that `supcoflow test --json` gave; never add
`--authorize-spend` without that yes, and never repeat an old yes for another test. Neither: raise the cap, relaunch
an `arranque_incierto` (it is relaunched from the console inbox), delete the project, turn on the factory, give
people access (the API rejects them by key: they belong to the console). Never show or copy a `scf_` key. Never ask for an AI key, accept one that is pasted in the chat, or put one in a command, a
file or an environment variable, and never run `supcoflow agents set-key` or `supcoflow agents remove` yourself: the key of
an AI account is the person's alone ([`referencias/cuentas-de-ia.md`](referencias/cuentas-de-ia.md)).

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
3. what is missing, or "nothing" (if you tested, the level and its result; if not, that it can be tested); an AI account that is not ready and that `diagnose` does not list as required also goes in line 3 ("the triage agent has no AI account yet"); the guide's
   state, in a few words: the pull request is open ("merging it is up to you", with its URL), or the branch is committed
   but not pushed ("pushing `<branch>` and opening the pull request is up to you"), or the guide was not committed
   ("commit the guide when you want"); and that a test can be run later (it is not run here).

If something is not finished and you could not fix it (a site not added, the install not recorded, a failed check), line 1 is not "Done." but "Not finished: <what is missing>." and line 3 says what to do. If the engine requires the chat's AI account and it is not ready, line 1 is "Not finished: the chat's AI isn't ready (<the account | its model>)." and line 3 says what is missing and who does it (the account: the Agents tab, or `supcoflow agents set-key --agent chat` in their own terminal; its model: the Agents tab) and that `/supcoflow go` resumes from there. With an own interface line 1 is "Done. The chat opens from <the trigger>, built with your own components, on N pages, in <the language of its texts>." (then the sentence of the policy) and line 3 also says whether the conformance checks ran, passed and which points stay manual.

The step lines of point 2 are not part of the summary: they do not count in those three lines and never go in them.
Name only files that exist (if in doubt, look first). The person corrects.
