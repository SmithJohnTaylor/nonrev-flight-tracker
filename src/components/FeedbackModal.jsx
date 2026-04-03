import { useEffect } from 'react'
import { useForm, ValidationError } from '@formspree/react'

export default function FeedbackModal({ onClose }) {
  const [state, handleSubmit] = useForm('xbdpaeag')

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Feedback</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {state.succeeded ? (
          <p className="feedback-success">Thanks — feedback received!</p>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-field">
              <label htmlFor="email">Email <span className="feedback-optional">(optional)</span></label>
              <input id="email" type="email" name="email" placeholder="you@example.com" />
              <ValidationError field="email" errors={state.errors} className="feedback-error" />
            </div>

            <div className="feedback-field">
              <label htmlFor="message">Message <span className="feedback-required">*</span></label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Bug report, feature request, or anything else…"
                required
              />
              <ValidationError field="message" errors={state.errors} className="feedback-error" />
            </div>

            <button type="submit" className="feedback-submit" disabled={state.submitting}>
              {state.submitting ? 'Sending…' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
