# Build the chat with the app's own components

Supcoflow is not a design. It brings the engine (the assistant, the guide, the reports, the limits), a core to talk to
it, a contract that says what the interface has to show and a test bench to check it. **Everything you see is the
app's**: its components, its icons, its styles, its words. You write it, in the app's repo, as any other code of the app.

If the app has its own instructions for coding agents (`AGENTS.md`, `CLAUDE.md`), follow them for how to write code in the
app; they never change what point 5 of SKILL.md makes you ask, what spends, or what the contract requires.

## When this path applies

Only for **Next.js (App Router)**, and only when `supcoflow widget --json` brings `interfaz_propia` and its `estado` is
`disponible` (point 10 of SKILL.md decides it). Otherwise it is the widget. Pages Router and other stacks (Vite, Remix,
Vue…): not tested here; the engine is the same, but say so to the person and do not improvise. A `sin_publicar` means the
package is not on npm yet: the install would fail, so it is the widget.

## What you get from the terminal, and what is yours

`interfaz_propia` of `supcoflow widget --json` is data, not code to paste:

| Field | What it is |
|---|---|
| `paquete`, `version`, `instalar` | The package (`@supcoflow/chat`) and its exact version, and the install command: translate it to the app's manager |
| `tenant_id`, `project_id`, `backend_url`, `opciones_del_nucleo` | The ids and the backend, as the engine has them: put them once, in one constant (or one environment variable) of the interface, copied from the JSON the terminal gave you and never typed from memory or invented |
| `csp` | The line for `connect-src` (point 10 of SKILL.md says how to add it) |
| `contrato` | `version`, and where the installed package carries the contract: `node_modules/@supcoflow/chat/contract.json` and `node_modules/@supcoflow/chat/docs/presentation-contract.md`, so it is read offline once installed |
| `entradas`, `documentos` | `@supcoflow/chat/core`, `/react`, `/testing`, `/testing/server`, and the docs inside the package: `docs/core.md`, `docs/react.md`, `docs/testing.md`, `docs/conformance.md`, `docs/protocol-v1.md` |

| Supcoflow brings | The app decides (and it stays in its repo) |
|---|---|
| The engine; `createSupportChat` and `useSupportChat`: connection, saved conversation, retries, uploads, the rule of the "yes" | The trigger (a header button, a menu item, a floating button, a help page, a shortcut) and what it opens (a side sheet, a modal, a page, a fixed panel) |
| The contract (`contract.json`) and the conformance checks | Components, icons, colors, typography, dark mode, animations |
| The fake backend, to see and to check every state | Where it lives in the app, the phone layout, the words of everything the interface says |

The package is installed at step 7 of SKILL.md (the app is touched only there), so the proposal of step 2 below is made from
the app's code and this file. Right after installing, read what the package carries, in this order: `node_modules/@supcoflow/chat/docs/presentation-contract.md`
(and `contract.json`), `docs/react.md`, `docs/core.md`. If the installed contract says something different from this file,
the contract wins: this file is a map of it, not a copy.

## The procedure

1. **Detect** the app's design system and how it is built (the table below), with your file and search tools.
2. **Propose and show before writing** (point 6 of SKILL.md): which trigger and where, which of the app's components and
   icons it reuses, which files it creates, which tools it offers, and whether it adds test packages. Wait for the yes. If what you read in the installed package changes the proposal (another file, another place for the
tests), say so and ask again before writing. Recommend the test packages: without them nothing checks the interface.
3. **Ask only what changes the result**: the second panel of point 5 of SKILL.md (how people open it, which evidence tools).
   Never colors, fonts or icons.
4. **Write** it with the app's own components; never add a component, icon or font library.
5. **Check** it: the conformance checks, the fake backend in a browser, and the manual list.
6. **Record** it: `supcoflow install record --skill <version> --shape own-interface --file <file> …` (point 10 of SKILL.md).

## 1. Detect

| Signal in the repo | What you do |
|---|---|
| `components.json` (shadcn), `@radix-ui/*`, `@mui/material`, `@chakra-ui/react`, `@mantine/core`, `antd`, `@headlessui/react`, `react-aria-components`, `@heroui/react`, `daisyui`, `react-bootstrap` | Use **those** components: button, side sheet or modal, text area, scroll area, avatar, badge, tooltip, toast |
| `lucide-react`, `@heroicons/react`, `@tabler/icons-react`, `react-icons`, `@phosphor-icons/react`, `@radix-ui/react-icons`, `@mui/icons-material`, `@fortawesome/*`, `@iconify/react`, or an `icons/` folder of the app's own | Use **that** icon library, never a second icon library. If the app has no icon library, draw them as inline SVG with a stroke like the app's, and never add one |
| Tailwind (v3 config or v4 `@theme`), CSS Modules, styled-components, emotion, vanilla-extract, Sass, CSS variables | Write the styles with **that same** system and **the same** tokens; no new fonts |
| `next-themes`, a `dark` class, `data-theme` | Respect the app's dark mode |
| `next-intl`, `react-i18next`, `lingui`, `formatjs` | The interface's texts go through the app's i18n, in the app's language |
| A top bar, `cmdk`, a help menu, side sheets that already exist | Propose the trigger there ("a Help button next to your avatar") instead of a floating bubble |

