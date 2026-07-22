import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import './AssistantLauncher.css'

export const SPLINE_ASSISTANT_URL =
  'https://my.spline.design/genkubgreetingrobot-cYUIXfKUPa61oDFOJQTkpTbY/'

type AssistantLauncherProps = {
  openLabel: string
  closeLabel: string
  dialogLabel: string
  robotTitle: string
  neonLabel: string
  children: ReactNode
}

export function AssistantLauncher({
  openLabel,
  closeLabel,
  dialogLabel,
  robotTitle,
  neonLabel,
  children,
}: AssistantLauncherProps) {
  const dialogId = useId()

  const [
    isOpen,
    setIsOpen,
  ] = useState(false)

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null)

  const previousFocusRef =
    useRef<HTMLElement | null>(null)

  const close = () => {
    setIsOpen(false)
  }

  const open = () => {
    setIsOpen(true)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    closeButtonRef.current?.focus()

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        previousOverflow

      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  const neonStyle = {
    '--assistant-character-count':
      [...neonLabel].length,
  } as CSSProperties

  return (
    <>
      <div className="assistant-launcher">
        <div
          className="assistant-launcher-neon"
          aria-hidden="true"
        >
          <span className="assistant-launcher-neon-frame">
            <span
              className="assistant-launcher-neon-text"
              style={neonStyle}
            >
              {neonLabel}
            </span>
          </span>
        </div>

        <div
          className="assistant-launcher-robot"
          aria-hidden="true"
        >
          <iframe
            src={SPLINE_ASSISTANT_URL}
            title={robotTitle}
            loading="lazy"
            tabIndex={-1}
            allow="autoplay; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <button
          type="button"
          className="assistant-launcher-trigger"
          aria-label={openLabel}
          aria-expanded={isOpen}
          aria-controls={dialogId}
          onClick={open}
        />
      </div>

      {isOpen ? (
        <div
          className="assistant-launcher-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              close()
            }
          }}
        >
          <section
            id={dialogId}
            className="assistant-launcher-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={dialogLabel}
          >
            <header className="assistant-launcher-header">
              <p className="assistant-launcher-title">
                {dialogLabel}
              </p>

              <button
                ref={closeButtonRef}
                type="button"
                className="assistant-launcher-close"
                aria-label={closeLabel}
                onClick={close}
              >
                <span aria-hidden="true">
                  ×
                </span>
              </button>
            </header>

            <div className="assistant-launcher-content">
              {children}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}