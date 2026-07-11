import useUIStore from '../../store/useUIStore'
import './FocusExit.css'

function FocusExit() {
  const focusMode = useUIStore((s) => s.focusMode)
  const setFocusMode = useUIStore((s) => s.setFocusMode)

  if (!focusMode) return null

  return (
    <button
      className="focus-exit"
      onClick={() => setFocusMode(false)}
      title="Exit focus mode (Esc / Ctrl+\\)"
      aria-label="Exit focus mode"
    >
      🎯 Exit focus
    </button>
  )
}

export default FocusExit
