# The guide as documents: `/supcoflow guide`

The guide can be a folder, `.supcoflow/knowledge/`: one `.md` document per area of the product. The coding agent keeps it
up to date next to the code, in the same change. This row **writes and checks documents and proposes the commit. It never
publishes.** What the chat uses changes only when the guide is published (point 9 of `SKILL.md` and section 7 below).

Start like every row of point 3 (`project show`, the context line, `config`), then:

## 1. What the folder is

- If `.supcoflow/knowledge/` has at least one `.md` directly inside, the guide is ALL those documents together, as one
  version, and it governs: `.supcoflow/guide.md` and `guia.md` are ignored (the terminal says so). Once the folder exists, say
  this to the person.
- Limits for the whole set, not per document: up to 64 KB, up to 60 documents and up to 60 sections in total. A `.md`
  whose name is not valid is rejected by name, never skipped. Other files and subfolders are not read.
- Each document has the format of [`guia.md`](guia.md) (the four labels: "What it's for:", "What users can do:",
  "Common problems:", "Where:"), plus the header of section 3.
- **No `index.md` by hand, ever.** The index of the documents comes from their headers (`title` and `summary`), by code. A
  hand-written one goes stale the first time a change forgets it.

## 2. Look before writing

1. `git status --porcelain --ignored -- .supcoflow` (point 7 of `SKILL.md`): what has uncommitted changes, is ignored, is a
   symlink or is not versioned, you do not touch: show what you would do and ask. Never `--force`, never delete a file.
2. Read what is there (your file tools): the documents of the folder, or the single file, and the code and, if they exist,
   `CLAUDE.md` and `README`. Decide which of the three cases it is:
   - The folder already has documents: update them (section 5).
   - Only `.supcoflow/guide.md` or `guia.md`: split it first (section 4).
   - Nothing: write the documents from the code (section 5), one per area.

## 3. A document

```markdown
---
title: Billing
summary: Invoices, payments and refunds: what users see and do.
sources:
  - app/billing/**
  - lib/payments/**
---

## Invoices
What it's for: View and pay the month's invoices.
What users can do: Download the PDF, pay by card and see the history.
Where: /invoices
Common problems:
- The Pay button does nothing with debit cards.
```

- **One document per area of the product** a user would name (billing, bookings, account), not per file of code. File
  name: a short lowercase name, `billing.md`.
- The header goes first, between `---` lines, with three keys and no others (a typo such as `source:` is an error):
  `title` (up to 120 characters), `summary` (up to 600: what the document covers, in a sentence) and `sources` (up to 50
  globs, each up to 200 characters, as a list under `sources:` or `[a, b]`).
- `sources` are the globs of the code that document explains: when a change touches them, `guide stale` asks for the
  document. Write only paths that exist, and prefer the folders of the area (`app/billing/**`) over one glob for
  everything. Never invent a route or a path.
- **Section names must tell apart across documents** ("Billing: invoices", not "Overview" in two of them): the chat's
  search takes the first three matches of a name. `guide check` warns about a repeated name (`nombres_repetidos`, without
  regard to case or accents): rename until it does not.
- The rules of [`guia.md`](guia.md) stay: only what a user sees and what exists in the code; "Common problems" only from
  something visible (an issue, a TODO, the README) or dictated by the person; no `<` or `>` anywhere; business rules (deadlines,
  refunds, prices) only if the person dictates them: ask, never deduce them.

## 4. Migrating from the single file

When the repo has `.supcoflow/guide.md` (or the old `guia.md`) and no folder:

1. Run `supcoflow guide check --json` first and write down the number of `secciones`.
2. Split the file by area into `.supcoflow/knowledge/<area>.md`. **Do not change the content**: each section moves whole,
   word for word, with the same links, contacts, routes and problems; nothing is merged, dropped, reworded or added except the
   header of each new document (section 3), which is the only new text. The `# ` title of the old file is dropped (it was
   ignored).
3. Run `supcoflow guide check --json`: it must say the same number of `secciones`, now in N `documentos`. If it differs,
   find what you moved wrong and fix it before showing anything.
4. Tell the person: "The folder takes precedence now: `.supcoflow/guide.md` is ignored while there is at least one document in
   it." Do not delete or rename their old file: offer to remove it in a later commit and let them do it.

## 5. Write or update

- Change only the documents the change needs, and in each only what a user sees now: do not rewrite the rest.
- A new area is a new document, with its header.
- If a document's header has `sources` that no longer match anything (a moved or deleted path), fix the globs.
- Everything else (the checks, the permissions) as in the sections below.

## 6. Check, then show

1. `supcoflow guide check --json`, until it exits 0. Every error comes with its `documento` and line; fix ALL of them (the
   table of [`guia.md`](guia.md) says how; the reasons of the folder are in the table at the end of this file). Read `avisos`: a
   `nombres_repetidos` is fixed; `archivo_ignorado_por_la_carpeta` is expected when there is an old file.
