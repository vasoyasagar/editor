import { useState, useCallback, useRef, useEffect } from 'react'
import { editorViewCtx } from '@milkdown/kit/core'
import { useEditorCtx } from '../Editor/EditorContext'
import useUIStore from '../../store/useUIStore'
import './FindPanel.css'

function FindPanel() {
  const findPanelOpen = useUIStore((s) => s.findPanelOpen)
  const toggleFindPanel = useUIStore((s) => s.toggleFindPanel)
  const { getInstance, loading } = useEditorCtx()

  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (findPanelOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [findPanelOpen])

  const getMatches = useCallback(() => {
    if (loading || !query) return []
    const editor = getInstance()
    if (!editor) return []

    const matches = []
    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { doc } = view.state
        const text = doc.textContent
        const needle = caseSensitive ? query : query.toLowerCase()
        const haystack = caseSensitive ? text : text.toLowerCase()
        let from = 0
        while (from < haystack.length) {
          const idx = haystack.indexOf(needle, from)
          if (idx === -1) break
          matches.push({ from: idx, to: idx + needle.length })
          from = idx + needle.length
        }
      })
    } catch { /* editor not ready */ }
    return matches
  }, [loading, query, caseSensitive, getInstance])

  const runFind = useCallback(() => {
    const matches = getMatches()
    setMatchCount(matches.length)
    if (matches.length > 0) {
      const idx = Math.min(currentIndex, matches.length - 1)
      setCurrentIndex(idx)
      scrollToMatch(matches[idx])
    }
  }, [getMatches, currentIndex])

  useEffect(() => {
    if (findPanelOpen && query) {
      runFind()
    } else {
      setMatchCount(0)
      setCurrentIndex(0)
    }
  }, [query, caseSensitive, findPanelOpen])

  const scrollToMatch = (match) => {
    if (!match || loading) return
    const editor = getInstance()
    if (!editor) return

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { doc } = view.state

        // Convert text offset to prosemirror position
        let textOffset = 0
        let startPos = null
        let endPos = null

        doc.descendants((node, pos) => {
          if (startPos !== null && endPos !== null) return false
          if (node.isText) {
            const nodeEnd = textOffset + node.text.length
            if (startPos === null && match.from < nodeEnd) {
              startPos = pos + (match.from - textOffset)
            }
            if (endPos === null && match.to <= nodeEnd) {
              endPos = pos + (match.to - textOffset)
            }
            textOffset = nodeEnd
          }
        })

        if (startPos !== null && endPos !== null) {
          const { TextSelection } = view.state.selection.constructor === undefined
            ? require('@milkdown/prose/state')
            : { TextSelection: view.state.selection.constructor }
          try {
            const tr = view.state.tr.setSelection(
              TextSelection.create(view.state.doc, startPos, endPos)
            )
            view.dispatch(tr.scrollIntoView())
            view.focus()
          } catch { /* position may be invalid */ }
        }
      })
    } catch { /* ignore */ }
  }

  const findNext = () => {
    const matches = getMatches()
    if (!matches.length) return
    const next = (currentIndex + 1) % matches.length
    setCurrentIndex(next)
    scrollToMatch(matches[next])
  }

  const findPrev = () => {
    const matches = getMatches()
    if (!matches.length) return
    const prev = (currentIndex - 1 + matches.length) % matches.length
    setCurrentIndex(prev)
    scrollToMatch(matches[prev])
  }

  const replaceOne = () => {
    if (loading || !query || !matchCount) return
    const editor = getInstance()
    if (!editor) return

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { from, to } = view.state.selection
        if (from !== to) {
          const selectedText = view.state.doc.textBetween(from, to)
          const matches = caseSensitive
            ? selectedText === query
            : selectedText.toLowerCase() === query.toLowerCase()
          if (matches) {
            view.dispatch(view.state.tr.replaceWith(from, to,
              replacement ? view.state.schema.text(replacement) : view.state.doc.type.createAndFill().content
            ))
          }
        }
      })
    } catch { /* ignore */ }

    // Re-run find
    setTimeout(() => {
      const matches = getMatches()
      setMatchCount(matches.length)
      if (matches.length > 0) {
        const idx = Math.min(currentIndex, matches.length - 1)
        setCurrentIndex(idx)
        scrollToMatch(matches[idx])
      }
    }, 50)
  }

  const replaceAll = () => {
    if (loading || !query || !matchCount) return
    const editor = getInstance()
    if (!editor) return

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { doc } = view.state
        const text = doc.textContent
        const needle = caseSensitive ? query : query.toLowerCase()
        const haystack = caseSensitive ? text : text.toLowerCase()

        // Find all matches in reverse order to preserve positions
        const matches = []
        let from = 0
        while (from < haystack.length) {
          const idx = haystack.indexOf(needle, from)
          if (idx === -1) break
          matches.push({ from: idx, to: idx + needle.length })
          from = idx + needle.length
        }

        // Replace from end to start
        let tr = view.state.tr
        for (let i = matches.length - 1; i >= 0; i--) {
          const m = matches[i]
          // Convert text offsets to prosemirror positions
          let textOffset = 0
          let startPos = null, endPos = null
          doc.descendants((node, pos) => {
            if (startPos !== null && endPos !== null) return false
            if (node.isText) {
              const nodeEnd = textOffset + node.text.length
              if (startPos === null && m.from < nodeEnd) startPos = pos + (m.from - textOffset)
              if (endPos === null && m.to <= nodeEnd) endPos = pos + (m.to - textOffset)
              textOffset = nodeEnd
            }
          })
          if (startPos !== null && endPos !== null) {
            tr = tr.replaceWith(startPos, endPos,
              replacement ? view.state.schema.text(replacement) : []
            )
          }
        }
        view.dispatch(tr)
      })
    } catch { /* ignore */ }

    setMatchCount(0)
    setCurrentIndex(0)
  }

  if (!findPanelOpen) return null

  return (
    <aside className="find-panel" aria-label="Find and replace">
      <div className="find-row">
        <input
          ref={inputRef}
          type="text"
          className="field-input find-input"
          placeholder="Find"
          aria-label="Find text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext() }
            if (e.key === 'Escape') toggleFindPanel(false)
          }}
        />
        <span className="find-count">{matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : '0/0'}</span>
        <button className="icon-btn" onClick={findPrev} title="Previous (Shift+Enter)" aria-label="Previous match">↑</button>
        <button className="icon-btn" onClick={findNext} title="Next (Enter)" aria-label="Next match">↓</button>
        <button className="icon-btn" onClick={() => toggleFindPanel(false)} title="Close (Esc)" aria-label="Close">✖️</button>
      </div>
      <div className="find-row">
        <input
          type="text"
          className="field-input find-input"
          placeholder="Replace with"
          aria-label="Replace with"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); replaceOne() }
            if (e.key === 'Escape') toggleFindPanel(false)
          }}
        />
        <button className="toolbar-btn" onClick={replaceOne}>Replace</button>
        <button className="toolbar-btn" onClick={replaceAll}>All</button>
      </div>
      <label className="find-opt">
        <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
        Match case
      </label>
    </aside>
  )
}

export default FindPanel