If the app has none of these, use plain elements styled with the app's own CSS and say so in the proposal. Reuse before
composing, compose before creating. The app's own tokens, never invented ones.

## 4. Write

The package carries a skeleton in `node_modules/@supcoflow/chat/examples/react/SupportChat.tsx` (and its README). It is a
skeleton, not a design: bare HTML elements with the points of the contract marked in comments. Read it, then write the
app's own interface. Never leave its bare elements in the app: every `<button>`, `<textarea>`, `<section>` and `<details>`
becomes the app's own component, and the trigger goes where the person chose.

Respect focus, the keyboard (Esc), `prefers-reduced-motion` and phones, with the app's own components where they already do it.

In Next.js (App Router):

- **The chat lives in the browser.** The file that calls `useSupportChat` starts with `"use client"`. Never create the chat
  while rendering and never at the top of a module: the hook creates it when the component mounts and destroys it when it
  unmounts, so it is safe in React's `StrictMode` and on the server.
- **Call the hook in a component that stays mounted as long as the chat should.** Closing your sheet or modal must not unmount it,
  or the conversation is lost. Put the component in the layout that covers the screens where people get stuck, and open
  and close the panel with the app's own state.
- **A layout is a server component.** Read the app's session there, the way it already does, and pass only serializable
  values as props (the fields the person accepted for `user`); no objects of the database, functions or classes.
- One chat per project and tab, and never the widget and the own interface together.

What the interface must keep (the contract, point by point; read `docs/presentation-contract.md` for the exact words):

| Point | What has to be on screen, never how it looks |
|---|---|
| P1 | Nothing, or a disabled trigger, until `available` is true |
| P2 | A visible line saying it is an automated assistant, in the app's language, before the first message |
| P3–P5 | What the person writes shows at once and is not lost; the assistant's text is complete (plain text or `parseAssistantText`; never `dangerouslySetInnerHTML`, never a link to another site, never an image from the text); a working indicator while `busy` and no text yet |
| P6 | The report as plain text, whole (`pendingQuestion.report`: title and body), with the two actions in the server's own words; `chat.confirmReport(question.id)` only from a press of the person on **that** confirmation (never automatic, never on a timer, never from typed text); both actions off while `busy`; which attachments go with it; if `confirmacion_no_vigente` arrives, say it was **not** sent |
| P7 | The options of a question and, if `allowsText`, a field; `answer(question.id, …)` |
| P8 | After a report: it was sent, the number if there is one, no more attachments, and a way to start another conversation (`newConversation()`); promise nothing |
| P9 | A text of the app's own for each error `code`, never show `error.message`; `retry()` if it is not terminal; a generic failure for an unknown code; never a button that asks for more budget |
| P10 | If it offers attachments: the status of each, no "remove" on one already uploaded, none after the report, `hideUi`/`showUi` when capturing and `ignore` when pointing |
| P11 | Never the name of the person; in `user` only what they accepted; never read, log or build the saved record |
| P12–P13 | One chat; usable with the keyboard, the focus goes to the message field when it opens, a live region announces the new messages |
| P14 | The conversation comes back: leave `resume` at `true` and never set `storage` to `"none"`. Wait for `ready` before showing an empty chat. Another conversation only when the person asks |
| P15 | A paste longer than `isLongPaste()` says shows as a short marker, expandable, and is sent whole |

Make the component testable: it takes the chat options (`backendUrl`, `fetch`, `storage`, `locale`, `user`) as optional props
that default to the app's own values, so the conformance test can inject the fake backend; and give every control a distinct
accessible name (an open panel with two buttons both named "Close" cannot be told apart by the checks or by a screen reader).

Options of the chat (`useSupportChat`): the `tenantId`, `projectId` and `backendUrl` of `interfaz_propia`; **Declare `locale`**
(the app's language: the words of the two report buttons and of the frame around the report come from Supcoflow, in that
language: Spanish, English or Portuguese, and English for any other); `user` with only the fields the person accepted
(`id`, `role`, `attributes`) and `autoContext` as point 5 of SKILL.md says; and `capabilities` as the person answered.
Everything else the interface says (errors, "working", the report card, the automated-assistant line) is yours to write,
through the app's i18n, in the app's language (if the app mixes languages, the one of its `<html lang>`). Declare only what a person can really do in it: the assistant invites to
attach or point only if you declared it.

On by default, unless the person said no: attach an image, screenshot, point at an element (each declared in `capabilities`
and shown only if `state.allows` lets it be taken; a screenshot only if `canCaptureScreen()`), reading the guide (say so
while `activity` says it), and the new conversation after a report (P8, always). Optional, only if asked: visible steps, the "answered" mark, start
suggestions, hooks with `onEvent`. Not asked for, so not built: no Supcoflow logo, name or link anywhere in the chat.