2. `supcoflow guide stale --base origin/<rama> --json` (`<rama>` is `proyecto.rama` of `project show`, usually `main`). It reads
   only git and the clone, spends nothing and asks nothing of the engine. Every warning is for you to act on or to say:
   - A document that explains code this change touched and you did not touch: read the change and update it if a user
     would see something different; if not, say why you left it.
   - `fuente_sin_archivos` (a pattern matches nothing), `mapa_vacio`, `mapa_roto`: fix the headers.
   - `cobertura_quitada` (a document or a `sources` pattern was removed, and the change touches code it covered that no
     document covers now): give that code back to a document's `sources`, or tell the person why it no longer needs one.
   - `cambio_cosmetico` (a document changed only in whitespace): it is not an update; change what a user would see, or undo it.
   - `fuera_del_mapa` (a note, not a warning): new files that no `sources` covers; if they are something a user sees, offer to add
     them to a document's `sources`.
   - `no_se_pudo_comparar` (the base is missing or the clone is shallow): it did NOT compare. Say so, with its message; never
     say the guide is up to date. Do not bring the base yourself: tell them the command that does it.
   It only knows what was touched, not whether the text is true: say so.
3. Show the person the diff of `.supcoflow/knowledge/` (`git diff -- .supcoflow/knowledge` and, for new files, their whole
   text), and the results of the two commands in a line each.

## 7. The commit, and never the publication

1. In ONE message: the diff, the exact commit message, and the question about their business: "Anything about your business
   the chat must know: deadlines, refunds, prices? I won't guess them from the code." With the commit question inside it:
   "I'll leave it in a local commit on `<branch>`; I don't push it." If there is no branch (detached HEAD), recommend not
   committing. This change usually rides on the branch of the code change that caused it, and that is right: do not ask them
   to move.
2. The yes comes BEFORE the commit. With a yes: `git add -- <each file of the folder you wrote>` and
   `git commit -m "<message>" -- <the same files>`, with EXACTLY the message you showed and nothing added (no `Co-Authored-By` or other
   attribution; if your environment adds one, put it in the message you show). Never `git add .` or `git commit -a`. Check with
   `git show --name-only HEAD` that it touches only those files. If they answer with rules, add them to the guide, check again and
   show the diff again before the commit.
3. **This row does not publish, push, change branch or create one.** Close with one line: "The chat still uses the published guide: this
   goes live when it is merged on `<rama>` and published. Pushing is up to you."
4. Publishing is a separate request, never part of this row. How the guide goes live, only if asked: `supcoflow guide publish --from-github --json`, on the project's main branch after the
   merge (if it exits 5 `guia_no_subida` or `guia_distinta`, that branch does not have it yet: say so, do not publish another way),
   or the project's CI step, which does the same after the merge. Never from another branch, not even with their yes, and never
   `supcoflow guide publish --json` here: say "The guide goes live when it is merged on `<rama>`; the pull request is
   the review." and propose merging.

## 8. The rule for the project's instructions file (only with permission)

Once, after the first commit of the folder, offer to add ONE line to the instructions file the project already has
(`AGENTS.md` or `CLAUDE.md`; if it has neither, ask whether to create one): "If you change something a user can see, update
`.supcoflow/knowledge/` in the same change." Write it in the language of that file. Show the one-line diff and add nothing
else (no heading, no explanation). Only with their yes; it goes in the commit of section 7 or in its own, as they choose. If
they say no, do not offer again. It is a proposal, not something that is known to work: say that the guide only stays up to
date if the agent that reads the file follows it, and that `guide stale` is what catches it when it does not.

## 9. Reasons of the folder

| Reason (`motivo`) | What to do |
|---|---|
| `a «sources» entry is empty` | Write a glob after the `- `, or delete the line. |
| `a «sources» entry is over 200 characters` | Shorten that glob. |
| `a «sources» entry opens a quote it never closes` | Close the quote, or take it out. |
| `at most 50 «sources» per document` | Use folder globs (`app/billing/**`) instead of one per file. |
| `the document name isn't a valid .md file name` | Rename the file: a plain name that ends in `.md`, with no slashes. |
| `the folder has more than 60 sections in total (all the documents count together)` | Merge similar sections until the whole set has 60 or fewer. |
| `the folder has no documents` | Add at least one `.md` to `.supcoflow/knowledge/`. |
| `the header key «…» is empty` | Give that key a value, or delete the line. |
| `the header key «…» is over … characters` | Shorten that value: `title` up to 120, `summary` up to 600. |
| `the header key «…» is repeated` | Keep the key once. |
| `the header lines are «key: value» (title, summary, sources)` | Write each header line as `key: value`. |
| `the header opened with --- is never closed` | Close the header with a `---` line. |
| `the «sources» list opened with [ is never closed` | Close the list with `]`. |
| `two documents have the same name` | Rename one of them. |
| `unknown header key «…» (allowed: title, summary, sources)` | Use only `title`, `summary` and `sources`; look for a typo. |
