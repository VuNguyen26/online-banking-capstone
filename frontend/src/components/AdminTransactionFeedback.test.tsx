import {
  render,
  screen,
} from '@testing-library/react'
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  SEPOLIA_EXPLORER_URL,
} from '../config/network'
import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  AdminTransactionFeedback,
} from './AdminTransactionFeedback'

const TRANSACTION_HASH =
  `0x${'d'.repeat(64)}`

function renderFeedback(
  state: Parameters<
    typeof AdminTransactionFeedback
  >[0]['state'],
) {
  return render(
    <LanguageProvider>
      <AdminTransactionFeedback
        label="SavingCore update"
        state={state}
      />
    </LanguageProvider>,
  )
}

describe('AdminTransactionFeedback', () => {
  beforeEach(() => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )
  })

  it('renders nothing while idle', () => {
    const { container } =
      renderFeedback({
        phase: 'idle',
        hash: null,
        error: null,
      })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a confirming transaction with its Sepolia link', () => {
    renderFeedback({
      phase: 'confirming',
      hash: TRANSACTION_HASH,
      error: null,
    })

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'SavingCore update',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Waiting for transaction confirmation.',
    )

    expect(
      screen.getByRole('link', {
        name: 'View transaction on Etherscan',
      }),
    ).toHaveAttribute(
      'href',
      `${SEPOLIA_EXPLORER_URL}/tx/${TRANSACTION_HASH}`,
    )
  })

  it('localizes wallet rejection as an alert', () => {
    renderFeedback({
      phase: 'failed',
      hash: null,
      error:
        'The transaction was rejected in your wallet.',
    })

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'The transaction was rejected in your wallet.',
    )

    expect(
      screen.queryByRole('link'),
    ).not.toBeInTheDocument()
  })

  it('preserves an external contract error and mined hash', () => {
    renderFeedback({
      phase: 'failed',
      hash: TRANSACTION_HASH,
      error:
        'OwnableUnauthorizedAccount',
    })

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'OwnableUnauthorizedAccount',
    )

    expect(
      screen.getByRole('link', {
        name: 'View transaction on Etherscan',
      }),
    ).toBeInTheDocument()
  })
})