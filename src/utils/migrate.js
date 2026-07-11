import { get, set, del, keys } from 'idb-keyval'
import { genId, saveDoc, saveDocIndex, saveCurrentDocId } from '../hooks/useIndexedDB'

/**
 * Migrate legacy data from the old vanilla JS editor.
 * 
 * Old format stored:
 * - 'docs:index': [{id, title, pinned, updatedAt}]
 * - 'doc:<id>': {id, title, content (HTML), pinned, createdAt, updatedAt}
 * - 'headerTitle', 'richContent' (very old single-doc format)
 * 
 * New format stores content as Markdown strings.
 * This migration converts HTML content to Markdown.
 */
export async function migrateLegacyData() {
  const migrated = await get('migrated_to_react')
  if (migrated) return false

  const allKeys = await keys()
  const docKeys = allKeys.filter((k) => String(k).startsWith('doc:'))
  let didMigrate = false

  for (const key of docKeys) {
    const doc = await get(key)
    if (!doc || !doc.content) continue

    // Check if content looks like HTML (has tags)
    if (doc.content.includes('<') && doc.content.includes('>') && /<[a-z][\s\S]*>/i.test(doc.content)) {
      doc.content = htmlToMarkdown(doc.content)
      await set(key, doc)
      didMigrate = true
    }
  }

  await set('migrated_to_react', true)
  return didMigrate
}

/**
 * Simple HTML to Markdown converter.
 * Handles the common elements the old editor produced.
 */
function htmlToMarkdown(html) {
  // Use a temporary DOM element to parse
  const div = document.createElement('div')
  div.innerHTML = html

  let md = ''
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const tag = node.tagName.toLowerCase()
    const children = Array.from(node.childNodes).map(walk).join('')

    switch (tag) {
      case 'h1': return `# ${children.trim()}\n\n`
      case 'h2': return `## ${children.trim()}\n\n`
      case 'h3': return `### ${children.trim()}\n\n`
      case 'p': return `${children.trim()}\n\n`
      case 'br': return '\n'
      case 'strong':
      case 'b': return `**${children}**`
      case 'em':
      case 'i': return `*${children}*`
      case 'code':
        if (node.parentElement?.tagName === 'PRE') return children
        return `\`${children}\``
      case 'pre': {
        const code = node.querySelector('code')
        const text = code ? code.textContent : node.textContent
        return `\`\`\`\n${text.trim()}\n\`\`\`\n\n`
      }
      case 'blockquote': return children.split('\n').filter(Boolean).map((l) => `> ${l}`).join('\n') + '\n\n'
      case 'a': {
        const href = node.getAttribute('href') || ''
        return `[${children}](${href})`
      }
      case 'mark': return `==${children}==`
      case 's':
      case 'del': return `~~${children}~~`
      case 'ul': return children + '\n'
      case 'ol': return children + '\n'
      case 'li': {
        const parent = node.parentElement
        if (parent?.tagName === 'OL') {
          const idx = Array.from(parent.children).indexOf(node) + 1
          return `${idx}. ${children.trim()}\n`
        }
        // Check for task item
        const checkbox = node.querySelector('input[type="checkbox"]')
        if (checkbox) {
          const checked = checkbox.checked || checkbox.hasAttribute('checked')
          const text = children.replace(/^\s*/, '').replace(/^[\[\]x ]+/, '')
          return `- [${checked ? 'x' : ' '}] ${text.trim()}\n`
        }
        return `- ${children.trim()}\n`
      }
      case 'hr': return '---\n\n'
      case 'table': return convertTable(node) + '\n\n'
      case 'img': {
        const src = node.getAttribute('src') || ''
        const alt = node.getAttribute('alt') || ''
        return `![${alt}](${src})`
      }
      case 'div': return children + '\n'
      default: return children
    }
  }

  md = Array.from(div.childNodes).map(walk).join('')
  // Clean up excessive newlines
  return md.replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function convertTable(table) {
  const rows = []
  table.querySelectorAll('tr').forEach((tr) => {
    const cells = []
    tr.querySelectorAll('th, td').forEach((cell) => {
      cells.push(cell.textContent.trim().replace(/\|/g, '\\|'))
    })
    rows.push(cells)
  })

  if (!rows.length) return ''

  const lines = []
  lines.push('| ' + rows[0].join(' | ') + ' |')
  lines.push('| ' + rows[0].map(() => '---').join(' | ') + ' |')
  for (let i = 1; i < rows.length; i++) {
    lines.push('| ' + rows[i].join(' | ') + ' |')
  }
  return lines.join('\n')
}

export { htmlToMarkdown }
