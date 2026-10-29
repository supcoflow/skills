# The guide: `.supcoflow/guide.md`

It is what the chat knows about the app. It goes at the root of the repo, in `.supcoflow/guide.md`, in UTF-8 and up to
64 KB. One section per screen or function a user uses (from 1 to 60).

The old name, `.supcoflow/guia.md`, still works: the terminal reads it only when `guide.md` does not exist, and says
that `.supcoflow/guia.md` is the old name and should be renamed to `guide.md`. If both exist, `guide.md` wins and
`guia.md` is ignored (the terminal says so). Never rename or delete the person's file; offer it and let them do it.

## The format

```markdown
# My App guide

## Invoices
What it's for: View and pay the month's invoices.
What users can do: Download the PDF, pay by card
and see the history.
Where: /invoices
Common problems:
- The Pay button does nothing with debit cards.
- The PDF comes out blank in Safari.
```

- `# My App guide` (the title) is optional and is ignored.
- A section (`## Name`) per screen or function: from 1 to 60; the name, from 1 to 120 characters.
- "What it's for:" and "What users can do:" are required, from 1 to 600 characters each; they can continue on the
  lines below (as "What users can do:" does in the block).
- "Common problems:" is optional: up to 10, each from 1 to 300 characters.
- "Where:" is optional: the route of the app where that section lives (`/settings/billing`). It starts with `/`, up to
  200 characters, no spaces and no `<` or `>`. Write it only if that route exists in the code. The chat uses it to give the user a link.
- The labels are recognized at the start of the line, in any case. The Spanish labels of the old guides are still
  accepted; write the English ones.
- A line that is not a label continues the previous field (joined with a space). Problems go one per line, with "- " at
  the start; a line without "- " continues the previous problem.
- It is an error: text before the first section that is not the `# ` title; text in a section before its first label;
  a repeated label in the same section; any line with `<` or `>` (the guide is untrusted content and those characters
  are not allowed: rewrite the sentence without them); more than 64 KB.
- Only what a user sees. No business rules that were not dictated by the person.

## The example guide

This one passes `guide check`; imitate its shape.

# Guide to My Store

## Catalog
What it's for: Show the available products and let people search them by name or category.
What users can do: Search products, filter by category and open each product's page.
Common problems:
- Search returns nothing even though the product exists.
- The product page images don't load.
Where: /catalog

## Cart
What it's for: Collect the products the person wants to buy before paying.
What users can do: Add and remove products, change quantities and go to payment.
Common problems:
- The cart is empty after signing in.
- The Pay button does nothing.
Where: /cart

## My account
What it's for: Let the person see and edit their personal data and past orders.
What users can do: Change the name and email, and check the status of their orders.

## Reading the errors of `guide check`

`supcoflow guide check --json` exits 0 if the guide is well formed. If not, it exits 3 with `"error":"guia_mal_armada"`
and a list `errores` of `{ "linea": <number>, "motivo": "<text>" }` (up to 20, per line, in order). In text it comes
out as `line N: reason`. Fix ALL the lines of the list and run it again; repeat until it exits 0.

| Reason (`motivo`) | What to do |
|---|---|
| `a common problem is over 300 characters` | Shorten the text of that line. |
| `at most 10 common problems per section` | Keep the 10 most important. |
| `common problems go with «- » at the start of each line` | Start each problem with «- ». |
| `text in the section that doesn't belong to any label` | Put a label before that text, or delete it. |
| `the guide can't contain < or >` | Rewrite that line without `<` or `>`. |
| `the guide doesn't have the expected shape` | Check the whole format against the example. |
| `the guide has more than 60 sections` | Merge similar screens until you have 60 or fewer. |
| `the guide has no sections («## Name»)` | Add at least one section that starts with `## `. |
| `the label … is repeated in the section` | Keep the label only once in that section. |
| `the name is over 120 characters` | Put a short name after `## `. |
| `there is text before the first section («## Name»)` | Delete that text or move it inside a section; only the `# ` title can go before. |
| `«What it's for:» is missing in the section «X»` | Add that label with text to section X (the reported line is the `## X` one). |
| `«What users can do:» is missing in the section «X»` | Add that label with text to section X (the reported line is the `## X` one). |
| `«Where:» can't contain spaces` | Write the route without spaces. |
| `«Where:» is over 200 characters` | Shorten the route. |
| `«Where:» must be a path that starts with /` | Write a real route of the app, like `/settings/billing`, or delete the line. |
| `… is over 600 characters` | Shorten the text of that line. |

Other codes of `guide check`, all with exit 3: `falta_guia` (there is no `.supcoflow/guide.md` at the root of the repo:
write it), `guia_muy_grande` (over 64 KB: shorten it) and `guia_ilegible` (it cannot be read, e.g. invalid UTF-8: save
it as UTF-8). With exit 4 `sin_proyecto`, the project is missing: go back to step 2 of the order.
