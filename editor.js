// ============================================================
//  Rich Text Editor — editor.js  (Phases 1 + 2 + 3)
//  Multi-document, sidebar, outline, themes, focus mode.
// ============================================================

import {
    get, set, del, entries, keys
} from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

/* ===== Utilities ===== */
const genId = () =>
    'd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

function formatRelativeTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yest.toDateString();
    const diffMs = now - d;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (diffMs < 60_000) return 'just now';
    if (sameDay) return hh + ':' + mm;
    if (isYesterday) return 'Yesterday ' + hh + ':' + mm;
    const weekMs = 6 * 24 * 60 * 60 * 1000;
    if (diffMs < weekMs) {
        return d.toLocaleDateString(undefined, { weekday: 'short' }) +
            ' ' + hh + ':' + mm;
    }
    return d.toLocaleDateString();
}

/* ===== Migration ===== */
async function migrateAll() {
    // 1. localStorage -> IndexedDB (Phase 1)
    try {
        if (!(await get('migrated_from_localStorage'))) {
            const lsTitle = localStorage.getItem('headerTitle');
            const lsContent = localStorage.getItem('richContent');
            if (lsTitle !== null) await set('headerTitle', lsTitle);
            if (lsContent !== null) await set('richContent', lsContent);
            await set('migrated_from_localStorage', true);
            if (lsTitle !== null) localStorage.removeItem('headerTitle');
            if (lsContent !== null) localStorage.removeItem('richContent');
        }
    } catch (e) { console.warn('Phase 1 migration skipped:', e); }

    // 2. Single-doc -> multi-doc (Phase 3)
    try {
        if (await get('migrated_to_multi_doc')) return;
        const idx = (await get('docs:index')) || [];
        if (!idx.length) {
            const oldTitle = await get('headerTitle');
            const oldContent = await get('richContent');
            const now = Date.now();
            const id = genId();
            const doc = {
                id,
                title: oldTitle || 'Untitled',
                content: oldContent || '',
                pinned: false,
                createdAt: now,
                updatedAt: now
            };
            await set('doc:' + id, doc);
            await set('docs:index', [{
                id, title: doc.title, pinned: false, updatedAt: now
            }]);
            await set('currentDocId', id);
        }
        await del('headerTitle');
        await del('richContent');
        await set('migrated_to_multi_doc', true);
    } catch (e) { console.warn('Phase 3 migration skipped:', e); }
}

/* ===== Toast ===== */
function showToast(message, type = 'info', duration = 2200) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, duration);
}

/* ===== Theme ===== */
const VALID_THEMES = ['light', 'dark', 'sepia', 'solarized', 'nord'];

function applyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) theme = 'light';
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('themeToggle');
    if (btn) {
        const isDark = theme === 'dark' || theme === 'nord';
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('aria-label',
            isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

async function initTheme() {
    let theme = await get('theme');
    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(theme);
    return theme;
}

async function toggleThemeQuick() {
    // Quick toggle between light and dark only.
    const cur = document.documentElement.dataset.theme;
    const next = (cur === 'dark' || cur === 'nord') ? 'light' : 'dark';
    applyTheme(next);
    await set('theme', next);
    showToast(next === 'dark' ? 'Dark mode' : 'Light mode', 'info', 1100);
}

/* ===== Selection helpers ===== */
function getSelectionRange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return sel.getRangeAt(0);
}

function isInsideEditor(node, editor) {
    while (node) {
        if (node === editor) return true;
        node = node.parentNode;
    }
    return false;
}

function getCurrentBlock(editor) {
    const range = getSelectionRange();
    if (!range) return null;
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    while (node && node !== editor) {
        if (node.parentNode === editor) return node;
        node = node.parentNode;
    }
    return null;
}

function placeCursorAtEnd(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function placeCursorAtStart(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function getOffsetInBlock(block, targetNode, targetOffset) {
    let offset = 0;
    let found = false;
    function walk(node) {
        if (found) return;
        if (node === targetNode) { offset += targetOffset; found = true; return; }
        if (node.nodeType === Node.TEXT_NODE) {
            offset += node.textContent.length;
            return;
        }
        for (const c of node.childNodes) walk(c);
    }
    walk(block);
    return offset;
}

function stripLeading(block, n) {
    let remaining = n;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    let node;
    while (remaining > 0 && (node = walker.nextNode())) {
        const len = node.textContent.length;
        if (len === 0) continue;
        if (len <= remaining) {
            remaining -= len;
            node.textContent = '';
        } else {
            node.textContent = node.textContent.slice(remaining);
            remaining = 0;
        }
    }
    block.normalize();
}

/* ===== Slash command definitions ===== */
const SLASH_COMMANDS = [
    { id: 'h1', icon: 'H1', label: 'Heading 1', hint: '# ', run: (ed) => ed.applyBlock('h1') },
    { id: 'h2', icon: 'H2', label: 'Heading 2', hint: '## ', run: (ed) => ed.applyBlock('h2') },
    { id: 'h3', icon: 'H3', label: 'Heading 3', hint: '### ', run: (ed) => ed.applyBlock('h3') },
    { id: 'p', icon: '¶', label: 'Paragraph', hint: '', run: (ed) => ed.applyBlock('p') },
    { id: 'quote', icon: '❝', label: 'Blockquote', hint: '> ', run: (ed) => ed.applyBlock('blockquote') },
    { id: 'code', icon: '{}', label: 'Code block', hint: '```', run: (ed) => ed.insertCodeBlock() },
    { id: 'ul', icon: '•', label: 'Bullet list', hint: '- ', run: () => document.execCommand('insertUnorderedList') },
    { id: 'ol', icon: '1.', label: 'Numbered list', hint: '1. ', run: () => document.execCommand('insertOrderedList') },
    { id: 'task', icon: '☑️', label: 'Checklist', hint: '- [ ] ', run: (ed) => ed.insertChecklist() },
    { id: 'table', icon: '▦', label: 'Table', hint: '', run: (ed) => ed.openTableModal() },
    { id: 'hr', icon: '—', label: 'Divider', hint: '---', run: () => document.execCommand('insertHorizontalRule') }
];

/* ===== Document model ===== */
async function loadDocIndex() {
    return (await get('docs:index')) || [];
}
async function saveDocIndex(idx) {
    await set('docs:index', idx);
}
async function loadDoc(id) {
    return await get('doc:' + id);
}
async function saveDoc(doc) {
    await set('doc:' + doc.id, doc);
}
async function deleteDocStorage(id) {
    await del('doc:' + id);
}

/* ============================================================
   RichTextEditor
   ============================================================ */
class RichTextEditor {
    constructor() {
        // Core
        this.editor = document.getElementById('richEditor');
        this.editorCard = document.querySelector('.editor-card');
        this.headerInput = document.getElementById('headerTitle');
        this.editBtn = document.getElementById('editHeader');
        this.saveBtn = document.getElementById('saveHeader');
        this.wordCountEl = document.getElementById('wordCount');
        this.readingTimeEl = document.getElementById('readingTime');
        this.lastSavedEl = document.getElementById('lastSaved');
        this.storageSizeEl = document.getElementById('storageSize');
        this.saveIndicator = document.getElementById('saveIndicator');
        this.openBtn = document.getElementById('openFile');
        this.downloadBtn = document.getElementById('downloadFile');
        this.openFileInput = document.getElementById('openFileInput');
        this.themeBtn = document.getElementById('themeToggle');
        this.helpBtn = document.getElementById('helpBtn');
        this.helpCloseBtn = document.getElementById('helpClose');
        this.helpModal = document.getElementById('helpModal');
        this.dropOverlay = document.getElementById('dropOverlay');

        // Phase 2 elements
        this.blockTypeSelect = document.getElementById('blockType');
        this.bubble = document.getElementById('bubbleToolbar');
        this.slashMenu = document.getElementById('slashMenu');
        this.findPanel = document.getElementById('findPanel');
        this.findInput = document.getElementById('findInput');
        this.replaceInput = document.getElementById('replaceInput');
        this.findCountEl = document.getElementById('findCount');
        this.findCaseEl = document.getElementById('findCase');
        this.linkModal = document.getElementById('linkModal');
        this.linkTextEl = document.getElementById('linkText');
        this.linkUrlEl = document.getElementById('linkUrl');
        this.linkNewTabEl = document.getElementById('linkNewTab');

        // Phase 3 elements
        this.docSidebar = document.getElementById('docSidebar');
        this.outlineSidebar = document.getElementById('outlineSidebar');
        this.docListEl = document.getElementById('docList');
        this.docListEmptyEl = document.getElementById('docListEmpty');
        this.outlineListEl = document.getElementById('outlineList');
        this.outlineEmptyEl = document.getElementById('outlineEmpty');
        this.docSearchEl = document.getElementById('docSearch');
        this.newDocBtn = document.getElementById('newDoc');
        this.newDocSidebarBtn = document.getElementById('newDocSidebar');
        this.docSidebarToggleBtn = document.getElementById('docSidebarToggle');
        this.outlineSidebarToggleBtn = document.getElementById('outlineSidebarToggle');
        this.focusToggleBtn = document.getElementById('focusToggle');
        this.focusExitBtn = document.getElementById('focusExit');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');

        // Settings inputs
        this.settingsTheme = document.getElementById('settingsTheme');
        this.settingsFont = document.getElementById('settingsFont');
        this.settingsFontSize = document.getElementById('settingsFontSize');
        this.settingsFontSizeLabel = document.getElementById('settingsFontSizeLabel');
        this.settingsLineHeight = document.getElementById('settingsLineHeight');
        this.settingsLineHeightLabel = document.getElementById('settingsLineHeightLabel');
        this.settingsSpellcheck = document.getElementById('settingsSpellcheck');

        // Phase 4 elements
        this.quotaRingFg = document.querySelector('.quota-ring-fg');
        this.quotaRingLabel = document.getElementById('quotaRingLabel');
        this.quotaRingBtn = document.getElementById('quotaRingBtn');
        this.tableModal = document.getElementById('tableModal');
        this.tableTools = document.getElementById('tableTools');
        this.activeTable = null;

        // State
        this.currentFileHandle = null;
        this.currentDocId = null;
        this.docIndex = [];
        this.saveTimer = null;
        this.savedFlashTimer = null;
        this.outlineTimer = null;

        // Slash menu
        this.slashActive = false;
        this.slashFiltered = SLASH_COMMANDS;
        this.slashIndex = 0;

        // Find
        this.findMatches = [];
        this.findIndex = -1;

        // Link
        this.linkSavedRange = null;

        // Settings
        this.prefs = {
            theme: 'light',
            font: '"SUSE Mono", monospace',
            fontSize: 18,
            lineHeight: 1.6,
            spellcheck: true,
            docCollapsed: false,
            outlineCollapsed: false
        };
    }

    async init() {
        await this.loadPrefs();
        this.applyPrefs();
        await this.loadDocs();
        this.setupCommonListeners();
        this.setupToolbar();
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
        this.setupBubbleToolbar();
        this.setupSlashMenu();
        this.setupFindPanel();
        this.setupLinkModal();
        this.setupSidebar();
        this.setupSettings();
        this.setupFocus();
        this.setupTable();
        this.setupChecklist();
        await this.updateStorageSize();
        this.updateQuotaRing();
    }

    /* ---------- Preferences ---------- */
    async loadPrefs() {
        const stored = (await get('prefs')) || {};
        this.prefs = { ...this.prefs, ...stored };
        // Theme stored separately as well (legacy / quick toggle)
        const t = await get('theme');
        if (t && VALID_THEMES.includes(t)) this.prefs.theme = t;
    }

    async savePrefs() {
        await set('prefs', this.prefs);
        await set('theme', this.prefs.theme);
    }

    applyPrefs() {
        applyTheme(this.prefs.theme);
        document.documentElement.style.setProperty('--editor-font', this.prefs.font);
        document.documentElement.style.setProperty('--editor-font-size',
            this.prefs.fontSize + 'px');
        document.documentElement.style.setProperty('--editor-line-height',
            String(this.prefs.lineHeight));
        this.applySpellcheck(this.prefs.spellcheck);
        document.body.classList.toggle('doc-collapsed', this.prefs.docCollapsed);
        document.body.classList.toggle('outline-collapsed', this.prefs.outlineCollapsed);
        this.docSidebarToggleBtn.setAttribute(
            'aria-pressed', this.prefs.docCollapsed ? 'false' : 'true');
        this.outlineSidebarToggleBtn.setAttribute(
            'aria-pressed', this.prefs.outlineCollapsed ? 'false' : 'true');
    }

    /* ---------- Documents ---------- */
    async loadDocs() {
        this.docIndex = await loadDocIndex();
        if (!this.docIndex.length) {
            // Create initial doc
            const doc = await this.createDoc('Untitled');
            await this.switchDoc(doc.id);
        } else {
            let id = await get('currentDocId');
            if (!id || !this.docIndex.find(d => d.id === id)) {
                id = this.docIndex[0].id;
            }
            await this.switchDoc(id);
        }
        this.renderSidebar();
    }

    async createDoc(title = 'Untitled') {
        const id = genId();
        const now = Date.now();
        const doc = {
            id, title, content: '', pinned: false,
            createdAt: now, updatedAt: now
        };
        await saveDoc(doc);
        this.docIndex.unshift({
            id, title, pinned: false, updatedAt: now
        });
        await saveDocIndex(this.docIndex);
        return doc;
    }

    async switchDoc(id) {
        await this.flushSave();
        const doc = await loadDoc(id);
        if (!doc) return;
        this.currentDocId = id;
        await set('currentDocId', id);
        this.headerInput.value = doc.title;
        this.editor.innerHTML = doc.content || '';
        this.updateWordCount();
        this.updateEmptyState();
        this.scheduleOutline();
        this.renderSidebar();
        this.editor.focus();
    }

    async flushSave() {
        if (!this.saveTimer) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        await this.persistCurrent();
    }

    saveContent() {
        clearTimeout(this.saveTimer);
        this.saveIndicator.classList.add('is-typing');
        this.saveIndicator.classList.remove('is-error');
        this.lastSavedEl.textContent = 'Saving…';
        this.saveTimer = setTimeout(() => this.persistCurrent(), 300);
    }

    async persistCurrent() {
        if (!this.currentDocId) return;
        try {
            const doc = await loadDoc(this.currentDocId);
            if (!doc) return;
            doc.content = this.editor.innerHTML;
            doc.title = (this.headerInput.value || '').trim() || 'Untitled';
            doc.updatedAt = Date.now();
            await saveDoc(doc);

            const entry = this.docIndex.find(d => d.id === this.currentDocId);
            if (entry) {
                entry.title = doc.title;
                entry.updatedAt = doc.updatedAt;
                await saveDocIndex(this.docIndex);
            }

            this.saveIndicator.classList.remove('is-typing', 'is-error');
            this.lastSavedEl.textContent =
                'Saved at ' + new Date().toLocaleTimeString();
            await this.updateStorageSize();
            this.updateQuotaRing();
            this.renderSidebar();
            clearTimeout(this.savedFlashTimer);
            this.savedFlashTimer = setTimeout(() => {
                this.lastSavedEl.textContent = 'Auto-saved';
            }, 2000);
        } catch (e) {
            console.error('Save failed:', e);
            this.saveIndicator.classList.add('is-error');
            this.saveIndicator.classList.remove('is-typing');
            this.lastSavedEl.textContent = 'Save failed';
            showToast('Save failed: ' + (e?.message || e), 'error', 4000);
        }
    }

    async deleteDocById(id) {
        const entry = this.docIndex.find(d => d.id === id);
        if (!entry) return;
        if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
        await deleteDocStorage(id);
        this.docIndex = this.docIndex.filter(d => d.id !== id);
        await saveDocIndex(this.docIndex);
        if (id === this.currentDocId) {
            if (this.docIndex.length) await this.switchDoc(this.docIndex[0].id);
            else {
                const doc = await this.createDoc('Untitled');
                await this.switchDoc(doc.id);
            }
        }
        this.renderSidebar();
        await this.updateStorageSize();
        showToast('Document deleted', 'success');
    }

    async togglePin(id) {
        const entry = this.docIndex.find(d => d.id === id);
        if (!entry) return;
        entry.pinned = !entry.pinned;
        await saveDocIndex(this.docIndex);
        const doc = await loadDoc(id);
        if (doc) { doc.pinned = entry.pinned; await saveDoc(doc); }
        this.renderSidebar();
    }

    async renameDocInline(id, newTitle) {
        const entry = this.docIndex.find(d => d.id === id);
        if (!entry) return;
        entry.title = newTitle.trim() || 'Untitled';
        entry.updatedAt = Date.now();
        await saveDocIndex(this.docIndex);
        const doc = await loadDoc(id);
        if (doc) {
            doc.title = entry.title;
            doc.updatedAt = entry.updatedAt;
            await saveDoc(doc);
        }
        if (id === this.currentDocId) this.headerInput.value = entry.title;
        this.renderSidebar();
    }

    renderSidebar() {
        const q = (this.docSearchEl.value || '').toLowerCase().trim();
        const list = [...this.docIndex];
        // Pinned first, then by updatedAt desc
        list.sort((a, b) => {
            if (!!b.pinned - !!a.pinned !== 0) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
        const filtered = q
            ? list.filter(d => (d.title || '').toLowerCase().includes(q))
            : list;

        this.docListEl.innerHTML = '';
        if (!filtered.length) {
            this.docListEmptyEl.hidden = false;
            return;
        }
        this.docListEmptyEl.hidden = true;

        for (const entry of filtered) {
            const li = document.createElement('li');
            li.className = 'doc-item' +
                (entry.id === this.currentDocId ? ' is-active' : '') +
                (entry.pinned ? ' is-pinned' : '');
            li.dataset.id = entry.id;
            li.setAttribute('role', 'listitem');
            li.innerHTML = `
                <div class="doc-item-main">
                    <div class="doc-item-title"></div>
                    <div class="doc-item-meta"></div>
                </div>
                <div class="doc-item-actions">
                    <button class="icon-btn doc-pin-btn" title="${entry.pinned ? 'Unpin' : 'Pin'}"
                        aria-label="${entry.pinned ? 'Unpin' : 'Pin'}">📌</button>
                    <button class="icon-btn doc-rename-btn" title="Rename"
                        aria-label="Rename">✏️</button>
                    <button class="icon-btn delete-btn doc-delete-btn" title="Delete"
                        aria-label="Delete">🗑️</button>
                </div>`;
            li.querySelector('.doc-item-title').textContent = entry.title || 'Untitled';
            li.querySelector('.doc-item-meta').textContent =
                formatRelativeTime(entry.updatedAt);

            li.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                if (entry.id !== this.currentDocId) this.switchDoc(entry.id);
            });
            li.querySelector('.doc-pin-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePin(entry.id);
            });
            li.querySelector('.doc-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteDocById(entry.id);
            });
            li.querySelector('.doc-rename-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.startInlineRename(li, entry.id);
            });
            li.addEventListener('dblclick', (e) => {
                if (e.target.closest('button')) return;
                this.startInlineRename(li, entry.id);
            });

            this.docListEl.appendChild(li);
        }
    }

    startInlineRename(li, id) {
        const titleEl = li.querySelector('.doc-item-title');
        const current = titleEl.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = current;
        input.className = 'doc-item-rename';
        titleEl.replaceWith(input);
        input.focus();
        input.select();
        const commit = async () => {
            const value = input.value;
            await this.renameDocInline(id, value);
        };
        const cancel = () => this.renderSidebar();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        });
        input.addEventListener('blur', commit);
    }

    /* ---------- Outline ---------- */
    scheduleOutline() {
        clearTimeout(this.outlineTimer);
        this.outlineTimer = setTimeout(() => this.updateOutline(), 250);
    }

    updateOutline() {
        const headings = this.editor.querySelectorAll('h1, h2, h3');
        this.outlineListEl.innerHTML = '';
        if (!headings.length) {
            this.outlineEmptyEl.hidden = false;
            return;
        }
        this.outlineEmptyEl.hidden = true;
        headings.forEach((h, i) => {
            if (!h.id) h.id = 'h-' + i + '-' + Math.random().toString(36).slice(2, 7);
            const li = document.createElement('li');
            li.className = 'outline-item outline-' + h.tagName.toLowerCase();
            li.textContent = h.textContent.trim() || '(empty heading)';
            li.tabIndex = 0;
            li.addEventListener('click', () => {
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Place cursor at the heading for editing convenience
                placeCursorAtStart(h);
            });
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    li.click();
                }
            });
            this.outlineListEl.appendChild(li);
        });
    }

    /* ---------- Sidebar setup ---------- */
    setupSidebar() {
        this.newDocBtn.addEventListener('click', () => this.handleNewDoc());
        this.newDocSidebarBtn.addEventListener('click', () => this.handleNewDoc());
        this.docSearchEl.addEventListener('input', () => this.renderSidebar());

        this.docSidebarToggleBtn.addEventListener('click', () =>
            this.toggleSidebar('doc'));
        this.outlineSidebarToggleBtn.addEventListener('click', () =>
            this.toggleSidebar('outline'));
    }

    async handleNewDoc() {
        await this.flushSave();
        const doc = await this.createDoc('Untitled');
        await this.switchDoc(doc.id);
        // Focus the title input for immediate naming
        this.editBtn.style.display = 'none';
        this.saveBtn.style.display = 'inline';
        this.headerInput.readOnly = false;
        this.headerInput.focus();
        this.headerInput.select();
        await this.updateStorageSize();
    }

    async toggleSidebar(which) {
        if (which === 'doc') {
            this.prefs.docCollapsed = !this.prefs.docCollapsed;
            document.body.classList.toggle('doc-collapsed', this.prefs.docCollapsed);
            this.docSidebarToggleBtn.setAttribute(
                'aria-pressed', this.prefs.docCollapsed ? 'false' : 'true');
        } else {
            this.prefs.outlineCollapsed = !this.prefs.outlineCollapsed;
            document.body.classList.toggle('outline-collapsed', this.prefs.outlineCollapsed);
            this.outlineSidebarToggleBtn.setAttribute(
                'aria-pressed', this.prefs.outlineCollapsed ? 'false' : 'true');
        }
        await this.savePrefs();
    }

    /* ---------- Settings ---------- */
    setupSettings() {
        const open = async () => {
            this.settingsTheme.value = this.prefs.theme;
            this.settingsFont.value = this.prefs.font;
            this.settingsFontSize.value = this.prefs.fontSize;
            this.settingsFontSizeLabel.textContent = this.prefs.fontSize;
            this.settingsLineHeight.value = this.prefs.lineHeight;
            this.settingsLineHeightLabel.textContent = this.prefs.lineHeight;
            this.settingsSpellcheck.checked = !!this.prefs.spellcheck;
            this.settingsModal.classList.add('is-open');
            this.settingsModal.setAttribute('aria-hidden', 'false');
            this.renderDocSizes();
        };
        const close = () => {
            this.settingsModal.classList.remove('is-open');
            this.settingsModal.setAttribute('aria-hidden', 'true');
        };

        this.settingsBtn.addEventListener('click', open);
        document.getElementById('settingsClose').addEventListener('click', close);
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) close();
        });

        this.settingsTheme.addEventListener('change', async () => {
            this.prefs.theme = this.settingsTheme.value;
            applyTheme(this.prefs.theme);
            await this.savePrefs();
        });
        this.settingsFont.addEventListener('change', async () => {
            this.prefs.font = this.settingsFont.value;
            document.documentElement.style.setProperty('--editor-font', this.prefs.font);
            await this.savePrefs();
        });
        this.settingsFontSize.addEventListener('input', async () => {
            const v = parseInt(this.settingsFontSize.value, 10);
            this.prefs.fontSize = v;
            this.settingsFontSizeLabel.textContent = v;
            document.documentElement.style.setProperty('--editor-font-size', v + 'px');
            await this.savePrefs();
        });
        this.settingsLineHeight.addEventListener('input', async () => {
            const v = parseFloat(this.settingsLineHeight.value);
            this.prefs.lineHeight = v;
            this.settingsLineHeightLabel.textContent = v.toFixed(2);
            document.documentElement.style.setProperty('--editor-line-height', String(v));
            await this.savePrefs();
        });
        this.settingsSpellcheck.addEventListener('change', async () => {
            this.prefs.spellcheck = this.settingsSpellcheck.checked;
            this.applySpellcheck(this.prefs.spellcheck);
            await this.savePrefs();
        });

        document.getElementById('settingsResetBtn').addEventListener('click', async () => {
            this.prefs.theme = 'light';
            this.prefs.font = '"SUSE Mono", monospace';
            this.prefs.fontSize = 18;
            this.prefs.lineHeight = 1.6;
            this.prefs.spellcheck = true;
            this.applyPrefs();
            await this.savePrefs();
            open();
            showToast('Settings reset', 'success', 1500);
        });

        document.getElementById('settingsWipeBtn').addEventListener('click', async () => {
            if (!confirm('Delete ALL documents and settings? This cannot be undone.')) return;
            try {
                const allKeys = await keys();
                for (const k of allKeys) await del(k);
            } catch (e) {
                console.error(e);
            }
            location.reload();
        });

        this.quotaRingBtn?.addEventListener('click', () => open());
    }

    applySpellcheck(enabled) {
        this.editor.setAttribute('spellcheck', enabled ? 'true' : 'false');
    }

    /* ---------- Focus mode ---------- */
    setupFocus() {
        this.focusToggleBtn.addEventListener('click', () => this.toggleFocus());
        this.focusExitBtn.addEventListener('click', () => this.toggleFocus(false));
    }

    toggleFocus(target) {
        const isOn = document.body.classList.contains('is-focus');
        const next = target === undefined ? !isOn : target;
        document.body.classList.toggle('is-focus', next);
        showToast(next ? 'Focus mode on' : 'Focus mode off', 'info', 1100);
        this.editor.focus();
    }

    /* ---------- Storage size ---------- */
    async updateStorageSize() {
        let bytes = 0;
        try {
            const all = await entries();
            for (const [key, value] of all) {
                const k = String(key);
                const v = typeof value === 'string' ? value : JSON.stringify(value);
                bytes += (k.length + (v ? v.length : 0)) * 2;
            }
        } catch { bytes = 0; }
        this.storageSizeEl.textContent = 'Size: ' + this.formatBytes(bytes);
    }

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /* ---------- Common listeners ---------- */
    setupCommonListeners() {
        this.editBtn.addEventListener('click', () => {
            this.headerInput.readOnly = false;
            this.headerInput.focus();
            this.headerInput.select();
            this.editBtn.style.display = 'none';
            this.saveBtn.style.display = 'inline';
        });

        this.saveBtn.addEventListener('click', () => this.commitHeader());
        this.headerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.commitHeader(); }
        });
        this.headerInput.addEventListener('input', () => {
            if (!this.headerInput.readOnly) this.saveContent();
        });

        this.editor.addEventListener('input', (e) => {
            this.saveContent();
            this.updateWordCount();
            this.updateEmptyState();
            this.handleMarkdownShortcuts(e);
            this.handleSlashTrigger(e);
            this.updateBlockTypeSelect();
            this.scheduleOutline();
        });

        this.openBtn.addEventListener('click', () => this.openFile());
        this.openFileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) this.readFileIntoNewDoc(file);
            e.target.value = '';
        });
        this.downloadBtn.addEventListener('click', () => this.downloadFile());
        this.themeBtn.addEventListener('click', async () => {
            await toggleThemeQuick();
            this.prefs.theme = document.documentElement.dataset.theme;
            await this.savePrefs();
        });

        this.helpBtn.addEventListener('click', () => {
            this.helpModal.classList.add('is-open');
            this.helpModal.setAttribute('aria-hidden', 'false');
        });
        this.helpCloseBtn.addEventListener('click', () => {
            this.helpModal.classList.remove('is-open');
            this.helpModal.setAttribute('aria-hidden', 'true');
        });
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.helpModal.classList.remove('is-open');
                this.helpModal.setAttribute('aria-hidden', 'true');
            }
        });

        this.editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        document.addEventListener('selectionchange', () => {
            this.updateButtonStates();
            this.updateBubbleToolbar();
            this.updateBlockTypeSelect();
            this.updateTableTools();
        });
    }

    async commitHeader() {
        this.headerInput.readOnly = true;
        const value = (this.headerInput.value || '').trim() || 'Untitled';
        this.headerInput.value = value;
        this.saveBtn.style.display = 'none';
        this.editBtn.style.display = 'inline';
        await this.persistCurrent();
    }

    /* ---------- Toolbar ---------- */
    setupToolbar() {
        const exec = (cmd) => () => {
            document.execCommand(cmd);
            this.updateButtonStates();
            this.editor.focus();
        };
        document.getElementById('boldBtn').addEventListener('click', exec('bold'));
        document.getElementById('italicBtn').addEventListener('click', exec('italic'));
        document.getElementById('leftAlign').addEventListener('click', exec('justifyLeft'));
        document.getElementById('centerAlign').addEventListener('click', exec('justifyCenter'));
        document.getElementById('rightAlign').addEventListener('click', exec('justifyRight'));

        document.getElementById('inlineCodeBtn').addEventListener('click', () => this.toggleInlineCode());
        document.getElementById('highlightBtn').addEventListener('click', () => this.toggleHighlight());
        document.getElementById('linkBtn').addEventListener('click', () => this.openLinkModal());
        document.getElementById('blockquoteBtn').addEventListener('click', () => this.applyBlock('blockquote'));
        document.getElementById('codeBlockBtn').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('taskBtn').addEventListener('click', () => this.insertChecklist());
        document.getElementById('tableBtn').addEventListener('click', () => this.openTableModal());
        document.getElementById('findBtn').addEventListener('click', () => this.toggleFindPanel(true));

        this.blockTypeSelect.addEventListener('change', (e) => {
            this.applyBlock(e.target.value);
            this.editor.focus();
        });
    }

    updateButtonStates() {
        const map = { boldBtn: 'bold', italicBtn: 'italic' };
        for (const [id, command] of Object.entries(map)) {
            const btn = document.getElementById(id);
            if (!btn) continue;
            btn.classList.toggle('active', document.queryCommandState(command));
        }
        document.getElementById('inlineCodeBtn').classList
            .toggle('active', this.isSelectionInside('CODE'));
        document.getElementById('highlightBtn').classList
            .toggle('active', this.isSelectionInside('MARK'));
        document.getElementById('linkBtn').classList
            .toggle('active', this.isSelectionInside('A'));
    }

    isSelectionInside(tagName) {
        const range = getSelectionRange();
        if (!range || !isInsideEditor(range.startContainer, this.editor)) return false;
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        while (node && node !== this.editor) {
            if (node.nodeName === tagName) return true;
            node = node.parentNode;
        }
        return false;
    }

    updateBlockTypeSelect() {
        const block = getCurrentBlock(this.editor);
        if (!block) return;
        const tag = block.nodeName.toLowerCase();
        const known = ['p', 'h1', 'h2', 'h3'];
        this.blockTypeSelect.value = known.includes(tag) ? tag : 'p';
    }

    /* ---------- Blocks ---------- */
    applyBlock(tagName) {
        const range = getSelectionRange();
        if (!range || !isInsideEditor(range.startContainer, this.editor)) {
            this.editor.focus();
        }
        const tag = tagName.toLowerCase();
        if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'blockquote') {
            document.execCommand('formatBlock', false, tag);
        } else {
            const block = getCurrentBlock(this.editor);
            if (block) {
                const newEl = document.createElement(tag);
                newEl.innerHTML = block.innerHTML || '<br>';
                block.replaceWith(newEl);
                placeCursorAtEnd(newEl);
            }
        }
        this.saveContent();
        this.scheduleOutline();
    }

    insertCodeBlock() {
        const sel = window.getSelection();
        const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
        const selectedText = range ? range.toString() : '';
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = selectedText || '';
        pre.appendChild(code);
        if (range && isInsideEditor(range.startContainer, this.editor)) {
            range.deleteContents();
            range.insertNode(pre);
            placeCursorAtEnd(code);
        } else {
            this.editor.appendChild(pre);
            placeCursorAtEnd(code);
        }
        this.saveContent();
    }

    toggleInlineCode() {
        const range = getSelectionRange();
        if (!range) return;
        if (this.isSelectionInside('CODE')) {
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            while (node && node.nodeName !== 'CODE') node = node.parentNode;
            if (node) this.unwrap(node);
        } else {
            if (range.collapsed) return;
            const code = document.createElement('code');
            try {
                code.appendChild(range.extractContents());
                range.insertNode(code);
                placeCursorAtEnd(code);
            } catch (e) { console.warn(e); }
        }
        this.saveContent();
    }

    toggleHighlight() {
        const range = getSelectionRange();
        if (!range || range.collapsed) {
            showToast('Select some text first', 'info', 1500);
            return;
        }
        if (this.isSelectionInside('MARK')) {
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            while (node && node.nodeName !== 'MARK') node = node.parentNode;
            if (node) this.unwrap(node);
        } else {
            const mark = document.createElement('mark');
            try {
                mark.appendChild(range.extractContents());
                range.insertNode(mark);
                placeCursorAtEnd(mark);
            } catch (e) { console.warn(e); }
        }
        this.saveContent();
    }

    unwrap(el) {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
    }

    /* ---------- Checklist (Phase 4) ---------- */
    setupChecklist() {
        // Toggle checkbox state on click — persist as attribute, not just property.
        this.editor.addEventListener('click', (e) => {
            const cb = e.target;
            if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;
            const li = cb.closest('li.task-item');
            if (!li) return;
            if (cb.checked) {
                cb.setAttribute('checked', '');
                li.classList.add('is-done');
            } else {
                cb.removeAttribute('checked');
                li.classList.remove('is-done');
            }
            this.saveContent();
        });

        // Custom Enter behavior inside task-items.
        this.editor.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' || e.shiftKey) return;
            const range = getSelectionRange();
            if (!range || !range.collapsed) return;
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            let li = null;
            while (node && node !== this.editor) {
                if (node.nodeName === 'LI' && node.classList?.contains('task-item')) {
                    li = node; break;
                }
                node = node.parentNode;
            }
            if (!li) return;
            e.preventDefault();
            const cb = li.querySelector('input[type="checkbox"]');
            const text = (li.textContent || '').replace(/\u00a0/g, ' ').trim();
            if (!text) {
                const ul = li.parentNode;
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                ul.parentNode.insertBefore(p, ul.nextSibling);
                li.remove();
                if (!ul.children.length) ul.remove();
                placeCursorAtStart(p);
            } else {
                const newLi = document.createElement('li');
                newLi.className = 'task-item';
                const newCb = document.createElement('input');
                newCb.type = 'checkbox';
                newCb.setAttribute('contenteditable', 'false');
                newLi.appendChild(newCb);
                newLi.appendChild(document.createTextNode('\u00a0'));
                li.parentNode.insertBefore(newLi, li.nextSibling);
                placeCursorAtEnd(newLi);
            }
            this.saveContent();
        });
    }

    insertChecklist() {
        const ul = document.createElement('ul');
        ul.className = 'task-list';
        const li = document.createElement('li');
        li.className = 'task-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('contenteditable', 'false');
        li.appendChild(cb);
        li.appendChild(document.createTextNode('\u00a0'));
        ul.appendChild(li);

        const block = getCurrentBlock(this.editor);
        if (block && block.textContent.trim() === '') {
            block.replaceWith(ul);
        } else if (block) {
            block.parentNode.insertBefore(ul, block.nextSibling);
        } else {
            this.editor.appendChild(ul);
        }
        placeCursorAtEnd(li);
        this.saveContent();
    }

    /** Convert a freshly-typed bullet LI (with leading "[ ] " / "[x] ") into a task item. */
    convertLiToTask(li, checked) {
        // Strip the "[ ] " or "[x] " prefix (4 chars) from the LI text.
        stripLeading(li, 4);
        // Promote parent UL to a task-list.
        const ul = li.parentNode;
        if (ul && ul.nodeName === 'UL') ul.classList.add('task-list');
        li.classList.add('task-item');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('contenteditable', 'false');
        if (checked) {
            cb.setAttribute('checked', '');
            cb.checked = true;
            li.classList.add('is-done');
        }
        li.insertBefore(document.createTextNode('\u00a0'), li.firstChild);
        li.insertBefore(cb, li.firstChild);
        placeCursorAtEnd(li);
        this.saveContent();
    }

    /* ---------- Tables (Phase 4) ---------- */
    setupTable() {
        const close = () => {
            this.tableModal.classList.remove('is-open');
            this.tableModal.setAttribute('aria-hidden', 'true');
        };
        document.getElementById('tableCloseBtn').addEventListener('click', close);
        this.tableModal.addEventListener('click', (e) => {
            if (e.target === this.tableModal) close();
        });
        document.getElementById('tableInsertBtn').addEventListener('click', () => {
            const rows = Math.max(1, Math.min(50,
                parseInt(document.getElementById('tableRows').value, 10) || 3));
            const cols = Math.max(1, Math.min(20,
                parseInt(document.getElementById('tableCols').value, 10) || 3));
            const header = document.getElementById('tableHeader').checked;
            this.insertTable(rows, cols, header);
            close();
        });

        // Floating table tools
        this.tableTools.addEventListener('mousedown', (e) => e.preventDefault());
        this.tableTools.querySelectorAll('[data-act]').forEach(btn => {
            btn.addEventListener('click', () => this.runTableAction(btn.dataset.act));
        });
    }

    openTableModal() {
        // Save current selection so insert happens in the right place.
        this.tableSavedRange = getSelectionRange()?.cloneRange() || null;
        this.tableModal.classList.add('is-open');
        this.tableModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => document.getElementById('tableRows').focus(), 30);
    }

    insertTable(rows, cols, header = true) {
        const table = document.createElement('table');
        table.className = 'rich-table';
        if (header) {
            const thead = document.createElement('thead');
            const tr = document.createElement('tr');
            for (let i = 0; i < cols; i++) {
                const th = document.createElement('th');
                th.innerHTML = '<br>';
                tr.appendChild(th);
            }
            thead.appendChild(tr);
            table.appendChild(thead);
        }
        const tbody = document.createElement('tbody');
        for (let r = 0; r < rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
                const td = document.createElement('td');
                td.innerHTML = '<br>';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        // Restore caret if we saved one (modal-driven flow).
        if (this.tableSavedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.tableSavedRange);
            this.tableSavedRange = null;
        }
        const block = getCurrentBlock(this.editor);
        if (block && block.textContent.trim() === '') {
            block.replaceWith(table);
        } else if (block) {
            block.parentNode.insertBefore(table, block.nextSibling);
        } else {
            this.editor.appendChild(table);
        }
        const after = document.createElement('p');
        after.innerHTML = '<br>';
        table.parentNode.insertBefore(after, table.nextSibling);
        const firstCell = table.querySelector('th, td');
        if (firstCell) placeCursorAtStart(firstCell);
        this.saveContent();
    }

    findEnclosingTableCell() {
        const range = getSelectionRange();
        if (!range || !isInsideEditor(range.startContainer, this.editor)) return null;
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        let cell = null, table = null;
        while (node && node !== this.editor) {
            if (!cell && (node.nodeName === 'TD' || node.nodeName === 'TH')) cell = node;
            if (node.nodeName === 'TABLE') { table = node; break; }
            node = node.parentNode;
        }
        return table ? { table, cell } : null;
    }

    updateTableTools() {
        const info = this.findEnclosingTableCell();
        if (!info) {
            this.tableTools.classList.remove('is-visible');
            this.tableTools.setAttribute('aria-hidden', 'true');
            this.activeTable = null;
            return;
        }
        this.activeTable = info.table;
        const rect = info.table.getBoundingClientRect();
        this.tableTools.classList.add('is-visible');
        this.tableTools.setAttribute('aria-hidden', 'false');
        const top = window.scrollY + rect.bottom + 6;
        const toolsRect = this.tableTools.getBoundingClientRect();
        const left = Math.max(
            8,
            Math.min(
                window.innerWidth - toolsRect.width - 8,
                window.scrollX + rect.left
            )
        );
        this.tableTools.style.top = top + 'px';
        this.tableTools.style.left = left + 'px';
    }

    runTableAction(act) {
        const info = this.findEnclosingTableCell();
        if (!info && act !== 'del') return;
        const table = info?.table || this.activeTable;
        if (!table) return;
        const cell = info?.cell;
        const row = cell?.parentNode;
        const colIndex = cell && row ? Array.from(row.children).indexOf(cell) : -1;

        if (act === 'row-above' || act === 'row-below') {
            if (!row) return;
            const newRow = document.createElement('tr');
            const cols = row.children.length;
            for (let i = 0; i < cols; i++) {
                const td = document.createElement('td');
                td.innerHTML = '<br>';
                newRow.appendChild(td);
            }
            if (act === 'row-above') row.parentNode.insertBefore(newRow, row);
            else row.parentNode.insertBefore(newRow, row.nextSibling);
            placeCursorAtStart(newRow.children[colIndex] || newRow.children[0]);
        }
        else if (act === 'col-left' || act === 'col-right') {
            if (colIndex < 0) return;
            const insertAt = act === 'col-left' ? colIndex : colIndex + 1;
            table.querySelectorAll('tr').forEach(tr => {
                const isHeader = tr.parentNode?.nodeName === 'THEAD';
                const newCell = document.createElement(isHeader ? 'th' : 'td');
                newCell.innerHTML = '<br>';
                tr.insertBefore(newCell, tr.children[insertAt] || null);
            });
        }
        else if (act === 'row-del') {
            const rows = table.querySelectorAll('tr');
            if (rows.length <= 1) { this.runTableAction('del'); return; }
            row.remove();
        }
        else if (act === 'col-del') {
            if (colIndex < 0) return;
            const cols = row.children.length;
            if (cols <= 1) { this.runTableAction('del'); return; }
            table.querySelectorAll('tr').forEach(tr => {
                tr.children[colIndex]?.remove();
            });
        }
        else if (act === 'del') {
            const next = table.nextSibling;
            table.remove();
            if (next && next.nodeType === Node.ELEMENT_NODE) placeCursorAtStart(next);
            this.activeTable = null;
            this.tableTools.classList.remove('is-visible');
        }
        this.saveContent();
    }

    /* ---------- Quota ring & per-doc size (Phase 4) ---------- */
    async updateQuotaRing() {
        if (!this.quotaRingFg) return;
        if (!('storage' in navigator) || !navigator.storage.estimate) {
            this.quotaRingLabel.textContent = 'n/a';
            return;
        }
        try {
            const { usage = 0, quota = 0 } = await navigator.storage.estimate();
            const pct = quota ? (usage / quota) * 100 : 0;
            const rounded = pct < 0.1 && pct > 0 ? '<0.1' : pct.toFixed(pct < 10 ? 1 : 0);
            this.quotaRingFg.setAttribute(
                'stroke-dasharray', `${Math.min(100, pct).toFixed(2)} 100`);
            this.quotaRingFg.classList.toggle('warn', pct > 80);
            this.quotaRingLabel.textContent = rounded + '%';
            this.quotaRingBtn.title =
                `Storage: ${this.formatBytes(usage)} / ${this.formatBytes(quota)}`
                + ` (${rounded}%) — click for details`;
        } catch (e) {
            this.quotaRingLabel.textContent = '—';
        }
    }

    async renderDocSizes() {
        const list = document.getElementById('docSizes');
        const details = document.getElementById('quotaDetails');
        if (!list || !details) return;
        list.innerHTML = '';

        const sizes = [];
        let total = 0;
        for (const entry of this.docIndex) {
            const doc = await loadDoc(entry.id);
            if (!doc) continue;
            // Rough byte estimate: 2 bytes per UTF-16 char in stored JSON.
            const bytes = JSON.stringify(doc).length * 2;
            total += bytes;
            sizes.push({ id: entry.id, title: entry.title, size: bytes });
        }
        sizes.sort((a, b) => b.size - a.size);

        if (!sizes.length) {
            const empty = document.createElement('li');
            empty.className = 'doc-sizes-empty';
            empty.textContent = 'No documents yet.';
            list.appendChild(empty);
        } else {
            for (const s of sizes) {
                const li = document.createElement('li');
                li.innerHTML =
                    '<span class="ds-title"></span><span class="ds-size"></span>';
                li.querySelector('.ds-title').textContent = s.title || 'Untitled';
                li.querySelector('.ds-size').textContent = this.formatBytes(s.size);
                if (s.id === this.currentDocId) {
                    li.style.fontWeight = '700';
                }
                li.addEventListener('click', async () => {
                    this.settingsModal.classList.remove('is-open');
                    this.settingsModal.setAttribute('aria-hidden', 'true');
                    if (s.id !== this.currentDocId) await this.switchDoc(s.id);
                });
                list.appendChild(li);
            }
        }

        if ('storage' in navigator && navigator.storage.estimate) {
            try {
                const { usage = 0, quota = 0 } = await navigator.storage.estimate();
                const pct = quota ? (usage / quota) * 100 : 0;
                const pctText = pct < 0.1 && pct > 0 ? '<0.1' : pct.toFixed(2);
                const warn = pct > 80 ? ' warn' : '';
                details.innerHTML = `
                    <div>Browser usage: <strong>${this.formatBytes(usage)}</strong>
                    of <strong>${this.formatBytes(quota)}</strong> (${pctText}%)</div>
                    <div>Documents: <strong>${sizes.length}</strong> ·
                    Editor total: <strong>${this.formatBytes(total)}</strong></div>
                    <span class="bar"><span class="bar-fill${warn}"
                        style="width:${Math.min(100, pct).toFixed(2)}%"></span></span>`;
            } catch {
                details.innerHTML =
                    `<div>Editor total: <strong>${this.formatBytes(total)}</strong></div>`;
            }
        } else {
            details.innerHTML =
                `<div>Editor total: <strong>${this.formatBytes(total)}</strong></div>`;
        }
        this.updateQuotaRing();
    }

    /* ---------- Link modal ---------- */
    setupLinkModal() {
        const close = () => {
            this.linkModal.classList.remove('is-open');
            this.linkModal.setAttribute('aria-hidden', 'true');
        };
        document.getElementById('linkCloseBtn').addEventListener('click', close);
        this.linkModal.addEventListener('click', (e) => {
            if (e.target === this.linkModal) close();
        });
        document.getElementById('linkInsertBtn').addEventListener('click', () => {
            this.applyLink(); close();
        });
        document.getElementById('linkRemoveBtn').addEventListener('click', () => {
            this.removeLink(); close();
        });
        this.linkUrlEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.applyLink(); close();
            }
        });
    }

    openLinkModal() {
        this.linkSavedRange = getSelectionRange()?.cloneRange() || null;
        let existing = null;
        const range = this.linkSavedRange;
        if (range) {
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            while (node && node !== this.editor) {
                if (node.nodeName === 'A') { existing = node; break; }
                node = node.parentNode;
            }
        }
        if (existing) {
            this.linkTextEl.value = existing.textContent;
            this.linkUrlEl.value = existing.getAttribute('href') || '';
            this.linkNewTabEl.checked = existing.getAttribute('target') === '_blank';
        } else {
            this.linkTextEl.value = range ? range.toString() : '';
            this.linkUrlEl.value = '';
            this.linkNewTabEl.checked = true;
        }
        this.linkModal.classList.add('is-open');
        this.linkModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => this.linkUrlEl.focus(), 30);
    }

    applyLink() {
        const url = (this.linkUrlEl.value || '').trim();
        const text = (this.linkTextEl.value || '').trim();
        if (!url) { showToast('URL required', 'error', 1500); return; }
        const range = this.linkSavedRange;
        const sel = window.getSelection();
        if (range) { sel.removeAllRanges(); sel.addRange(range); }
        else this.editor.focus();

        let existing = null;
        const r = getSelectionRange();
        if (r) {
            let node = r.startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            while (node && node !== this.editor) {
                if (node.nodeName === 'A') { existing = node; break; }
                node = node.parentNode;
            }
        }
        if (existing) {
            existing.setAttribute('href', url);
            existing.textContent = text || existing.textContent || url;
            if (this.linkNewTabEl.checked) {
                existing.setAttribute('target', '_blank');
                existing.setAttribute('rel', 'noopener noreferrer');
            } else {
                existing.removeAttribute('target');
                existing.removeAttribute('rel');
            }
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.textContent = text || url;
            if (this.linkNewTabEl.checked) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            if (r && !r.collapsed) {
                r.deleteContents();
                r.insertNode(a);
            } else {
                this.editor.appendChild(a);
            }
            placeCursorAtEnd(a);
        }
        this.saveContent();
    }

    removeLink() {
        const range = this.linkSavedRange;
        if (!range) return;
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        while (node && node !== this.editor) {
            if (node.nodeName === 'A') { this.unwrap(node); break; }
            node = node.parentNode;
        }
        this.saveContent();
    }

    /* ---------- Bubble toolbar ---------- */
    setupBubbleToolbar() {
        this.bubble.addEventListener('mousedown', (e) => e.preventDefault());
        this.bubble.querySelectorAll('.bubble-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                switch (cmd) {
                    case 'bold':
                    case 'italic':
                        document.execCommand(cmd); break;
                    case 'inlineCode': this.toggleInlineCode(); break;
                    case 'highlight': this.toggleHighlight(); break;
                    case 'link': this.openLinkModal(); break;
                }
                this.updateButtonStates();
                this.updateBubbleToolbar();
            });
        });
    }

    updateBubbleToolbar() {
        const sel = window.getSelection();
        const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
        if (!range || range.collapsed ||
            !isInsideEditor(range.startContainer, this.editor) ||
            this.linkModal.classList.contains('is-open') ||
            this.settingsModal.classList.contains('is-open') ||
            this.tableModal.classList.contains('is-open') ||
            this.helpModal.classList.contains('is-open')) {
            this.hideBubble(); return;
        }
        if (!isInsideEditor(sel.anchorNode, this.editor)) { this.hideBubble(); return; }
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) { this.hideBubble(); return; }
        this.bubble.classList.add('is-visible');
        this.bubble.setAttribute('aria-hidden', 'false');
        const bubbleRect = this.bubble.getBoundingClientRect();
        const top = window.scrollY + rect.top - bubbleRect.height - 8;
        const left = Math.max(
            8,
            Math.min(
                window.innerWidth - bubbleRect.width - 8,
                window.scrollX + rect.left + (rect.width - bubbleRect.width) / 2
            )
        );
        this.bubble.style.top = top + 'px';
        this.bubble.style.left = left + 'px';
    }

    hideBubble() {
        this.bubble.classList.remove('is-visible');
        this.bubble.setAttribute('aria-hidden', 'true');
    }

    /* ---------- Slash menu ---------- */
    setupSlashMenu() {
        document.addEventListener('mousedown', (e) => {
            if (!this.slashActive) return;
            if (!this.slashMenu.contains(e.target)) this.closeSlashMenu();
        });
    }

    handleSlashTrigger(e) {
        if (this.slashActive) { this.updateSlashFilter(); return; }
        if (e.inputType === 'insertText' && e.data === '/') {
            const range = getSelectionRange();
            if (!range) return;
            const node = range.startContainer;
            const offset = range.startOffset;
            const textBefore = (node.nodeType === Node.TEXT_NODE)
                ? node.textContent.slice(0, offset)
                : '';
            const isStart = /(^|\s)\/$/.test(textBefore);
            if (!isStart) return;
            this.openSlashMenu();
        }
    }

    openSlashMenu() {
        this.slashActive = true;
        this.slashFiltered = SLASH_COMMANDS;
        this.slashIndex = 0;
        this.renderSlashMenu();
        const range = getSelectionRange();
        if (!range) return;
        const rect = range.getBoundingClientRect();
        this.slashMenu.classList.add('is-visible');
        this.slashMenu.setAttribute('aria-hidden', 'false');
        const left = Math.min(window.innerWidth - 240, window.scrollX + rect.left);
        const top = window.scrollY + rect.bottom + 6;
        this.slashMenu.style.left = left + 'px';
        this.slashMenu.style.top = top + 'px';
    }

    closeSlashMenu() {
        this.slashActive = false;
        this.slashMenu.classList.remove('is-visible');
        this.slashMenu.setAttribute('aria-hidden', 'true');
    }

    getSlashQuery() {
        const range = getSelectionRange();
        if (!range) return null;
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return null;
        const text = node.textContent.slice(0, range.startOffset);
        const m = text.match(/(?:^|\s)\/([\w]*)$/);
        if (!m) return null;
        return {
            query: m[1].toLowerCase(),
            textNode: node,
            matchStart: text.length - (m[1].length + 1)
        };
    }

    updateSlashFilter() {
        const info = this.getSlashQuery();
        if (!info) { this.closeSlashMenu(); return; }
        const q = info.query;
        this.slashFiltered = SLASH_COMMANDS.filter(c =>
            c.id.startsWith(q) || c.label.toLowerCase().includes(q));
        if (!this.slashFiltered.length) { this.closeSlashMenu(); return; }
        this.slashIndex = Math.min(this.slashIndex, this.slashFiltered.length - 1);
        this.renderSlashMenu();
    }

    renderSlashMenu() {
        this.slashMenu.innerHTML = '';
        this.slashFiltered.forEach((cmd, i) => {
            const item = document.createElement('div');
            item.className = 'slash-item' + (i === this.slashIndex ? ' is-active' : '');
            item.setAttribute('role', 'option');
            item.innerHTML = `
                <span class="slash-item-icon"></span>
                <span class="slash-item-label"></span>
                <span class="slash-item-hint"></span>`;
            item.querySelector('.slash-item-icon').textContent = cmd.icon;
            item.querySelector('.slash-item-label').textContent = cmd.label;
            item.querySelector('.slash-item-hint').textContent = cmd.hint;
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.runSlashCommand(cmd);
            });
            this.slashMenu.appendChild(item);
        });
    }

    runSlashCommand(cmd) {
        const info = this.getSlashQuery();
        if (info) {
            const node = info.textNode;
            const sel = getSelectionRange();
            const after = node.textContent.slice(sel.startOffset);
            const before = node.textContent.slice(0, info.matchStart);
            node.textContent = before + after;
            const range = document.createRange();
            range.setStart(node, before.length);
            range.collapse(true);
            const s = window.getSelection();
            s.removeAllRanges();
            s.addRange(range);
        }
        this.closeSlashMenu();
        cmd.run(this);
        this.saveContent();
        this.scheduleOutline();
        this.editor.focus();
    }

    /* ---------- Markdown shortcuts ---------- */
    handleMarkdownShortcuts(e) {
        if (e.inputType !== 'insertText' || (e.data !== ' ' && e.data !== '`')) return;
        const range = getSelectionRange();
        if (!range || !range.collapsed) return;
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return;

        // Triple-backtick -> code block
        if (e.data === '`') {
            const text = node.textContent.slice(0, range.startOffset);
            if (text.endsWith('```')) {
                node.textContent = node.textContent.slice(0, range.startOffset - 3) +
                    node.textContent.slice(range.startOffset);
                const r = document.createRange();
                r.setStart(node, range.startOffset - 3);
                r.collapse(true);
                const s = window.getSelection();
                s.removeAllRanges();
                s.addRange(r);
                this.insertCodeBlock();
            }
            return;
        }

        const block = getCurrentBlock(this.editor);
        if (!block) return;

        // Task-list trigger: typing "[ ] " or "[x] " at the start of a bullet item
        // converts that LI into a task item.
        let liNode = node;
        while (liNode && liNode !== this.editor && liNode.nodeName !== 'LI') {
            liNode = liNode.parentNode;
        }
        if (liNode && liNode.nodeName === 'LI'
            && !liNode.classList.contains('task-item')) {
            const liText = (liNode.textContent || '').replace(/\u00a0/g, ' ');
            if (/^\[ \] /.test(liText)) { this.convertLiToTask(liNode, false); return; }
            if (/^\[[xX]\] /.test(liText)) { this.convertLiToTask(liNode, true); return; }
        }

        const blockText = block.textContent.slice(0, getOffsetInBlock(block, node, range.startOffset));
        const triggers = [
            { re: /^# $/, fn: () => this.applyBlockAndStrip(block, 'h1', 2) },
            { re: /^## $/, fn: () => this.applyBlockAndStrip(block, 'h2', 3) },
            { re: /^### $/, fn: () => this.applyBlockAndStrip(block, 'h3', 4) },
            { re: /^> $/, fn: () => this.applyBlockAndStrip(block, 'blockquote', 2) },
            { re: /^- $/, fn: () => this.applyListAndStrip(block, 'insertUnorderedList', 2) },
            { re: /^\* $/, fn: () => this.applyListAndStrip(block, 'insertUnorderedList', 2) },
            { re: /^1\. $/, fn: () => this.applyListAndStrip(block, 'insertOrderedList', 3) }
        ];
        for (const t of triggers) {
            if (t.re.test(blockText)) { t.fn(); return; }
        }
    }

    applyBlockAndStrip(block, tag, stripLen) {
        stripLeading(block, stripLen);
        const newEl = document.createElement(tag);
        newEl.innerHTML = block.innerHTML || '<br>';
        block.replaceWith(newEl);
        placeCursorAtStart(newEl);
        this.saveContent();
        this.scheduleOutline();
    }

    applyListAndStrip(block, command, stripLen) {
        stripLeading(block, stripLen);
        placeCursorAtStart(block);
        document.execCommand(command);
        this.saveContent();
    }

    /* ---------- Keyboard shortcuts ---------- */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Slash menu nav
            if (this.slashActive) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.slashIndex = (this.slashIndex + 1) % this.slashFiltered.length;
                    this.renderSlashMenu(); return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.slashIndex = (this.slashIndex - 1 + this.slashFiltered.length)
                        % this.slashFiltered.length;
                    this.renderSlashMenu(); return;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const cmd = this.slashFiltered[this.slashIndex];
                    if (cmd) this.runSlashCommand(cmd);
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault(); this.closeSlashMenu(); return;
                }
            }

            // Esc handlers
            if (e.key === 'Escape') {
                if (this.helpModal.classList.contains('is-open')) {
                    this.helpModal.classList.remove('is-open');
                    this.helpModal.setAttribute('aria-hidden', 'true');
                    return;
                }
                if (this.linkModal.classList.contains('is-open')) {
                    this.linkModal.classList.remove('is-open');
                    this.linkModal.setAttribute('aria-hidden', 'true');
                    return;
                }
                if (this.settingsModal.classList.contains('is-open')) {
                    this.settingsModal.classList.remove('is-open');
                    this.settingsModal.setAttribute('aria-hidden', 'true');
                    return;
                }
                if (this.tableModal.classList.contains('is-open')) {
                    this.tableModal.classList.remove('is-open');
                    this.tableModal.setAttribute('aria-hidden', 'true');
                    return;
                }
                if (this.findPanel.classList.contains('is-open')) {
                    this.toggleFindPanel(false); return;
                }
                if (document.body.classList.contains('is-focus')) {
                    this.toggleFocus(false); return;
                }
            }

            const isTypingTarget =
                e.target === this.editor ||
                e.target === this.headerInput ||
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA';

            if (e.key === '?' && !isTypingTarget) {
                e.preventDefault();
                this.helpModal.classList.add('is-open');
                this.helpModal.setAttribute('aria-hidden', 'false');
                return;
            }

            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            if (e.shiftKey) {
                const k = e.key.toLowerCase();
                if (k === 'd') { e.preventDefault(); this.themeBtn.click(); return; }
                if (k === 'e') { e.preventDefault(); this.toggleSidebar('doc'); return; }
                if (k === 'l') { e.preventDefault(); this.toggleSidebar('outline'); return; }
                return;
            }

            const key = e.key.toLowerCase();
            if (key === 's') { e.preventDefault(); this.downloadFile(); }
            else if (key === 'o') { e.preventDefault(); this.openFile(); }
            else if (key === 'f') { e.preventDefault(); this.toggleFindPanel(true); }
            else if (key === 'k') { e.preventDefault(); this.openLinkModal(); }
            else if (key === 'e') { e.preventDefault(); this.toggleInlineCode(); }
            else if (key === 'n') { e.preventDefault(); this.handleNewDoc(); }
            else if (key === ',') { e.preventDefault(); this.settingsBtn.click(); }
            else if (key === '\\' || e.code === 'Backslash') {
                e.preventDefault(); this.toggleFocus();
            }
            else if (key === 'h') {
                if (e.target === this.editor || isInsideEditor(e.target, this.editor)) {
                    e.preventDefault(); this.toggleHighlight();
                }
            }
        });
    }

    /* ---------- Drag & drop ---------- */
    setupDragAndDrop() {
        let depth = 0;
        const isFileDrag = (e) =>
            e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

        window.addEventListener('dragenter', (e) => {
            if (!isFileDrag(e)) return;
            e.preventDefault(); depth++;
            this.dropOverlay.classList.add('is-active');
        });
        window.addEventListener('dragover', (e) => {
            if (!isFileDrag(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        window.addEventListener('dragleave', (e) => {
            if (!isFileDrag(e)) return;
            depth = Math.max(0, depth - 1);
            if (depth === 0) this.dropOverlay.classList.remove('is-active');
        });
        window.addEventListener('drop', (e) => {
            if (!isFileDrag(e)) return;
            e.preventDefault(); depth = 0;
            this.dropOverlay.classList.remove('is-active');
            const file = e.dataTransfer.files?.[0];
            if (file) this.readFileIntoNewDoc(file);
        });
    }

    /* ---------- Find & Replace ---------- */
    setupFindPanel() {
        document.getElementById('findClose').addEventListener('click', () => this.toggleFindPanel(false));
        document.getElementById('findNext').addEventListener('click', () => this.findStep(1));
        document.getElementById('findPrev').addEventListener('click', () => this.findStep(-1));
        document.getElementById('replaceOne').addEventListener('click', () => this.replaceCurrent());
        document.getElementById('replaceAll').addEventListener('click', () => this.replaceAll());
        this.findInput.addEventListener('input', () => this.runFind());
        this.findCaseEl.addEventListener('change', () => this.runFind());
        this.findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.findStep(e.shiftKey ? -1 : 1);
            }
        });
    }

    toggleFindPanel(open) {
        const isOpen = this.findPanel.classList.contains('is-open');
        const target = open === undefined ? !isOpen : open;
        if (target) {
            this.findPanel.classList.add('is-open');
            this.findPanel.setAttribute('aria-hidden', 'false');
            setTimeout(() => { this.findInput.focus(); this.findInput.select(); }, 30);
            this.runFind();
        } else {
            this.findPanel.classList.remove('is-open');
            this.findPanel.setAttribute('aria-hidden', 'true');
            this.clearFindHighlights();
            this.editor.focus();
        }
    }

    runFind() {
        this.clearFindHighlights();
        const query = this.findInput.value;
        if (!query) {
            this.findCountEl.textContent = '0/0';
            this.findMatches = []; this.findIndex = -1; return;
        }
        const caseSensitive = this.findCaseEl.checked;
        const walker = document.createTreeWalker(this.editor, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        let n; while ((n = walker.nextNode())) nodes.push(n);
        const needle = caseSensitive ? query : query.toLowerCase();
        for (const node of nodes) {
            if (!node.parentNode || node.parentNode.classList?.contains('find-match')) continue;
            const text = node.textContent;
            const haystack = caseSensitive ? text : text.toLowerCase();
            let from = 0;
            const segments = [];
            while (from < haystack.length) {
                const idx = haystack.indexOf(needle, from);
                if (idx === -1) break;
                segments.push({ start: idx, end: idx + needle.length });
                from = idx + needle.length;
                if (needle.length === 0) break;
            }
            if (!segments.length) continue;
            const frag = document.createDocumentFragment();
            let cursor = 0;
            for (const seg of segments) {
                if (seg.start > cursor)
                    frag.appendChild(document.createTextNode(text.slice(cursor, seg.start)));
                const mark = document.createElement('mark');
                mark.className = 'find-match';
                mark.textContent = text.slice(seg.start, seg.end);
                frag.appendChild(mark);
                cursor = seg.end;
            }
            if (cursor < text.length)
                frag.appendChild(document.createTextNode(text.slice(cursor)));
            node.parentNode.replaceChild(frag, node);
        }
        this.findMatches = Array.from(this.editor.querySelectorAll('mark.find-match'));
        this.findIndex = this.findMatches.length ? 0 : -1;
        this.highlightCurrent();
        this.updateFindCount();
    }

    findStep(direction) {
        if (!this.findMatches.length) return;
        this.findIndex = (this.findIndex + direction + this.findMatches.length)
            % this.findMatches.length;
        this.highlightCurrent();
        this.updateFindCount();
    }

    highlightCurrent() {
        this.findMatches.forEach((m, i) =>
            m.classList.toggle('current', i === this.findIndex));
        const current = this.findMatches[this.findIndex];
        if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    updateFindCount() {
        const total = this.findMatches.length;
        const idx = total ? this.findIndex + 1 : 0;
        this.findCountEl.textContent = `${idx}/${total}`;
    }

    clearFindHighlights() {
        this.editor.querySelectorAll('mark.find-match').forEach(m => {
            const parent = m.parentNode;
            while (m.firstChild) parent.insertBefore(m.firstChild, m);
            parent.removeChild(m);
        });
        this.editor.normalize();
        this.findMatches = []; this.findIndex = -1;
    }

    replaceCurrent() {
        if (!this.findMatches.length) return;
        const current = this.findMatches[this.findIndex];
        if (!current) return;
        const replacement = this.replaceInput.value;
        current.parentNode.replaceChild(document.createTextNode(replacement), current);
        this.editor.normalize();
        this.saveContent();
        this.runFind();
    }

    replaceAll() {
        if (!this.findMatches.length) return;
        const replacement = this.replaceInput.value;
        const count = this.findMatches.length;
        this.findMatches.forEach(m =>
            m.parentNode.replaceChild(document.createTextNode(replacement), m));
        this.editor.normalize();
        this.findMatches = []; this.findIndex = -1;
        this.updateFindCount();
        this.saveContent();
        showToast(`Replaced ${count} match${count === 1 ? '' : 'es'}`, 'success');
        this.runFind();
    }

    /* ---------- Word count / empty state ---------- */
    updateWordCount() {
        const text = this.editor.innerText || this.editor.textContent || '';
        const trimmed = text.trim();
        const words = trimmed ? trimmed.split(/\s+/).length : 0;
        const characters = text.length;
        this.wordCountEl.textContent = `Words: ${words} | Characters: ${characters}`;
        const minutes = Math.max(0, Math.ceil(words / 200));
        this.readingTimeEl.textContent = `~${minutes} min read`;
    }

    updateEmptyState() {
        const isEmpty =
            this.editor.textContent.trim() === '' &&
            (this.editor.innerHTML.trim() === '' || this.editor.innerHTML === '<br>');
        this.editorCard.classList.toggle('is-empty', isEmpty);
        if (isEmpty) {
            this.editor.setAttribute('data-placeholder',
                'Start typing your rich text here... (try /, # , > , - )');
        } else {
            this.editor.removeAttribute('data-placeholder');
        }
    }

    /* ---------- File System Access API ---------- */
    async openFile() {
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Text / HTML / Markdown',
                        accept: {
                            'text/html': ['.html', '.htm'],
                            'text/plain': ['.txt'],
                            'text/markdown': ['.md']
                        }
                    }], multiple: false
                });
                const file = await handle.getFile();
                this.currentFileHandle = handle;
                await this.readFileIntoNewDoc(file);
                return;
            } catch (e) {
                if (e?.name === 'AbortError') return;
                console.warn('showOpenFilePicker failed, falling back:', e);
            }
        }
        this.openFileInput.click();
    }

    async readFileIntoNewDoc(file) {
        try {
            const text = await file.text();
            const isHtml =
                /\.html?$/i.test(file.name) ||
                /^\s*<(!doctype|html|body|div|p|h[1-6]|span|br|ul|ol|li)\b/i.test(text);
            const content = isHtml
                ? text
                : text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\r?\n/g, '<br>');
            const base = file.name.replace(/\.[^.]+$/, '') || 'Imported';
            await this.flushSave();
            const doc = await this.createDoc(base);
            doc.content = content;
            doc.updatedAt = Date.now();
            await saveDoc(doc);
            const entry = this.docIndex.find(d => d.id === doc.id);
            if (entry) { entry.updatedAt = doc.updatedAt; await saveDocIndex(this.docIndex); }
            await this.switchDoc(doc.id);
            await this.updateStorageSize();
            showToast('Imported: ' + file.name, 'success');
        } catch (e) {
            console.error(e);
            showToast('Could not read file', 'error', 3500);
        }
    }

    async downloadFile() {
        const title = (this.headerInput.value || 'document').trim() || 'document';
        const safeTitle = title.replace(/[\\/:*?"<>|]+/g, '_');
        const filename = safeTitle + '.html';
        const html = this.buildExportHtml(title);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'HTML document',
                        accept: { 'text/html': ['.html', '.htm'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                this.currentFileHandle = handle;
                showToast('Saved: ' + handle.name, 'success');
                return;
            } catch (e) {
                if (e?.name === 'AbortError') return;
                console.warn('showSaveFilePicker failed, falling back:', e);
            }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded ' + filename, 'success');
    }

    buildExportHtml(title) {
        const safeTitle = String(title)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>
  body { font-family: "SUSE Mono", monospace; max-width: 820px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #222; }
  h1, h2, h3 { line-height: 1.3; }
  blockquote { border-left: 4px solid #888; margin: 1em 0; padding: 0.2em 1em; color: #555; background: #f7f7f7; }
  pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
  code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; }
  pre code { background: transparent; padding: 0; }
  mark { background: #fff59d; padding: 0 2px; border-radius: 3px; }
  a { color: #2563eb; }
</style>
</head>
<body>
<h1>${safeTitle}</h1>
${this.editor.innerHTML}
</body>
</html>`;
    }
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
    await migrateAll();
    await initTheme();
    const editor = new RichTextEditor();
    await editor.init();
});
