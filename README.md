# Rich Text Editor

A modern, offline-first, multi-document rich text editor that runs entirely in your browser. No accounts, no servers, no telemetry — your documents live in your browser's IndexedDB and never leave your device.

![Editor Preview](rotate.png)

> **Live demo:** https://vasoyasagar.github.io/editor/

---

## ✨ Highlights

- **Multi-document workspace** with a searchable sidebar, pin / rename / delete, and a live auto-built outline
- **Block & inline formatting** — headings, blockquote, code blocks, inline code, highlight, links, lists, alignment
- **Slash commands** (`/`) and Markdown shortcuts (`# `, `## `, `> `, `- `, `1. `, ``` ``` ```)
- **Checklists** — `- [ ]` / `- [x] ` for clickable, persistable task lists
- **Tables** with a floating toolbar to add/remove rows & columns and delete the table
- **Find & replace** with match-case and live count
- **Floating bubble toolbar** when text is selected
- **Five themes** — Light, Dark, Sepia, Solarized Light, Nord — plus per-editor font / font-size / line-height
- **Focus mode** — hides UI chrome for distraction-free writing
- **Drag-and-drop import** — drop a `.html`, `.txt`, or `.md` file to open it as a new document
- **File System Access API** — true Save As / Open with the picker (with download / `<input type="file">` fallback)
- **Storage insights** — live quota ring in the status bar and per-document size breakdown in Settings
- **Toasts, save indicator, reading time, word/char count, ARIA labels, reduced-motion support**
- **100% offline-capable, zero runtime dependencies** beyond a tiny IndexedDB helper loaded from a CDN

---

## 🚀 Quick start

### Online
Just open the [live demo](https://vasoyasagar.github.io/editor/).

### Locally
The app uses ES modules, so it needs to be served over HTTP (opening `editor.html` from `file://` will be blocked by the browser).

```bash
# Clone
git clone https://github.com/vasoyasagar/editor.git
cd editor

# Serve (any static server works)
python -m http.server 8080
# then visit http://localhost:8080/editor.html
```

Other quick options: `npx serve`, `npx http-server`, or VS Code's *Live Server* extension.

---

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/⌘ + N` | New document |
| `Ctrl/⌘ + O` | Open file (imports as a new document) |
| `Ctrl/⌘ + S` | Download / Save As |
| `Ctrl/⌘ + B` / `I` | Bold / Italic |
| `Ctrl/⌘ + E` | Inline code |
| `Ctrl/⌘ + H` | Highlight |
| `Ctrl/⌘ + K` | Insert / edit link |
| `Ctrl/⌘ + F` | Find & replace |
| `Ctrl/⌘ + \` | Focus mode |
| `Ctrl/⌘ + ,` | Settings |
| `Ctrl/⌘ + Shift + E` | Toggle documents sidebar |
| `Ctrl/⌘ + Shift + L` | Toggle outline sidebar |
| `Ctrl/⌘ + Shift + D` | Toggle dark mode |
| `/` | Slash menu (at start of line) |
| `?` | Show all shortcuts |
| `Esc` | Close dialog / panel / exit focus |

### Markdown shortcuts (auto-convert on space)

| Type | Becomes |
| --- | --- |
| `# ` | Heading 1 |
| `## ` | Heading 2 |
| `### ` | Heading 3 |
| `> ` | Blockquote |
| `- ` / `* ` | Bullet list |
| `1. ` | Numbered list |
| ` ``` ` | Code block |
| `[ ] ` / `[x] ` inside a bullet | Task item |

### Slash commands

`/h1` `/h2` `/h3` `/p` `/quote` `/code` `/ul` `/ol` `/task` `/table` `/date` `/hr`

`/date` inserts today's date as an H1 in `dd/MM/yyyy` format.

---

## 🗂️ Workspace

- **Documents sidebar (left)** — create, search, pin, rename (double-click or ✏️), delete (🗑️). Pinned docs sort to the top, then by most recent edit.
- **Outline sidebar (right)** — auto-generated from `<h1>`/`<h2>`/`<h3>`. Click any heading to scroll to it.
- Both sidebars toggle independently and remember state across reloads. On narrow screens they become full-screen drawers.

---

## ⚙️ Settings

Open with `Ctrl + ,` or the ⚙️ button.

- **Theme**: Light / Dark / Sepia / Solarized Light / Nord
- **Editor font**: SUSE Mono · Inter · Lora · JetBrains Mono · Georgia · System UI
- **Font size**: 12 – 28 px
- **Line height**: 1.2 – 2.2
- **Spellcheck** on / off
- **Storage usage** ring + per-document size breakdown (click any doc to jump to it)
- **Reset** to defaults · **Wipe all data** (with confirmation)

---

## 🛡️ Privacy & data

- All documents are stored locally in the browser via **IndexedDB** (`idb-keyval`).
- A small one-time migration moves any legacy `localStorage` content into IndexedDB, and a second migration upgrades the old single-document store into the multi-document model.
- Nothing is sent anywhere. There are no analytics, no accounts, and no network requests after the initial page load (fonts + the IndexedDB helper are CDN-cached).
- Use **Wipe all data** in Settings to completely reset.

---

## 🧱 Tech stack

- **Vanilla HTML/CSS/JS** with ES modules — no build step
- **[`idb-keyval`](https://github.com/jakearchibald/idb-keyval)** for IndexedDB
- **File System Access API** for native open/save dialogs (with `<input type="file">` and Blob+anchor fallbacks)
- **`contenteditable` + `Range`/`Selection` APIs** for rich editing
- **CSS variables** for theming and per-editor typography
- **Google Fonts** for SUSE Mono, Inter, Lora, and JetBrains Mono

### Project layout

```
editor/
├── editor.html     # Main app shell
├── styles.css      # All styling (themes, layout, components)
├── editor.js       # All app logic (multi-doc model, editing, UI)
├── index.html      # Landing redirect
├── rotate.png      # Logo / favicon
├── README.md
└── LICENSE
```

### Browser support

Modern Chromium, Firefox, Safari, and Edge (latest two versions). The File System Access API is Chromium-only; other browsers automatically fall back to standard download / file-input behavior.

---

## 🛣️ Roadmap

Planned (Phase 4 — partly landed):

- ✅ Checklists, tables, storage quota ring, per-doc size breakdown
- ⏳ Export menu (HTML / Markdown / TXT / PDF)
- ⏳ Trash bin & per-document version history
- ⏳ Command palette (`Ctrl + P`)
- ⏳ Pomodoro timer, word-goal tracker, read-aloud
- ⏳ Split-view Markdown preview
- ⏳ PWA install + offline service worker
- ⏳ Optional GitHub Gist sync / AI assist (BYO key)

---

## 🤝 Contributing

1. Fork the repo
2. `git checkout -b feature/your-feature`
3. Commit & push
4. Open a Pull Request

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/vasoyasagar/editor/issues).

---

## 📄 License

[MIT](LICENSE) © [vasoyasagar](https://github.com/vasoyasagar)

---

<div align="center">

[🌟 Star this repo](https://github.com/vasoyasagar/editor) · [🐛 Report issues](https://github.com/vasoyasagar/editor/issues) · [💡 Request features](https://github.com/vasoyasagar/editor/issues/new)

*Beautiful, fast, accessible text editing — entirely in your browser.*

</div>
