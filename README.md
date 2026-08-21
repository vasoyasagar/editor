# Markdown Editor

An offline-first, multi-document Markdown editor with AI-powered rewriting. Built with React 19, MDXEditor, and Zustand. All data stays in your browser via IndexedDB.

**Live:** [vasoyasagar.github.io/editor](https://vasoyasagar.github.io/editor/)

## Features

- **WYSIWYG Markdown editing** — headings, bold, italic, underline, strikethrough, lists, task lists, tables, code blocks, blockquotes, images, links, frontmatter
- **Multi-document management** — create, rename, pin, delete, search documents
- **Syntax-highlighted code blocks** — CodeMirror with 12+ languages
- **Diff / Source mode** — toggle between rich text, raw markdown, and diff view
- **AI Rewriter** — select text and rewrite in any tone using Gemini AI
- **5 themes** — Light, Dark, Sepia, Solarized, Nord
- **Customizable typography** — font family, size, line height
- **Autosave** — debounced persistence to IndexedDB
- **Import / Export** — import `.md` files, export as `.md` download
- **Keyboard shortcuts** — full set of shortcuts for power users
- **Responsive** — works on desktop and mobile

## AI Rewriter

Select any text and use AI to transform it. Three ways to access:

| Method | How |
|---|---|
| **Toolbar** | Click `✨ AI` button → pick a style |
| **Right-click** | Select text → right-click → pick from menu |
| **Shortcut** | Select text → `Ctrl+Shift+G` for instant grammar fix |

### Styles

| Style | What it does |
|---|---|
| ✏️ Fix Grammar | Fix spelling, grammar & punctuation |
| 👔 Professional | Clear, business-appropriate tone |
| 📜 Formal | Polished, corporate-level language |
| 🤝 Friendly | Warm and approachable tone |
| 😄 Funny | Witty, playful with humor |
| 💬 Casual | Relaxed, everyday conversational |
| 💡 Answer | Generate a detailed reply (with optional draft) |
| ↩️ Reply | Generate a short, quick reply (with optional draft) |

### Setup

1. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Open **Settings** (`Ctrl+,`) → paste your key in the **Gemini API Key** field

The AI uses Gemini model cascade (flash-lite → flash → pro) with automatic retry on rate limits.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New document |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+E` | Inline code |
| `Ctrl+K` | Insert link |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Export as .md |
| `Ctrl+,` | Settings |
| `Ctrl+Shift+E` | Toggle documents panel |
| `Ctrl+Shift+D` | Toggle dark mode |
| `Ctrl+Shift+G` | AI Grammar Fix (selection) |
| `?` | Help / shortcuts |

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 6 |
| Editor | MDXEditor (Lexical-based) |
| Code blocks | CodeMirror |
| State | Zustand |
| Persistence | IndexedDB (idb-keyval) |
| AI | Gemini API (direct fetch) |
| Styling | Plain CSS with CSS custom properties |

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── ai/                    # AI rewriter service & prompts
│   ├── aiService.js       # Gemini API calls with model cascade
│   └── prompts.js         # System prompts for all AI styles
├── components/
│   ├── Editor/            # MDXEditor wrapper, toolbar, AI dropdown & context menu
│   ├── Header/            # Top bar with title, actions
│   ├── Modals/            # Settings, Help, AI Answer modals
│   ├── Sidebar/           # Documents sidebar
│   ├── Toast/             # Toast notifications
│   └── Toolbar/           # Status bar
├── hooks/                 # Autosave, IndexedDB, keyboard shortcuts
├── store/                 # Zustand stores (docs, prefs, UI)
├── styles/                # Global CSS, theme tokens
└── utils/                 # File import/export, time formatting
```

## License

MIT
