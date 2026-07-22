import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import type {
  AssistantAnswer,
  AssistantClient,
  AssistantSectionKind,
} from '../ai/models'
import {
  ASSISTANT_QUESTION_MAX_LENGTH,
  prepareAssistantQuestion,
  type AssistantQuestionIssue,
} from '../ai/safety'
import type {
  Language,
} from '../i18n/translations'
import {
  UiStatePanel,
} from './UiStatePanel'

import './AssistantPanel.css'

export type AssistantPanelLabels = {
  questionLabel: string
  questionPlaceholder: string
  submit: string
  submitting: string
  clear: string
  responseHeading: string
  loadingMessage: string
  failureMessage: string
  characterCount: (
    current: number,
    maximum: number,
  ) => string
  validationMessages: Record<
    AssistantQuestionIssue,
    string
  >
  sectionLabels: Record<
    AssistantSectionKind,
    string
  >
}

type AssistantPanelProps<TContext> = {
  title: string
  description: string
  readOnlyNotice: string
  language: Language
  context: TContext
  client: AssistantClient<TContext>
  labels: AssistantPanelLabels
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof Error &&
    error.name === 'AbortError'
  )
}

export function AssistantPanel<TContext>({
  title,
  description,
  readOnlyNotice,
  language,
  context,
  client,
  labels,
}: AssistantPanelProps<TContext>) {
  const titleId = useId()
  const descriptionId = useId()
  const noticeId = useId()
  const responseHeadingId = useId()

  const [
    question,
    setQuestion,
  ] = useState('')

  const [
    answer,
    setAnswer,
  ] = useState<AssistantAnswer | null>(
    null,
  )

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const requestId = useRef(0)
  const abortController =
    useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      requestId.current += 1
      abortController.current?.abort()
    }
  }, [])

  const clear = () => {
    requestId.current += 1
    abortController.current?.abort()
    abortController.current = null

    setQuestion('')
    setAnswer(null)
    setError(null)
    setIsLoading(false)
  }

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const prepared =
      prepareAssistantQuestion(
        question,
      )

    if (!prepared.ok) {
      setAnswer(null)
      setError(
        labels.validationMessages[
          prepared.issue
        ],
      )
      return
    }

    abortController.current?.abort()

    const controller =
      new AbortController()

    abortController.current =
      controller

    const currentRequestId =
      requestId.current + 1

    requestId.current =
      currentRequestId

    setAnswer(null)
    setError(null)
    setIsLoading(true)

    try {
      const nextAnswer =
        await client.ask(
          {
            question:
              prepared.question,
            language,
            context,
          },
          controller.signal,
        )

      if (
        requestId.current !==
          currentRequestId ||
        controller.signal.aborted
      ) {
        return
      }

      setAnswer(nextAnswer)
    } catch (requestError) {
      if (
        requestId.current !==
          currentRequestId ||
        isAbortError(requestError)
      ) {
        return
      }

      setError(labels.failureMessage)
    } finally {
      if (
        requestId.current ===
        currentRequestId
      ) {
        setIsLoading(false)
        abortController.current = null
      }
    }
  }

  const characterLength =
    [...question].length

  const hasContent =
    question.length > 0 ||
    answer !== null ||
    error !== null

  return (
    <section
      className="panel ai-assistant-panel"
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${noticeId}`}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            SafeBank AI
          </p>

          <h2 id={titleId}>
            {title}
          </h2>

          <p id={descriptionId}>
            {description}
          </p>
        </div>
      </div>

      <p
        id={noticeId}
        className="ai-assistant-notice"
      >
        {readOnlyNotice}
      </p>

      <form
        className="ai-assistant-form"
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <label htmlFor={`${titleId}-question`}>
          {labels.questionLabel}
        </label>

        <textarea
          id={`${titleId}-question`}
          rows={4}
          value={question}
          disabled={isLoading}
          maxLength={
            ASSISTANT_QUESTION_MAX_LENGTH
          }
          placeholder={
            labels.questionPlaceholder
          }
          onChange={(event) => {
            setQuestion(
              event.currentTarget.value,
            )

            if (error !== null) {
              setError(null)
            }
          }}
        />

        <div className="ai-assistant-meta">
          <span>
            {labels.characterCount(
              characterLength,
              ASSISTANT_QUESTION_MAX_LENGTH,
            )}
          </span>
        </div>

        <div className="ai-assistant-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading
              ? labels.submitting
              : labels.submit}
          </button>

          {hasContent ? (
            <button
              type="button"
              className="secondary-button"
              onClick={clear}
            >
              {labels.clear}
            </button>
          ) : null}
        </div>
      </form>

      {isLoading ? (
        <UiStatePanel
          kind="loading"
          message={labels.loadingMessage}
        />
      ) : null}

      {error !== null ? (
        <UiStatePanel
          kind="error"
          message={error}
        />
      ) : null}

      {answer !== null ? (
        <section
          className="ai-assistant-response"
          aria-labelledby={
            responseHeadingId
          }
          aria-live="polite"
        >
          <h3 id={responseHeadingId}>
            {labels.responseHeading}
          </h3>

          <div className="ai-assistant-section-list">
            {answer.sections.map(
              (section) => (
                <article
                  key={section.kind}
                  className={`ai-assistant-section ai-assistant-section-${section.kind}`}
                  data-section-kind={
                    section.kind
                  }
                >
                  <h4>
                    {
                      labels.sectionLabels[
                        section.kind
                      ]
                    }
                  </h4>

                  <p>{section.text}</p>
                </article>
              ),
            )}
          </div>
        </section>
      ) : null}
    </section>
  )
}