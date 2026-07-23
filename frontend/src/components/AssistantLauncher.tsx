import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import './AssistantLauncher.css'

export const SPLINE_ASSISTANT_URL =
  'https://my.spline.design/genkubgreetingrobot-cYUIXfKUPa61oDFOJQTkpTbY/'

export const ASSISTANT_COLLAPSED_STORAGE_KEY =
  'safebank:assistant-collapsed'

const COMPACT_VIEWPORT_QUERY =
  '(max-width: 900px)'

type AssistantLauncherProps = {
  openLabel: string
  closeLabel: string
  dialogLabel: string
  robotTitle: string
  neonLabel: string
  children: ReactNode
}

function readStoredCollapsedState() {
  try {
    const storedValue =
      window.localStorage.getItem(
        ASSISTANT_COLLAPSED_STORAGE_KEY,
      )

    if (storedValue === null) {
      return true
    }

    return storedValue === 'true'
  } catch {
    return true
  }
}

function readCompactViewport() {
  if (
    typeof window.matchMedia !== 'function'
  ) {
    return false
  }

  return window.matchMedia(
    COMPACT_VIEWPORT_QUERY,
  ).matches
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

  const [
    isCollapsed,
    setIsCollapsed,
  ] = useState(
    readStoredCollapsedState,
  )

  const [
    isCompactViewport,
    setIsCompactViewport,
  ] = useState(
    readCompactViewport,
  )

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null)

  const previousFocusRef =
    useRef<HTMLElement | null>(null)

  const showRobotPreview =
    !isCollapsed &&
    !isCompactViewport

  const closeDialog = () => {
    setIsOpen(false)
  }

  const openDialog = () => {
    setIsOpen(true)
  }

  const showPreview = () => {
    setIsCollapsed(false)

    try {
      window.localStorage.setItem(
        ASSISTANT_COLLAPSED_STORAGE_KEY,
        'false',
      )
    } catch {
      // The launcher remains usable when storage
      // is blocked by the browser.
    }
  }

  const collapsePreview = () => {
    setIsCollapsed(true)

    try {
      window.localStorage.setItem(
        ASSISTANT_COLLAPSED_STORAGE_KEY,
        'true',
      )
    } catch {
      // The launcher remains usable when storage
      // is blocked by the browser.
    }
  }

  useEffect(() => {
    if (
      typeof window.matchMedia !== 'function'
    ) {
      return
    }

    const mediaQuery = window.matchMedia(
      COMPACT_VIEWPORT_QUERY,
    )

    const updateViewport = () => {
      setIsCompactViewport(
        mediaQuery.matches,
      )
    }

    updateViewport()

    mediaQuery.addEventListener?.(
      'change',
      updateViewport,
    )

    return () => {
      mediaQuery.removeEventListener?.(
        'change',
        updateViewport,
      )
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previousFocusRef.current =
      document.activeElement instanceof
      HTMLElement
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
        setIsOpen(false)
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

  return (
    <>
      <div
        className={[
          'assistant-launcher',
          showRobotPreview
            ? 'assistant-launcher-preview-mode'
            : 'assistant-launcher-compact-mode',
          isOpen
            ? 'assistant-launcher-is-open'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showRobotPreview ? (
          <div className="assistant-launcher-preview">
            <div className="assistant-launcher-label">
              <span
                className="assistant-launcher-status-dot"
                aria-hidden="true"
              />

              <span>{neonLabel}</span>
            </div>

            <button
              type="button"
              className="assistant-launcher-collapse"
              aria-label={closeLabel}
              title={closeLabel}
              onClick={collapsePreview}
            >
              <span aria-hidden="true">
                ×
              </span>
            </button>

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
              className="assistant-launcher-preview-trigger"
              aria-label={openLabel}
              aria-expanded={isOpen}
              aria-controls={dialogId}
              title={openLabel}
              onClick={openDialog}
            />
          </div>
        ) : (
          <div className="assistant-launcher-compact-shell">
            <button
              type="button"
              className="assistant-launcher-compact"
              aria-label={openLabel}
              aria-expanded={isOpen}
              aria-controls={dialogId}
              title={openLabel}
              onClick={openDialog}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="assistant-launcher-icon"
              >
                <path
                  d="M12 3a7 7 0 0 0-7 7v3.2A3 3 0 0 0 7 16v1a2 2 0 0 0 2 2h1.4l1.1 1.4a.65.65 0 0 0 1 0L13.6 19H15a2 2 0 0 0 2-2v-1a3 3 0 0 0 2-2.8V10a7 7 0 0 0-7-7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                <path
                  d="M9 11.5h.01M15 11.5h.01M9.5 15h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <span className="assistant-launcher-compact-label">
                {neonLabel}
              </span>
            </button>

            {!isCompactViewport ? (
              <button
                type="button"
                className="assistant-launcher-preview-toggle"
                aria-label={robotTitle}
                title={robotTitle}
                onClick={showPreview}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 5c5.3 0 8.6 5.2 8.6 7s-3.3 7-8.6 7S3.4 13.8 3.4 12 6.7 5 12 5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="2.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {isOpen ? (
        <div
          className="assistant-launcher-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDialog()
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
              <div>
                <p className="assistant-launcher-kicker">
                  SafeBank
                </p>

                <p className="assistant-launcher-title">
                  {dialogLabel}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="assistant-launcher-close"
                aria-label={closeLabel}
                onClick={closeDialog}
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