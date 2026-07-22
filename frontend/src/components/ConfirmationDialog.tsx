import {
  useEffect,
  useId,
  useRef,
} from 'react'
import type {
  ReactNode,
} from 'react'

import './ConfirmationDialog.css'

type ConfirmationDialogTone =
  | 'default'
  | 'danger'

type ConfirmationDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  tone?: ConfirmationDialogTone
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  children,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef =
    useRef<HTMLElement>(null)
  const cancelButtonRef =
    useRef<HTMLButtonElement>(null)
  const previousFocusRef =
    useRef<HTMLElement | null>(null)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    if (!open) {
      return
    }

    previousFocusRef.current =
      document.activeElement instanceof
      HTMLElement
        ? document.activeElement
        : null

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancelRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current

      if (!dialog) {
        return
      }

      const focusableElements =
        Array.from(
          dialog.querySelectorAll<HTMLElement>(
            FOCUSABLE_SELECTOR,
          ),
        )

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement =
        focusableElements[0]
      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ]
      const activeElement =
        document.activeElement

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          !dialog.contains(activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (
        !event.shiftKey &&
        (activeElement === lastElement ||
          !dialog.contains(activeElement))
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        previousOverflow

      if (
        previousFocusRef.current
          ?.isConnected
      ) {
        previousFocusRef.current.focus()
      }
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      className="confirmation-overlay"
      data-testid="confirmation-overlay"
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel()
        }
      }}
    >
      <section
        ref={dialogRef}
        className={`confirmation-dialog confirmation-dialog-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
      >
        <div className="confirmation-dialog-header">
          <h2 id={titleId}>{title}</h2>

          {description ? (
            <p id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>

        {children ? (
          <div className="confirmation-dialog-content">
            {children}
          </div>
        ) : null}

        <div className="confirmation-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={
              tone === 'danger'
                ? 'danger-button'
                : 'primary-button'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}