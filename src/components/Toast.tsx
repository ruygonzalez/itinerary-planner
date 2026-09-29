import { CheckCircle2, TriangleAlert, X } from 'lucide-react'

export interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'warning' | 'error'
}

export function Toast({
  message,
  onClose,
}: {
  message: ToastMessage | null
  onClose: () => void
}) {
  if (!message) return null
  return (
    <div className={'toast toast-' + message.type} role={message.type === 'error' ? 'alert' : 'status'}>
      {message.type === 'success' ? <CheckCircle2 size={19} /> : <TriangleAlert size={19} />}
      <span>{message.text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button>
    </div>
  )
}
