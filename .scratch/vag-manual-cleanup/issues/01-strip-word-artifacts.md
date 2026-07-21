Status: ready-for-agent

# Strip MS Word HTML export artifacts from the VAG-COM manual

## Background

`public/pdf/VAG/VagCom-Manual/` is a legacy VAG-COM diagnostics manual, originally
exported from MS Word to HTML around 2006, then mirrored with Teleport Pro. It's
served as-is on the live site (linked from `/diagnosis/vag-com/` and directly at
`/pdf/VAG/VagCom-Manual/manual/main_screen.html`). Over previous sessions we already:

- fixed the missing `style.css` (was pointing at absolute `/style.css` which doesn't
  exist on this site)
- removed all Teleport Pro `javascript:if(confirm(...))` popup wrappers (both the
  literal-space and `%20`-encoded variants — check both when grepping)
- fixed/removed dead links to the old `motodok.com/vag-com/*` site structure
- removed `target="_blank"` from same-site links (kept it for genuinely external domains)
- gutted `VAG-COM__Label_files.htm`, which was a full Yahoo Groups page mirror (ads,
  nav chrome, tracking scripts) down to just the real message content
- decoded ~21000 numeric HTML entities (`&#1101;` etc.) back to real UTF-8 Cyrillic
  characters

What's left: the actual MS Word export cruft. It's cosmetically ugly but currently
harmless (browsers ignore unknown attributes/tags), so this is a cleanliness pass,
not a bug fix.

## Scope — files to touch

Everything under `public/pdf/VAG/VagCom-Manual/`, specifically these 18 files
currently contain Word artifacts (re-verify with the grep below before starting,
in case new content was added since):

```
public/pdf/VAG/VagCom-Manual/manual.htm
public/pdf/VAG/VagCom-Manual/manual/about_screen.html
public/pdf/VAG/VagCom-Manual/manual/activation.html
public/pdf/VAG/VagCom-Manual/manual/adaptation_screen.html
public/pdf/VAG/VagCom-Manual/manual/b-settings.html
public/pdf/VAG/VagCom-Manual/manual/dtc_screen.html
public/pdf/VAG/VagCom-Manual/manual/login_screen.html
public/pdf/VAG/VagCom-Manual/manual/m-blocks.html
public/pdf/VAG/VagCom-Manual/manual/main_screen.html
public/pdf/VAG/VagCom-Manual/manual/obd-2.html
public/pdf/VAG/VagCom-Manual/manual/open_screen.html
public/pdf/VAG/VagCom-Manual/manual/option_screen.html
public/pdf/VAG/VagCom-Manual/manual/out_test.html
public/pdf/VAG/VagCom-Manual/manual/readiness.html
public/pdf/VAG/VagCom-Manual/manual/recode_screen.html
public/pdf/VAG/VagCom-Manual/manual/scm_screen.html
public/pdf/VAG/VagCom-Manual/manual/scm2_screen.html
public/pdf/VAG/VagCom-Manual/manual/single_screen.html
```

Verify current scope with:
```
grep -rl "mso-\|MsoNormal\|class=GramE\|class=SpellE\|<o:p>\|_x0000_\|MicrosoftOfficeMap\|<!\[if" public/pdf/VAG
```

Do NOT touch anything under `old/` — that's a reference-only legacy archive, never edited.

## What to remove

1. **`mso-*` CSS properties inside `style='...'` attributes.**
   These are mixed in with real CSS in the same attribute, e.g.:
   `style='font-family:Arial; mso-ansi-language:EN-US'` → `style='font-family:Arial'`.
   Strip only the `mso-*` declarations (and `mso-*` is always the property name before
   the colon — e.g. `mso-ansi-language`, `mso-layout-grid-align`, `mso-yfti-irow`,
   `mso-border-alt`, `mso-bidi-font-weight`, `mso-padding-alt`, `mso-cellspacing`,
   `mso-special-character`, `mso-bidi-font-style`, etc. — there's no fixed list, match
   the pattern `mso-[a-z-]+\s*:\s*[^;'"]*` generically), not real properties like
   `font-family`, `color`, `font-size`, `text-align`, `border`, `width`.
   - If stripping leaves an empty `style=''`, remove the whole `style=""` attribute.
   - Clean up leftover `; ;` or leading/trailing `;` left behind after removing a
     declaration from the middle/end of the list.

2. **`class=GramE` and `class=SpellE` attributes.**
   These are Word's grammar/spell-check markup on `<span>` tags, e.g.
   `<span class=GramE>текст</span>`. In every case checked so far the span has no
   other purpose and no CSS rule targets `.GramE`/`.SpellE` in `style.css` (confirm
   this — `grep -n "GramE\|SpellE" public/pdf/VAG/VagCom-Manual/manual/style.css`
   should return nothing). Remove the `class=GramE`/`class=SpellE` attribute. If the
   span has no other attributes left, you can either leave `<span>...</span>` as-is
   (harmless) or unwrap it — unwrapping is preferred for cleanliness but not required;
   don't unwrap if it's nested awkwardly or you're not sure the span is otherwise
   inert.

