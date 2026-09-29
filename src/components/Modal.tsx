import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const oldOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      )
      const first = controls[0]
      const last = controls.at(-1)
      if (!first || !last) return
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', onKeyDown)
      if (!document.querySelector('[role="dialog"]') && previouslyFocused?.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={dialogRef} className={'modal-card' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-top">
          <span className="eyebrow dark">ATLAS ATHENS</span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog" autoFocus><X size={20} /></button>
        </div>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
