# Reign — Writing Studio

> A writing studio for people who write books. LibreOffice-grade editing, Obsidian-grade graph thinking, and a Novel view that typesets your manuscript as a book — in the browser or as a native desktop app.

```
◈  Edit  ·  Preview  ·  Novel  ·  Graph
Dark  ·  AMOLED  ·  Light  ·  Bloom (pink-cyan)
[[Wikilinks]]  ·  ![[Transclusion]]  ·  #tags  ·  /slash commands  ·  Ctrl+K palette
```

---

## Run in the browser (no install)

```bash
# from the repo root
python3 -m http.server 5173
# open http://localhost:5173
```

The app is a static site — `index.html` + `src/` — no build step. Data persists to `localStorage` (and to disk when running as a desktop app).

## Desktop app

### Quick dev run

```bash
npm install
npm run dev          # opens the Electron window
# or: npm start
```

### Build installers — Linux (Arch/Debian/Fedora)

```bash
bash scripts/build.sh
# outputs in dist/:
#   Reign-0.1.0.AppImage   ← double-click / chmod +x and run
#   Reign_0.1.0_amd64.deb  ← sudo dpkg -i dist/*.deb
```

### Build installers — Windows

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build.ps1
# outputs in dist\:
#   Reign Setup 0.1.0.exe           ← NSIS installer
#   Reign-0.1.0-portable.exe        ← portable, no install
```

You can also build from any OS with Node 18+:

```bash
npm run dist:linux   # AppImage + deb
npm run dist:win     # NSIS + portable (needs wine on Linux for full code-sign)
npm run dist:all     # both
```

Data on desktop is stored in the OS user-data dir (`~/.config/Reign/` on Linux, `%APPDATA%/Reign` on Windows) as `reign-data.json`, and mirrored to `localStorage`.

---

## Project layout

```
index.html                 shell — titlebar, toolbar, sidebars, statusbar
src/styles/
  themes.css               4 themes via [data-theme] (dark/amoled/light/bloom)
  layout.css               titlebar, toolbar, sidebars, file tree, statusbar
  editor.css               editor, preview, novel, graph, palette, find bar
src/js/
  core/store.js            persistence + doc CRUD (localStorage + Electron bridge)
  core/utils.js            esc, slug, countWords, parseWikilinks, toast …
  core/snapshots.js        timed snapshots + daily streak
  editor/editor.js         contenteditable wiring + renderFileTree
  editor/menus.js          [[ wikilink autocomplete + / slash menu
  graph/graph.js           force-directed canvas (pan/zoom/drag, filters, export PNG, local/all)
  views/preview.js         wikilink + transclusion + tag rendering
  views/novel.js           paged typeset view (drop caps, narrow/wide, page numbers)
  ui/stats.js              word counts, outline, cards, backlinks, session timer
  ui/toolbar.js            toolbar wiring + export (pdf/html/md/txt)
  ui/palette.js            Ctrl+K command palette
  ui/find.js               find & replace bar
  ui/search.js             left-sidebar search (regex, case)
  main.js                  boot glue
electron/
  main.js                  BrowserWindow + IPC (load/save/pickFile)
  preload.js               contextBridge → window.reignAPI
assets/icons/              app icons (generated)
vault/                     (ignored) local user data
scripts/
  build.sh                 Linux build (AppImage + deb)
  build.ps1                Windows build (NSIS + portable)
style.css / app.js         legacy monoliths — kept for reference; the app loads from src/
```

---

## Features

- **Editor** — ruler, paragraph styles (H1/H2/H3/quote/code), fonts, sizes, bold/italic/underline/strike, alignment, lists, blockquote, inline code, links, images, tables, horizontal rules. Focus/typewriter/zen modes. Syntax highlight toggle. Zoom. Undo/redo. Find & replace.
- **Graph** — force-directed canvas of notes linked by `[[wikilinks]]`. Pan/zoom/drag, labels/orphans toggle, local vs all, text filter (highlights), fit/center/reset, export PNG, hover card.
- **Novel** — paged manuscript view with drop caps, narrow/wide, paged vs scroll, per-page numbering.
- **Inspector** — word/char/reading/paragraph counts, writing aids, export (PDF via print / HTML / Markdown / plain text), `reign://slug` reference ID (copy), transclusion `![[Title]]`.
- **Links** — outgoing, backlinks, unlinked mentions. Click to open or create missing notes.
- **Left sidebar** — Files (grouped by folder) + Outline (H1/H2/H3) + Cards (corkboard) + Search (regex/case) + daily goal with streak bar + snapshots (every 60 s, restore).
- **Palette / shortcuts** — `Ctrl+K` palette, `Ctrl+1…4` views, `Ctrl+B/I/U/S/K/F/N`, `[[` and `/` triggers.
- **Themes** — dark, AMOLED, light, Bloom. Persisted.

---

## Releasing on GitHub

1. Update `version` in `package.json` and tag the commit (`git tag v0.1.0 && git push --tags`).
2. Build locally or via CI — the workflow at `.github/workflows/release.yml` builds Linux + Windows artifacts on tag push and attaches them to the GitHub Release.
3. Users download the AppImage/deb (Linux) or Setup/portable exe (Windows) from the Release.

---

## License

MIT — see `LICENSE`.
