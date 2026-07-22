import './UiStatePanel.css'

export type UiStatePanelKind =
  | 'loading'
  | 'error'
  | 'empty'

type UiStatePanelProps = {
  kind: UiStatePanelKind
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function UiStatePanel({
  kind,
  title,
  message,
  actionLabel,
  onAction,
}: UiStatePanelProps) {
  const role =
    kind === 'loading'
      ? 'status'
      : kind === 'error'
        ? 'alert'
        : undefined

  return (
    <div
      className={`ui-state-panel ui-state-panel-`}
      role={role}
      aria-live={
        kind === 'loading'
          ? 'polite'
          : undefined
      }
    >
      {kind === 'loading' ? (
        <span
          className="ui-state-spinner"
          aria-hidden="true"
        />
      ) : (
        <span
          className="ui-state-symbol"
          aria-hidden="true"
        >
          {kind === 'error' ? '!' : '—'}
        </span>
      )}

      <div className="ui-state-content">
        {title ? <h2>{title}</h2> : null}
        <p>{message}</p>

        {actionLabel && onAction ? (
          <button
            type="button"
            className="secondary-button"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