3. **`<o:p>` and `</o:p>` tags.**
   Word's proprietary "empty paragraph" marker, invalid HTML, ~508 occurrences.
   Remove both the opening and closing tag. Some wrap only `&nbsp;` (e.g.
   `<o:p>&nbsp;</o:p>`) — when the tag is removed and nothing else is in that `<p>`,
   it's fine to leave the bare `&nbsp;` or the now-empty text node, don't over-engineer
   this, just strip the `<o:p>`/`</o:p>` tags themselves.

4. **`id="_x0000_i####"` attributes on `<img>` tags.**
   Auto-generated Word bookmark IDs, not referenced by anything (confirm with
   `grep -rn '_x0000_i[0-9]*' public/pdf/VAG` — the only other place `_x0000_*` shows
   up should be as the `id=` declaration itself, never as a `href="#..."` or
   `usemap="#..."` target). Safe to remove entirely.

5. **`<![if !supportLineBreakNewLine]>` / `<![endif]>` markers.**
   Only in `manual.htm` (line ~74-75) and `b-settings.html` (line ~174-175). Pattern:
   ```
   <![if !supportLineBreakNewLine]><br style='mso-special-character:line-break'>
   <![endif]>
   ```
   Replace with a plain `<br>` (keep the line break, drop the Word conditional wrapper
   and the `mso-special-character` style per rule 1 above).

## What NOT to touch

- **`MicrosoftOfficeMap0`/`MicrosoftOfficeMap1` etc. `<map name=...>` and
  `usemap="#..."` attributes.** These are real, functioning image maps (clickable
  hotspots on UI screenshots) — leave the name and the `<area>` tags alone. Only clean
  up `mso-*` styles if any appear on the `<area>` tags themselves, don't touch the
  `shape=`/`coords=`/`href=`/`usemap=` attributes.
- **`tppabs="..."` attributes.** Leftover Teleport Pro metadata recording the original
  absolute URL of a mirrored resource. Inert (browsers ignore unknown attributes),
  out of scope for this ticket — a previous session deliberately left these alone.
- Anything under `old/`.
- Don't touch link hrefs/targets — that cleanup is already done (separate prior work).

## Verification

After editing each file (or as a final pass over all of them):

1. Confirm no more artifacts remain:
   ```
   grep -rl "mso-\|MsoNormal\|class=GramE\|class=SpellE\|<o:p>\|_x0000_\|<!\[if" public/pdf/VAG
   ```
   should return nothing (this pattern deliberately excludes `MicrosoftOfficeMap`,
   which is expected to remain).

2. Confirm `<a>` tags are still balanced (this bit us before — a previous session's
   edits accidentally left unclosed tags once and had to re-check):
   ```python
   from html.parser import HTMLParser
   import os

   class Checker(HTMLParser):
       def __init__(self):
           super().__init__()
           self.stack = []
       def handle_starttag(self, tag, attrs):
           if tag not in ('area','img','br','hr','meta','link','input'):
               self.stack.append(tag)
       def handle_endtag(self, tag):
           if tag in self.stack:
               while self.stack and self.stack[-1] != tag:
                   self.stack.pop()
               if self.stack:
                   self.stack.pop()

   for root, dirs, files in os.walk('public/pdf/VAG'):
       for fn in files:
           if fn.lower().endswith(('.html', '.htm')):
               path = os.path.join(root, fn)
               text = open(path, encoding='utf-8').read()
               p = Checker()
               p.feed(text)
               unclosed = p.stack.count('a')
               if unclosed:
                   print(path, "unclosed <a>:", unclosed)
   ```
   Should print nothing.

3. Confirm image maps still have the same number of `<area>` tags as before (spot
   check `main_screen.html`, `dtc_screen.html`, `activation.html` — these have
   `<map name=MicrosoftOfficeMap0>` blocks) — `git diff` on those files should show
   `shape=`/`coords=`/`href=` untouched, only `style=`/attribute removal.

4. Rebuild so `dist/` matches: `pnpm run build` from repo root.

5. Do NOT commit or push — per project convention (`docs/adr/0002-git-review-over-sveltia-cms-for-ai-content.md`),
   the user reviews and commits/pushes themselves.

## Notes for whoever picks this up

This is mechanical, repetitive, regex-driven work across 18 structurally-similar
files — a smaller/cheaper model should be able to do it fine as long as it follows
the "what NOT to touch" list carefully and runs the verification steps at the end
rather than trusting the edit blind.
