import { showToast } from '../components/Toast/ToastContainer'
import useDocStore from '../store/useDocStore'

/**
 * Export the current document as a .md file download.
 */
export function exportCurrentDoc() {
  const { currentDoc } = useDocStore.getState()
  if (!currentDoc) return

  const content = currentDoc.content || ''
  const title = (currentDoc.title || 'Untitled').replace(/[^a-zA-Z0-9_\- ]/g, '')
  const filename = `${title}.md`

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  showToast(`Exported "${filename}"`, 'success')
}

/**
 * Import a .md file — creates a new document with its content.
 */
export function importMarkdownFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md,.markdown,.txt'
  input.multiple = true

  input.addEventListener('change', async () => {
    const files = Array.from(input.files || [])
    if (!files.length) return

    const { createDoc, switchDoc, updateContent, persistCurrent } = useDocStore.getState()

    for (const file of files) {
      const text = await file.text()
      const title = file.name.replace(/\.(md|markdown|txt)$/i, '') || 'Imported'
      const doc = await createDoc(title)
      // Set content for the new doc
      useDocStore.setState((s) => ({
        currentDoc: { ...s.currentDoc, content: text },
      }))
      await persistCurrent()
    }

    showToast(`Imported ${files.length} file${files.length > 1 ? 's' : ''}`, 'success')
  })

  input.click()
}
