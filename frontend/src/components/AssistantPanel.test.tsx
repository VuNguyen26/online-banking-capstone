import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type {
  AssistantAnswer,
  AssistantClient,
} from '../ai/models'
import {
  AssistantPanel,
  type AssistantPanelLabels,
} from './AssistantPanel'

type TestContext = {
  snapshot: string
}

const CONTEXT: TestContext = {
  snapshot: 'verified-state',
}

const ANSWER: AssistantAnswer = {
  mode: 'banking',
  language: 'en',
  sections: [
    {
      kind: 'fact',
      text: 'Verified fact.',
    },
    {
      kind: 'explanation',
      text: 'Deterministic explanation.',
    },
    {
      kind: 'caution',
      text: 'Testnet caution.',
    },
    {
      kind: 'next-step',
      text: 'Review the interface.',
    },
  ],
}

const LABELS: AssistantPanelLabels = {
  questionLabel: 'Question',
  questionPlaceholder:
    'Ask about SafeBank',
  suggestedQuestionsLabel:
    'Suggested questions',
  submit: 'Ask assistant',
  submitting: 'Analyzing...',
  clear: 'Clear',
  responseHeading:
    'Assistant response',
  loadingMessage:
    'Analyzing verified data.',
  failureMessage:
    'Assistant unavailable.',
  characterCount: (
    current,
    maximum,
  ) => `${current}/${maximum}`,
  validationMessages: {
    empty: 'Question is required.',
    'too-long':
      'Question is too long.',
    'url-not-supported':
      'URLs are not supported.',
  },
  sectionLabels: {
    fact: 'Fact',
    explanation: 'Explanation',
    caution: 'Caution',
    'next-step': 'Next step',
  },
}

function renderPanel(
  client: AssistantClient<TestContext>,
) {
  return render(
    <AssistantPanel
      title="SafeBank assistant"
      description="Explain verified state."
      readOnlyNotice="Read-only advisory."
      language="en"
      context={CONTEXT}
      client={client}
      suggestedQuestions={[
        'Explain the vault',
        'Review saving plans',
      ]}
      labels={LABELS}
    />,
  )
}

describe('AssistantPanel', () => {
  it('renders its read-only boundary', () => {
    renderPanel({
      ask: vi.fn(
        async () => ANSWER,
      ),
    })

    expect(
      screen.getByRole('heading', {
        name: 'SafeBank assistant',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Read-only advisory.',
      ),
    ).toBeInTheDocument()
  })

  it('fills the input from a suggested question without submitting automatically', async () => {
    const user = userEvent.setup()

    const ask = vi.fn(
      async () => ANSWER,
    )

    renderPanel({ ask })

    const textbox =
      screen.getByRole('textbox', {
        name: 'Question',
      })

    await user.click(
      screen.getByRole('button', {
        name: 'Explain the vault',
      }),
    )

    expect(textbox).toHaveValue(
      'Explain the vault',
    )

    expect(textbox).toHaveFocus()
    expect(ask).not.toHaveBeenCalled()
  })

  it('shows deterministic input validation before calling the client', async () => {
    const user = userEvent.setup()
    const ask = vi.fn(
      async () => ANSWER,
    )

    renderPanel({ ask })

    await user.click(
      screen.getByRole('button', {
        name: 'Ask assistant',
      }),
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Question is required.',
    )

    expect(ask).not.toHaveBeenCalled()
  })

  it('submits normalized input and renders plain-text answer sections', async () => {
    const user = userEvent.setup()

    const scrollIntoView =
      vi.fn()

    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      {
        configurable: true,
        writable: true,
        value: scrollIntoView,
      },
    )

    const ask = vi.fn(
      async () => ANSWER,
    )

    renderPanel({ ask })

    await user.type(
      screen.getByRole('textbox', {
        name: 'Question',
      }),
      '  Explain   the vault  ',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Ask assistant',
      }),
    )

    expect(ask).toHaveBeenCalledWith(
      {
        question:
          'Explain the vault',
        language: 'en',
        context: CONTEXT,
      },
      expect.any(AbortSignal),
    )

    expect(
      await screen.findByText(
        'Verified fact.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Testnet caution.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Next step',
      }),
    ).toBeInTheDocument()

    expect(
      scrollIntoView,
    ).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('shows a safe fallback when the client fails', async () => {
    const user = userEvent.setup()

    renderPanel({
      ask: vi.fn(async () => {
        throw new Error(
          'Internal provider detail',
        )
      }),
    })

    await user.type(
      screen.getByRole('textbox', {
        name: 'Question',
      }),
      'Explain risk',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Ask assistant',
      }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'Assistant unavailable.',
    )

    expect(
      screen.queryByText(
        'Internal provider detail',
      ),
    ).not.toBeInTheDocument()
  })

  it('aborts an in-flight request when unmounted', async () => {
    const user = userEvent.setup()
    let capturedSignal:
      AbortSignal | undefined

    const view = renderPanel({
      ask: vi.fn(
        (_request, signal) => {
          capturedSignal = signal

          return new Promise<AssistantAnswer>(
            () => {
              // Intentionally pending.
            },
          )
        },
      ),
    })

    await user.type(
      screen.getByRole('textbox', {
        name: 'Question',
      }),
      'Explain the vault',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Ask assistant',
      }),
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Analyzing verified data.',
    )

    view.unmount()

    expect(
      capturedSignal?.aborted,
    ).toBe(true)
  })
})