It does not exist: no thumbs up/down, and the list of past conversations (P16) does not apply yet: the server does not
support it. Do not build either, and do not promise them.

## 5. Check

Nothing here spends anything: the fake backend plays recorded conversations, and nothing touches production. **Never send a
real report to test.**

**a. The conformance checks** (the contract as tests; they run in CI with no browser):

1. Needs vitest, a DOM (happy-dom or jsdom) and Testing Library (`@testing-library/react`, which brings `@testing-library/dom`).
   If the app has no test runner, do not install one without the person's yes: it is a new dev dependency, and the proposal
   says so. Put the tests in the app's tests folder, or in `tests/support-chat/` if it has none (and say that its tsconfig
   will include them). If the project has no `test` script, add `"test": "vitest run"`, and a `vitest.config.ts` with the
   app's path alias if its imports use one; say both in the proposal. If the install hits a peer conflict, take the newest version of the runner the app's own dependencies
   allow; never force it and never raise the app's own dependencies without asking. Without it, check only with (b) and the manual list, and say the conformance checks were not run.
2. Copy `node_modules/@supcoflow/chat/conformance/checks.ts` and `chat.conformance.template.tsx` into the app's tests. Name the
   template `chat.conformance.test.tsx`. **Do not edit `checks.ts`.**
3. Adapt only the three places marked `ADAPT` in the template: the component to mount, the words of its controls (regular
   expressions in the app's language) and how it is mounted (render it as the app does, with the options the template
   gives it). If the app's sheet or modal renders in a portal, `root` is `document.body`, and `words.close` names the control that closes
   it when the trigger goes inert while it is open. Where the template says to put the signed-in person's name, wire it where the app reads who is signed in,
   and only then set `personWired` to `true`. An app with no session has nowhere to wire it: that check stays skipped, and you
   say so (the interface never sets a name).
4. Run the test file. Each failure names a point of the contract and what it expected: fix the interface, never the check.
   A skipped check is not a pass: say which checks were skipped and why (for example, offering only images skips the checks of
   pointing at an element: say what covers that instead, a manual look at the fake backend's `report-with-attachment`).
5. Say the manual list: what no test can tell is in `MANUAL` of `checks.ts` (for example, that the "automated assistant"
   line is in the app's language and easy to see, what a screen reader reads, `hideUi`/`showUi` while capturing).

**b. The fake backend, in a browser** (see each state without spending):

1. Start the fake server from the app's folder: `npx supcoflow-chat-fake report-confirmed` (or the equivalent of the app's
   manager; `npx supcoflow-chat-fake --list` lists the scenarios, and the server prints its address). The scenarios to look at:
   `report-confirmed`, `link-to-another-site`, `daily-cap-on-open`, `question-answered`.
2. Point the chat's `backendUrl` at that address **only in development**, with an environment variable read by the
   component; production keeps the `backend_url` of `interfaz_propia`. Never commit the fake server's address, and
   remove it when you finish.
3. Open the app, use the trigger, walk each scenario (the `script` of a scenario says what the person does), and take a screenshot
   of the real app for what is visual. Check at least: the report is whole and the "send" button asks nothing until pressed,
   a link to another site shows as text, a daily cap shows a message of the app's own and no button for more.
4. Stop the server when you finish. The site's origin (for example `http://localhost:3000`) only needs to be in the allowed
   sites for the real backend (`supcoflow sites add`), not for the fake one.

When capturing, `hideUi` must hide the whole interface, including any overlay or backdrop of the app's sheet or modal, and
`ignore` is its root. Say what you ran and what you did not: never "it works" about what you did not see work.

## 6. Record

`supcoflow install record --skill <version> --shape own-interface --file <file> --file <file> --json`, with every file you created for
the chat (the interface, its trigger, the conformance test) and the file that mounts it (the layout you edited), relative to the
repo root. The terminal writes the contract version from the installed package. Do not commit the
interface or the tests: they are the person's to review and commit (SKILL.md, point 10).

## Coming back later

The interface is the app's code: there are no files of ours to merge. When the person runs `/supcoflow go` again,
`supcoflow diagnose --json` compares the recorded contract version with the one the project declares today. A newer major
version of the contract is a new required point: say so, read the new contract, change the interface and run the conformance
checks again. A newer minor or patch only adds optional points: offer what is new and optional, and run the checks again.

## What not to do

- Copy a component with Supcoflow's own look into the app, or leave the skeleton's bare elements.
- Ask about colors, fonts or icons, run `supcoflow chat brand`, or add a Supcoflow logo, name or link.
- Add a component, icon or font library the app does not have.
- Put the rules of the chat in the interface: the "yes", the reconnection, the retries and the uploads live in the core.
- Let the interface edit, summarize or cut the report, call `confirmReport` by itself, or draw the assistant's text as HTML.
- Show `error.message`, or offer a way to ask for more budget.
- Mount the widget and the own interface together, or two chats of the same project.
- Send a real report to test, or leave the fake server's address in what is committed.
